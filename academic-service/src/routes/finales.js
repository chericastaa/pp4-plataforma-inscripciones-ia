const express = require("express");
const router = express.Router();
const finalesController = require("../controllers/finalesController");
const verificarToken = require("../middlewares/authMiddleware");
const verificarRol = require("../middlewares/roleMiddleware");

router.get("/mesas", verificarToken, finalesController.getMesas);
router.post("/mesas", verificarToken, verificarRol("admin"), finalesController.crearMesa);
router.delete("/mesas/:id", verificarToken, verificarRol("admin"), finalesController.borrarMesa);
router.get("/mesas/:id/inscriptos", verificarToken, finalesController.getInscriptosMesa);
router.post("/inscripciones", verificarToken, finalesController.inscribirFinal);
router.delete("/inscripciones/:id", verificarToken, finalesController.bajaFinal);
router.put("/inscripciones/:id/nota", verificarToken, finalesController.cargarNotaFinal);

module.exports = router;
