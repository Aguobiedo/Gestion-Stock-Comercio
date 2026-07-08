const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      error: "Token no enviado"
    });
  }

  // Formato esperado: Bearer TOKEN
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Token mal formado"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, usuario, iat, exp }
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Token inválido o expirado"
    });
  }
};
