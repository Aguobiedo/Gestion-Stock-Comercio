const express = require("express");
const router = express.Router();
const controller = require("../controllers/detalle_venta_controller");
const auth = require("../middlewares/auth_middleware");

 
router.get("/", auth, controller.getAll);  // GET /api/detalle_venta
router.get("/venta/:id", auth, controller.getByVenta); // GET /api/detalle_venta/venta/:id
router.post("/venta/:id", auth, controller.create);   // POST /api/detalle_venta/venta/:id
router.put("/:detalleId", auth, controller.update);  // PUT /api/detalle_venta/:detalleId
router.delete("/:detalleId", auth, controller.remove);  // DELETE /api/detalle_venta/:detalleId

module.exports = router;
