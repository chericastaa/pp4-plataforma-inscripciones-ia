const db = require("../db/db");


const getMaterias = (req, res) => {
  const query = "SELECT * FROM materias";

  db.query(query, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};


const createMateria = (req, res) => {
  const { nombre, profesor_id } = req.body;

  if (!nombre || !profesor_id) {
    return res.status(400).json({
      message: "Faltan nombre o profesor_id"
    });
  }

  const query =
    "INSERT INTO materias (nombre, profesor_id) VALUES (?, ?)";

  db.query(query, [nombre, profesor_id], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({
      message: "Materia creada",
      id: result.insertId
    });
  });
};


const getMateriaById = (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM materias WHERE id = ?";

  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(404).json({
        message: "Materia no encontrada"
      });
    }

    res.json(result[0]);
  });
};

module.exports = {
  getMaterias,
  createMateria,
  getMateriaById
};