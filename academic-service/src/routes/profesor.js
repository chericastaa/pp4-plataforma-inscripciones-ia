const express = require("express");
const router = express.Router();
const profesorController = require("../controllers/profesorController");
const verificarToken = require("../middlewares/authMiddleware");

router.get("/:id/materias", verificarToken, profesorController.getMateriasProfesor);

module.exports = router;