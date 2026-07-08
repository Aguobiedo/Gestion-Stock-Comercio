const pool = require("../config/db");

/* =========================
   Función helper
   (Se usa solo en UPDATE y DELETE para mantener consistencia 
   si se edita una venta posterior a su creación)
========================= */
const actualizarTotalVenta = async (connection, ventaId) => {
  await connection.query(
    `UPDATE ventas
      SET total = (
        SELECT IFNULL(SUM(cantidad * precio_unitario), 0)
        FROM detalle_venta
        WHERE venta_id = ?
      )
      WHERE id = ?`,
    [ventaId, ventaId]
  );
};

/**
 * GET /api/detalle_venta
 * Obtiene todos los detalles de todas las ventas
 */
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT dv.id,
              dv.venta_id,
              v.fecha,
              dv.producto_id,
              p.nombre AS producto,
              dv.cantidad,
              dv.precio_unitario,
              (dv.cantidad * dv.precio_unitario) AS subtotal
       FROM detalle_venta dv
       JOIN ventas v ON v.id = dv.venta_id
       JOIN productos p ON p.id = dv.producto_id
       ORDER BY v.fecha DESC`
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los detalles de venta" });
  }
};

/**
 * GET /api/detalle_venta/venta/:id
 */
exports.getByVenta = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT dv.id,
              dv.producto_id,
              p.nombre AS producto,
              dv.cantidad,
              dv.precio_unitario,
              (dv.cantidad * dv.precio_unitario) AS subtotal
       FROM detalle_venta dv
       JOIN productos p ON p.id = dv.producto_id
       WHERE dv.venta_id = ?`,
      [id]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener detalle de venta" });
  }
};

/**
 * POST /api/detalle_venta/venta/:id
 * CORREGIDO: Se eliminó actualizarTotalVenta para evitar Deadlocks
 */
exports.create = async (req, res) => {
  const { id } = req.params; // venta_id
  const { producto_id, cantidad, precio_unitario } = req.body;

  if (!producto_id || !cantidad || !precio_unitario) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verificar Stock
    const [[producto]] = await connection.query(
      "SELECT stock_actual FROM productos WHERE id = ?",
      [producto_id]
    );

    if (!producto) {
      await connection.rollback();
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (producto.stock_actual < cantidad) {
      await connection.rollback();
      return res.status(400).json({ error: "Stock insuficiente" });
    }

    // 2. Insertar Detalle
    await connection.query(
      `INSERT INTO detalle_venta
       (venta_id, producto_id, cantidad, precio_unitario)
       VALUES (?, ?, ?, ?)`,
      [id, producto_id, cantidad, precio_unitario]
    );

    // 3. Descontar Stock
    await connection.query(
      `UPDATE productos
       SET stock_actual = stock_actual - ?
       WHERE id = ?`,
      [cantidad, producto_id]
    );

    // 4. Registrar Movimiento
    await connection.query(
      `INSERT INTO movimientos_stock
       (producto_id, tipo, cantidad)
       VALUES (?, 'SALIDA', ?)`,
      [producto_id, cantidad]
    );

    /* IMPORTANTE: 
       Se ha eliminado `await actualizarTotalVenta(connection, id);`
       Esto evita que múltiples inserciones simultáneas bloqueen 
       la tabla 'ventas' causando el error DEADLOCK.
       El total ya fue establecido al crear la cabecera de la venta.
    */

    await connection.commit();
    res.status(201).json({ message: "Detalle de venta creado correctamente" });
  } catch (error) {
    await connection.rollback();
    console.error("Error en create detalle:", error);   
    res.status(500).json({ error: "Error al crear detalle de venta" });
  } finally {
    connection.release();
  }
};

/**
 * PUT /api/detalle_venta/:detalleId
 * Mantenemos actualizarTotalVenta aquí porque las ediciones son unitarias
 */
exports.update = async (req, res) => {
  const { detalleId } = req.params;
  const { cantidad, precio_unitario } = req.body;

  if (!cantidad || !precio_unitario) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[detalle]] = await connection.query(
      "SELECT producto_id, cantidad, venta_id FROM detalle_venta WHERE id = ?",
      [detalleId]
    );

    if (!detalle) {
      await connection.rollback();
      return res.status(404).json({ error: "Detalle no encontrado" });
    }

    const diferencia = cantidad - detalle.cantidad;

    // Verificar stock si aumenta la cantidad
    if (diferencia > 0) {
      const [[producto]] = await connection.query(
        "SELECT stock_actual FROM productos WHERE id = ?",
        [detalle.producto_id]
      );

      if (producto.stock_actual < diferencia) {
        await connection.rollback();
        return res.status(400).json({ error: "Stock insuficiente" });
      }
    }

    // Actualizar detalle
    await connection.query(
      `UPDATE detalle_venta
       SET cantidad = ?, precio_unitario = ?
       WHERE id = ?`,
      [cantidad, precio_unitario, detalleId]
    );

    // Ajustar stock
    await connection.query(
      `UPDATE productos
       SET stock_actual = stock_actual - ?
       WHERE id = ?`,
      [diferencia, detalle.producto_id]
    );

    if (diferencia !== 0) {
      await connection.query(
        `INSERT INTO movimientos_stock
         (producto_id, tipo, cantidad)
         VALUES (?, 'AJUSTE', ?)`,
        [detalle.producto_id, Math.abs(diferencia)]
      );
    }

    // Aquí SÍ actualizamos el total, ya que es una edición puntual
    await actualizarTotalVenta(connection, detalle.venta_id);

    await connection.commit();
    res.json({ message: "Detalle de venta actualizado correctamente" });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: "Error al actualizar detalle de venta" });
  } finally {
    connection.release();
  }
};

/**
 * DELETE /api/detalle_venta/:detalleId
 * Mantenemos actualizarTotalVenta aquí
 */
exports.remove = async (req, res) => {
  const { detalleId } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[detalle]] = await connection.query(
      "SELECT producto_id, cantidad, venta_id FROM detalle_venta WHERE id = ?",
      [detalleId]
    );

    if (!detalle) {
      await connection.rollback();
      return res.status(404).json({ error: "Detalle no encontrado" });
    }

    await connection.query(
      "DELETE FROM detalle_venta WHERE id = ?",
      [detalleId]
    );

    // Devolver stock
    await connection.query(
      `UPDATE productos
       SET stock_actual = stock_actual + ?
       WHERE id = ?`,
      [detalle.cantidad, detalle.producto_id]
    );

    await connection.query(
      `INSERT INTO movimientos_stock
       (producto_id, tipo, cantidad)
       VALUES (?, 'INGRESO', ?)`,
      [detalle.producto_id, detalle.cantidad]
    );

    // Actualizar total tras eliminación
    await actualizarTotalVenta(connection, detalle.venta_id);

    await connection.commit();
    res.json({ message: "Detalle eliminado correctamente" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: "Error al eliminar detalle de venta" });
  } finally {
    connection.release();
  }
};