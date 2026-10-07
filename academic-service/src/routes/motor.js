const express = require("express");
const router = express.Router();
const motorController = require("../controllers/motorController");
const verificarToken = require("../middlewares/authMiddleware");

router.get("/plan", verificarToken, motorController.getPlan);
router.get("/materias/:id/puede-cursar", verificarToken, motorController.getPuedeCursar);
router.get("/materias/:id/puede-rendir", verificarToken, motorController.getPuedeRendir);

module.exports = router;
