const express = require("express");
const router = express.Router();
const materiasController = require("../controllers/materiasController");
const verificarToken = require("../middlewares/authMiddleware");
const calificacionesController = require("../controllers/calificacionesController");
const profesorController = require("../controllers/profesorController");


router.get("/", verificarToken, materiasController.getMaterias);
router.post("/", verificarToken, materiasController.createMateria);
router.get("/:id", verificarToken, materiasController.getMateriaById);
router.get("/:id/calificaciones", verificarToken, calificacionesController.getCalificaciones);
router.post("/:id/calificaciones", verificarToken, calificacionesController.guardarCalificacion);
router.delete("/:id/calificaciones/:user_id", verificarToken, calificacionesController.eliminarCalificacion);
router.get("/:id/alumnos", verificarToken, profesorController.getAlumnosMateria);
router.put("/:id/calificaciones/:user_id", verificarToken, calificacionesController.actualizarCalificacion);


module.exports = router;