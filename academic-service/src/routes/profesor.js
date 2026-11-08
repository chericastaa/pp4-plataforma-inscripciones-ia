const express = require("express");
const router = express.Router();
const profesorController = require("../controllers/profesorController");
const verificarToken = require("../middlewares/authMiddleware");
const verificarRol = require("../middlewares/roleMiddleware");

router.get("/:id/materias", verificarToken, verificarRol("profesor", "admin"),profesorController.getMateriasProfesor);

module.exports = router;