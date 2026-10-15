const express = require("express");
const router = express.Router();
const reglasController = require("../controllers/reglasController");
const verificarToken = require("../middlewares/authMiddleware");
const verificarRol = require("../middlewares/roleMiddleware");

router.use(verificarToken, verificarRol("admin"));

router.get("/", reglasController.getReglas);
router.post("/correlativas", reglasController.crearCorrelativa);
router.put("/correlativas/:id", reglasController.editarCorrelativa);
router.delete("/correlativas/:id", reglasController.eliminarCorrelativa);
router.post("/equivalencias", reglasController.crearEquivalencia);
router.delete("/equivalencias/:id", reglasController.eliminarEquivalencia);

module.exports = router;
