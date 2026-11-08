const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/authMiddleware");
const confirmacionesController = require("../controllers/confirmacionesController");

router.post("/pendiente", verificarToken, confirmacionesController.crearConfirmacion);
router.post("/confirmar", verificarToken, confirmacionesController.confirmar);

module.exports = router;