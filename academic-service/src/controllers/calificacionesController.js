const db = require("../db/db");

const getCalificaciones = (req, res) => {
  const materia_id = req.params.id;
  db.query(
    "SELECT * FROM calificaciones WHERE materia_id = ?",
    [materia_id],
    (err, result) => {
      if (err) {
       console.error(err);
        return res.status(500).json({message: "Error interno del servidor"});
      }
      res.json(result);
    }
  );
};

const guardarCalificacion = (req, res) => {
  const materia_id = req.params.id;
  const { user_id, parcial1, parcial2, nota, comentario } = req.body;

  if (nota < 0 || nota > 10) {
    return res.status(400).json({ message: "La nota debe estar entre 0 y 10" });
  }

  db.query(
    "INSERT INTO calificaciones (materia_id, user_id, parcial1, parcial2, nota, comentario) VALUES (?, ?, ?, ?, ?, ?)",
    [materia_id, user_id, parcial1, parcial2, nota, comentario],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error interno del servidor" });
      }
      res.status(201).json({ id: result.insertId, materia_id, user_id, parcial1, parcial2, nota, comentario });
    }
  );
};

const actualizarCalificacion = (req, res) => {
  const materia_id = req.params.id;
  const user_id = req.params.user_id;
  const { parcial1, parcial2, nota, comentario } = req.body;

  if (nota < 0 || nota > 10) {
    return res.status(400).json({ message: "La nota debe estar entre 0 y 10" });
  }

  db.query(
    "UPDATE calificaciones SET parcial1 = ?, parcial2 = ?, nota = ?, comentario = ? WHERE materia_id = ? AND user_id = ?",
    [parcial1, parcial2, nota, comentario, materia_id, user_id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error interno del servidor" });
      }
      res.json({ materia_id, user_id, parcial1, parcial2, nota, comentario });
    }
  );
};
const eliminarCalificacion = (req, res) => {
  const { id, user_id } = req.params;
  db.query(
    "DELETE FROM calificaciones WHERE materia_id = ? AND user_id = ?",
    [id, user_id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({message:"Error interno del servidor"});
      }
      res.json({ materia_id: Number(id), user_id: Number(user_id), deleted: true });
    }
  );
};

module.exports = { getCalificaciones, guardarCalificacion, eliminarCalificacion,actualizarCalificacion };