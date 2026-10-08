const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verificarToken = require("../middlewares/authMiddleware");

router.post("/", userController.register);        // POST /usuarios
router.get("/", verificarToken, userController.getUsuarios);
router.get("/:id", verificarToken, userController.getUserById);
router.put("/:id", verificarToken, userController.editarUsuario);
router.delete("/:id", verificarToken, userController.eliminarUsuario);

module.exports = router;