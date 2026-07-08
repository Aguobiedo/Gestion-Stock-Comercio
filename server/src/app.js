const express = require("express");
const cors = require("cors");
const app = express();
const authRoutes = require("./routes/auth_routes")
const productosRoutes = require("./routes/productos_routes");
const ventasRoutes = require("./routes/ventas_routes");
const detalle_venta = require("./routes/detalle_venta_routes");

app.use(cors());
app.use(express.json())

app.get("/api/health", (req,res) => {
    res.json({status:"OK"});
});

app.use("/api/auth", authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/detalle_venta', detalle_venta);


module.exports= app; 