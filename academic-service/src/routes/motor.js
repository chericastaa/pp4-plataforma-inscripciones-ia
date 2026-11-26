const express = require("express");
const router = express.Router();
const motorController = require("../controllers/motorController");
const verificarToken = require("../middlewares/authMiddleware");

router.get("/plan", verificarToken, motorController.accesoAlumno, motorController.getPlan);
router.get("/materias/:id/puede-cursar", verificarToken, motorController.accesoAlumno, motorController.getPuedeCursar);
router.get("/materias/:id/puede-rendir", verificarToken, motorController.accesoAlumno, motorController.getPuedeRendir);

module.exports = router;
