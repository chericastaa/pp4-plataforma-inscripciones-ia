const db = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "clave_secreta_temporal";

// REGISTER
const register = (req, res) => {
  const { nombre, dni, email, password, rol, codigoProfesor } = req.body;
  console.log("Register - body recibido:", req.body);

  if (!rol) return res.status(400).json({ message: "El rol es obligatorio" });
  if (rol === "admin") return res.status(403).json({ message: "No permitido crear admin" });
  if (rol !== "alumno" && rol !== "profesor") return res.status(400).json({ message: "Rol inválido" });
  if (rol === "profesor" && codigoProfesor !== "PROF2026") {
    return res.status(403).json({ message: "Código inválido" });
  }

  db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, results) => {
    if (err) {
  console.error("Error SELECT:", err);
  return res.status(500).json({ message: "Error interno del servidor" });
}
    if (results.length > 0) return res.status(400).json({ message: "El email ya está registrado" });

    try {
      const hash = await bcrypt.hash(password, 10);
      db.query(
        "INSERT INTO usuarios (nombre, dni, email, password, rol) VALUES (?, ?, ?, ?, ?)",
        [nombre, dni, email, hash, rol],
        (err, result) => {
          if (err) {
            console.error("Error INSERT:", err);
            return res.status(500).json({ message: "Error interno del servidor" });
          }

          const token = jwt.sign(
            { id: result.insertId, rol, nombre },
            SECRET,
            { expiresIn: "8h" }
          );

          res.status(201).json({
            token,
            user: {
              id: result.insertId,
              nombre,
              email,
              rol,
            }
          });
        }
      );
    } catch (err) {
      console.error("Error bcrypt:", err);
      return res.status(500).json({ message: "Error al procesar contraseña" });
    }
  });
};

// LOGIN
const login = (req, res) => {
  const { email, password } = req.body;
  console.log("Login - email:", email);

  db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("Error SELECT login:", err);
      return res.status(500).json({message: "Error interno del servidor "});
    }
    if (results.length === 0) return res.status(401).json({ message: "Credenciales incorrectas" });

    const usuario = results[0];
    console.log("Usuario encontrado:", usuario.email, "| hash:", usuario.password?.substring(0, 10));

    try {
      const match = await bcrypt.compare(password, usuario.password);
      console.log("¿Contraseña coincide?", match);

      if (!match) return res.status(401).json({ message: "Credenciales incorrectas" });

      const token = jwt.sign(
        { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
        SECRET,
        { expiresIn: "8h" }
      );

      res.status(201).json({
        token,
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      });
    } catch (err) {
      console.error("Error bcrypt compare:", err);
      return res.status(500).json({ message: "Error al verificar contraseña" });
    }
  });
};

// GET BY ID
const getUserById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT id, nombre, email, rol FROM usuarios WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({message: "Error interno del servidor"});
    }
    if (results.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(results[0]);
  });
};

// GET ALL
const getUsuarios = (req, res) => {
  db.query("SELECT id, nombre, email, rol FROM usuarios", (err, results) => {
    if (err){
     console.error(err);
       return res.status(500).json({message:"Error interno del servidor"});
    }
    res.json(results);
  });
};

// ELIMINAR
const eliminarUsuario = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM usuarios WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({message: "Error interno del servidor"});
    }
    if (results.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });

    const usuario = results[0];
    if (usuario.rol === "admin") {
      return res.status(403).json({ message: "No se puede eliminar un admin" });
    }

    db.query("DELETE FROM usuarios WHERE id = ?", [id], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({message: "Error interno del servidor"});
      }
      res.json({  id: Number(id), deleted: true });
    });
  });
};

module.exports = { register, login, getUserById, getUsuarios, eliminarUsuario };