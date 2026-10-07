const express = require("express");
const router = express.Router();
const finalesController = require("../controllers/finalesController");
const verificarToken = require("../middlewares/authMiddleware");

router.get("/mesas", verificarToken, finalesController.getMesas);
router.get("/mesas/:id/inscriptos", verificarToken, finalesController.getInscriptosMesa);
router.post("/inscripciones", verificarToken, finalesController.inscribirFinal);
router.delete("/inscripciones/:id", verificarToken, finalesController.bajaFinal);
router.put("/inscripciones/:id/nota", verificarToken, finalesController.cargarNotaFinal);

module.exports = router;
