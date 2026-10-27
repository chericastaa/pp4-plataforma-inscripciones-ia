const express = require("express");
const router = express.Router();
const inscripcionesController = require("../controllers/inscripcionesController");
const verificarToken = require("../middlewares/authMiddleware");
const verificarRol = require("../middlewares/roleMiddleware");

router.get("/periodos", verificarToken, inscripcionesController.getPeriodos);
router.post("/periodos", verificarToken, verificarRol("admin"), inscripcionesController.crearPeriodo);
router.put("/periodos/:id/abrir", verificarToken, verificarRol("admin"), inscripcionesController.abrirPeriodo);
router.post("/", verificarToken, inscripcionesController.inscribir);
router.get("/materias/:id/alumnos", verificarToken, inscripcionesController.getAlumnosMateria);
router.delete("/:id", verificarToken, inscripcionesController.eliminarInscripcion);
router.get("/usuarios/:id/materias", verificarToken, inscripcionesController.getMateriasDeUsuario);
router.get("/count", verificarToken, inscripcionesController.getCount);
router.get("/", verificarToken, inscripcionesController.getAllInscripciones);

module.exports = router;