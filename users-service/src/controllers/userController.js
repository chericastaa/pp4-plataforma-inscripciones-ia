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
  db.query("SELECT id, nombre, email, rol, carrera_id FROM usuarios WHERE id = ?", [id], (err, results) => {
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
  db.query("SELECT id, nombre, email, rol, carrera_id FROM usuarios", (err, results) => {
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

// EDITAR (solo admin)
const editarUsuario = (req, res) => {
  if (req.user?.rol !== "admin") return res.status(403).json({ message: "Solo un administrador puede editar usuarios" });
  const { id } = req.params;
  const { nombre, email, password, carrera_id } = req.body;

  if (nombre !== undefined && !String(nombre).trim()) return res.status(400).json({ message: "El nombre no puede quedar vacío" });
  if (email !== undefined && !/^\S+@\S+\.\S+$/.test(String(email))) return res.status(400).json({ message: "El email no es válido" });
  if (password !== undefined && password !== "" && String(password).length < 6) return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });

  db.query("SELECT * FROM usuarios WHERE id = ?", [id], (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: "Error interno del servidor" }); }
    if (results.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
    const actual = results[0];

    const aplicar = async () => {
      const campos = [];
      const valores = [];
      if (nombre !== undefined) { campos.push("nombre = ?"); valores.push(String(nombre).trim()); }
      if (email !== undefined) { campos.push("email = ?"); valores.push(String(email).trim()); }
      if (password) { campos.push("password = ?"); valores.push(await bcrypt.hash(String(password), 10)); }
      if (carrera_id !== undefined && actual.rol === "alumno") { campos.push("carrera_id = ?"); valores.push(carrera_id ? Number(carrera_id) : null); }
      if (campos.length === 0) return res.status(400).json({ message: "No hay cambios para guardar" });
      db.query(`UPDATE usuarios SET ${campos.join(", ")} WHERE id = ?`, [...valores, id], (err2) => {
        if (err2) { console.error(err2); return res.status(500).json({ message: "Error interno del servidor" }); }
        db.query("SELECT id, nombre, email, rol, carrera_id FROM usuarios WHERE id = ?", [id], (err3, r) => {
          if (err3) { console.error(err3); return res.status(500).json({ message: "Error interno del servidor" }); }
          res.json(r[0]);
        });
      });
    };

    if (email !== undefined && String(email).trim() !== actual.email) {
      db.query("SELECT id FROM usuarios WHERE email = ? AND id <> ?", [String(email).trim(), id], (err4, dup) => {
        if (err4) { console.error(err4); return res.status(500).json({ message: "Error interno del servidor" }); }
        if (dup.length > 0) return res.status(400).json({ message: "Ese email ya lo usa otro usuario" });
        aplicar().catch(() => res.status(500).json({ message: "Error al procesar contraseña" }));
      });
    } else {
      aplicar().catch(() => res.status(500).json({ message: "Error al procesar contraseña" }));
    }
  });
};

module.exports = { register, login, getUserById, getUsuarios, eliminarUsuario, editarUsuario };