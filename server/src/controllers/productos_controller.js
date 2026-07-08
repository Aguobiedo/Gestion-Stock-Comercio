const pool= require ("../config/db");

exports.getAll = async (req,res) => {
    try{
        const [rows] = await pool.query(
            "SELECT * FROM productos WHERE activo = 1"
        );
        res.json(rows);
    }catch(error) {
        res.status(500).json({error:"Error al obtener productos"});
    }
};

exports.getOne = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM productos WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el producto" });
  }
};



exports.create = async (req, res) => {
  const { nombre, codigo_barra, precio, stock_actual, stock_minimo } = req.body;

  if (!nombre || !precio) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  try {
    await pool.query(
      `INSERT INTO productos (nombre, codigo_barra, precio, stock_actual, stock_minimo)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, codigo_barra, precio, stock_actual ?? 0, stock_minimo ?? 0]
    );

    res.status(201).json({ message: "Producto creado" });
  } catch (error) {
    res.status(500).json({ error: "Error al crear producto" });
  }
};


exports.update = async (req, res) => {
  const { id } = req.params;
  const { nombre, codigo_barra, precio, stock_actual, stock_minimo, activo } = req.body;

  try {
    await pool.query(
      `UPDATE productos 
       SET nombre = ?, codigo_barra = ?, precio = ?, stock_actual = ?, stock_minimo = ?, activo = ?
       WHERE id = ?`,
      [nombre, codigo_barra, precio, stock_actual, stock_minimo, activo, id]
    );

    res.json({ message: "Producto actualizado" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar producto" });
  }
};


exports.remove = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `UPDATE productos 
       SET activo = 0
       WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar producto" });
  }
};

exports.getByCodigoBarra = async (req, res) => {
  const { codigo } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT * FROM productos 
       WHERE codigo_barra = ? AND activo = 1`,
      [codigo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar producto" });
  }
};

