const express = require("express");
const router = express.Router();
const materiasController = require("../controllers/materiasController");
const verificarToken = require("../middlewares/authMiddleware");
const calificacionesController = require("../controllers/calificacionesController");
const profesorController = require("../controllers/profesorController");
const verificarRol = require("../middlewares/roleMiddleware");

router.get("/", verificarToken, materiasController.getMaterias);
router.post("/", verificarToken, verificarRol("admin"), materiasController.createMateria);
router.get("/:id", verificarToken, materiasController.getMateriaById);
router.get("/:id/calificaciones", verificarToken, verificarRol("admin", "profesor"),calificacionesController.getCalificaciones);
router.post("/:id/calificaciones", verificarToken, verificarRol("admin", "profesor"),calificacionesController.guardarCalificacion);
router.delete("/:id/calificaciones/:user_id", verificarToken, verificarRol("admin", "profesor"),calificacionesController.eliminarCalificacion);
router.get("/:id/alumnos", verificarToken, verificarRol("admin", "profesor"),profesorController.getAlumnosMateria);
router.put("/:id/calificaciones/:user_id", verificarToken, verificarRol("admin", "profesor"),calificacionesController.actualizarCalificacion);


module.exports = router;