const db = require("../db/db");
const axios = require("axios");

const getMateriasProfesor = (req, res) => {
  const profesor_id = req.params.id;
  const query = `SELECT * FROM materias WHERE profesor_id = ?`;
  db.query(query, [profesor_id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

const getAlumnosMateria = (req, res) => {
  const materia_id = req.params.id;
  db.query(
    "SELECT user_id FROM inscripciones WHERE materia_id = ?",
    [materia_id],
    async (err, result) => {
      if (err) return res.status(500).json(err);
       try {
        const alumnos = await Promise.all(
          result.map((insc) =>
            axios.get(
              `${process.env.USERS_SERVICE_URL}/usuarios/${insc.user_id}`,
              {
                headers: { Authorization: req.headers.authorization }
              }
            )
          )
        );
        res.json(
          alumnos
            .map((a) => a.data)
            .filter((u) => u.rol === "alumno")
            .map((u) => ({ id: u.id, nombre: u.nombre, email: u.email }))
        );
      } catch (error) {
        res.status(500).json({
          message: "Error comunicando con users-service",
          error: error.message
        });
      }
    }
  );
};

module.exports = { getMateriasProfesor, getAlumnosMateria };