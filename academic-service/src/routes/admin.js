const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

const verificarToken = require("../middlewares/authMiddleware");
const verificarRol = require("../middlewares/roleMiddleware");


router.post(
  "/materias",
  verificarToken,
  verificarRol("admin"),
  adminController.crearMateria
);


router.get(
  "/materias",
  verificarToken,
  verificarRol("admin"),
  adminController.getMaterias
);


router.put(
  "/materias/:id/profesor",
  verificarToken,
  verificarRol("admin"),
  adminController.asignarProfesor
);

router.put(
  "/materias/:id/desasignar",
  verificarToken,
  verificarRol("admin"),
  adminController.desasignarProfesor
);

router.delete(
  "/materias/:id",
  verificarToken,
  verificarRol("admin"),
  adminController.eliminarMateria
);

module.exports = router;