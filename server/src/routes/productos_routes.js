const express = require("express");
const router = express.Router();
const controller = require("../controllers/productos_controller");
const auth = require("../middlewares/auth_middleware")

router.get("/",auth, controller.getAll); // GET /api/productos
router.get('/:id',auth, controller.getOne); // GET /api/productos/:id
router.get('/barcode/:codigo', auth, controller.getByCodigoBarra); // GET /api/productos/barcode/:codigo
router.post("/",auth, controller.create); // POST /api/productos
router.put('/:id',auth, controller.update); // PUT /api/productos/:id
router.delete('/:id', auth, controller.remove); // DELETE /api/productos/:id


module.exports = router;
