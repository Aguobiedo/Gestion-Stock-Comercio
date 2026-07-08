const express = require("express");
const router = express.Router();
const controller = require("../controllers/ventas_controller");
const auth = require("../middlewares/auth_middleware");

// Ventas
router.get("/", auth, controller.getAll);           // GET /api/ventas
router.get("/getOne/:id", auth, controller.getOne);        // GET /api/ventas/:id  /ventas/total-dia
router.get("/total-dia", auth, controller.getTotalDelDia);     // GET /api/ventas/total-dia
router.post("/", auth, controller.create);          // POST /api/ventas
router.put("/:id", auth, controller.update);        // PUT /api/ventas/:id
router.delete("/:id", auth, controller.delete);     // DELETE /api/ventas/:id


module.exports = router;
