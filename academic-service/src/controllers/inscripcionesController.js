const db = require("../db/db");
const axios = require("axios");

// Si no existe en el entorno, usa localhost como fallback
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:3001';

const inscribir = async (req, res) => {
  const { user_id, materia_id } = req.body;

  try {
    // AHORA USA LA VARIABLE DE ARRIBA:
    const userResponse = await axios.get(
      `${USERS_SERVICE_URL}/usuarios/${user_id}`,
      { headers: { Authorization: req.headers.authorization } }
    );

    const user = userResponse.data;

    if (!user) {
      return res.status(404).json({ message: "Usuario no existe" });
    }

    if (user.rol !== "alumno") {
      return res.status(403).json({
        message: "Solo alumnos pueden inscribirse"
      });
    }

    db.query(
      "SELECT * FROM inscripciones WHERE user_id = ? AND materia_id = ?",
      [user_id, materia_id],
      (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error interno del servidor" });
        }

        if (results.length > 0) {
          return res.status(400).json({
            message: "Ya está inscrito en esta materia"
          });
        }

        db.query(
          "INSERT INTO inscripciones (user_id, materia_id) VALUES (?, ?)",
          [user_id, materia_id],
          (err, result) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: "Error interno del servidor" });
            }
            res.status(201).json({
              message: "Inscripción exitosa",
              id: result.insertId,
              user_id,
              materia_id
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Error al consultar usuarios:", error.message);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getAlumnosMateria = (req, res) => {
  const materia_id = req.params.id;
  db.query(
    "SELECT * FROM inscripciones WHERE materia_id = ?",
    [materia_id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error interno del servidor" });
      }
      res.json(result);
    }
  );
};

const eliminarInscripcion = (req, res) => {
  const id = req.params.id;
  db.query(
    "DELETE FROM inscripciones WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error interno del servidor" });
      }
      res.json({ id: Number(id), deleted: true });
    }
  );
};

const getMateriasDeUsuario = (req, res) => {
  const user_id = req.params.id;
  const query = `
    SELECT m.*, i.id AS inscripcion_id
    FROM materias m
    JOIN inscripciones i ON m.id = i.materia_id
    WHERE i.user_id = ?
  `;
  db.query(query, [user_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
    res.json(result);
  });
};

const getCount = (req, res) => {
  db.query("SELECT COUNT(*) as total FROM inscripciones", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
    res.json({ total: result[0].total });
  });
};

const getAllInscripciones = (req, res) => {
  db.query("SELECT * FROM inscripciones", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error interno del servidor" });
    }

    res.json(result);
  });
};

module.exports = {
  inscribir,
  getAlumnosMateria,
  eliminarInscripcion,
  getMateriasDeUsuario,
  getCount,
  getAllInscripciones,
};