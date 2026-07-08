const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const { comparePassword } = require("../utils/password");

exports.login = async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({
      error: "Usuario y password requeridos"
    });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE usuario = ?",
      [usuario]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        error: "Credenciales inválidas"
      });
    }

    const user = rows[0];
    const validPassword = await comparePassword(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        error: "Credenciales inválidas"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        usuario: user.usuario
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      usuario: user.usuario
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error en el login"
    });
  }
};


exports.me = async (req, res) => {
  res.json({
    id: req.user.id,
    usuario: req.user.usuario
  });
};
