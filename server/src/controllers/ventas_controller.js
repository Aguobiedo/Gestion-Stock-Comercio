const pool = require("../config/db");

// Obtener todas las ventas
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM ventas ORDER BY fecha DESC"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las ventas" });
  }
};

// Obtener una venta por ID
exports.getOne = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM ventas WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la venta" });
  }
};

// Crear una venta
exports.create = async (req, res) => {
  const { total } = req.body;

  if (!total) {
    return res.status(400).json({ error: "El total es obligatorio" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO ventas (total) VALUES (?)",
      [total]
    );

    res.status(201).json({
      message: "Venta creada correctamente",
      id: result.insertId,
    });
  } catch (error) {
    console.error(error);  
    res.status(500).json({ error: "Error al crear la venta" });
  }
};

// Actualizar una venta (solo total)
exports.update = async (req, res) => {
  const { id } = req.params;
  const { total } = req.body;

  if (!total) {
    return res.status(400).json({ error: "El total es obligatorio" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE ventas SET total = ? WHERE id = ?",
      [total, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    res.json({ message: "Venta actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la venta" });
  }
};

// Eliminar una venta (y sus detalles)
exports.delete = async (req, res) => {
  const { id } = req.params;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

  
    await connection.query(
      "DELETE FROM detalle_venta WHERE venta_id = ?",
      [id]
    );

    
    const [result] = await connection.query(
      "DELETE FROM ventas WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    await connection.commit();
    res.json({ message: "Venta eliminada correctamente" });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: "Error al eliminar la venta" });
  } finally {
    connection.release();
  }
};

// Obtener total vendido en el día
exports.getTotalDelDia = async (req, res) => {
  try {
    const [[result]] = await pool.query(
      `
      SELECT 
        IFNULL(SUM(total), 0) AS total_dia,
        COUNT(*) AS cantidad_ventas
      FROM ventas
      WHERE DATE(fecha) = CURDATE()
      `
    );

    res.json({
      fecha: new Date().toISOString().split("T")[0],
      total: Number(result.total_dia),
      ventas: result.cantidad_ventas,
    });

  } catch (error) {
    res.status(500).json({ error: "Error al obtener total del día" });
  }
};
