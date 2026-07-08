const express = require("express");
const router = express.Router();
const controller = require("../controllers/auth_controller");
const auth = require("../middlewares/auth_middleware");

router.post("/login", controller.login);
router.get("/me", auth, controller.me);

module.exports = router;
