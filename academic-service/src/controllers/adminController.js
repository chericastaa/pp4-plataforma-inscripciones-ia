const db = require("../db/db");
const axios = require("axios");

const crearMateria = (req, res) => {
  const { nombre, profesor_id } = req.body;
  const query = `INSERT INTO materias (nombre, profesor_id) VALUES (?, ?)`;
  db.query(query, [nombre, profesor_id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Materia creada", id: result.insertId });
  });
};

const getMaterias = (req, res) => {
  db.query("SELECT * FROM materias", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

const eliminarMateria = (req, res) => {
  const materia_id = req.params.id;
  db.query(
    "SELECT COUNT(*) as total FROM inscripciones WHERE materia_id = ?",
    [materia_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result[0].total > 0) {
        return res.status(400).json({ message: "No se puede eliminar: hay alumnos inscriptos en esta materia" });
      }
      db.query("SELECT profesor_id FROM materias WHERE id = ?", [materia_id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (!result[0]) return res.status(404).json({ message: "Materia no encontrada" });
        if (result[0].profesor_id) {
          return res.status(400).json({ message: "No se puede eliminar: tiene un profesor asignado" });
        }
        db.query("DELETE FROM materias WHERE id = ?", [materia_id], (err) => {
          if (err) return res.status(500).json(err);
          res.json({ message: "Materia eliminada" });
        });
      });
    }
  );
};

const asignarProfesor = async (req, res) => {
  const materia_id = req.params.id;
  const { profesor_id } = req.body;
  try {
    const response = await axios.get(
      `${process.env.USERS_SERVICE_URL}/usuarios/${profesor_id}`,
      { headers: { Authorization: `Bearer ${req.headers.authorization?.split(" ")[1]}` } }
    );
    const usuario = response.data;
    if (!usuario) return res.status(404).json({ message: "Usuario no existe" });
    if (usuario.rol !== "profesor") return res.status(400).json({ message: "El usuario no es profesor" });
    db.query(
      `UPDATE materias SET profesor_id = ? WHERE id = ?`,
      [profesor_id, materia_id],
      (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Profesor asignado correctamente" });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Error validando usuario", error: error.message });
  }
};

const desasignarProfesor = (req, res) => {
  const materia_id = req.params.id;
  db.query(
    "UPDATE materias SET profesor_id = NULL WHERE id = ?",
    [materia_id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Profesor desasignado" });
    }
  );
};

module.exports = {
  crearMateria,
  getMaterias,
  asignarProfesor,
  desasignarProfesor,
  eliminarMateria,
};