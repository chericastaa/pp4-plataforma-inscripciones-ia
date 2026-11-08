const db = require("../db/db");
const axios = require("axios");
const { ultima } = require("../motor/periodos");

const getMateriasProfesor = (req, res) => {
  const profesor_id = req.params.id;
    if (req.user.rol === "profesor" && Number(profesor_id) !== Number(req.user.id)) {
    return res.status(403).json({ message: "No podés consultar las materias de otro profesor" });
  }
  const query = `SELECT * FROM materias WHERE profesor_id = ?`;
  db.query(query, [profesor_id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

const getAlumnosMateria = (req, res) => {
  const materia_id = req.params.id;

  db.query(
    "SELECT profesor_id FROM materias WHERE id = ?",
    [materia_id],
    (err, materias) => {
      if (err) return res.status(500).json(err);
      if (!materias.length) {
        return res.status(404).json({ message: "Materia no encontrada" });
      }

      if (
        req.user.rol === "profesor" &&
        Number(materias[0].profesor_id) !== Number(req.user.id)
      ) {
        return res.status(403).json({ message: "No sos el profesor de esta materia" });
      }

      db.query(
        `SELECT i.user_id FROM inscripciones i WHERE i.materia_id = ? AND i.id = ${ultima}`,
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
    }
  );
};

module.exports = { getMateriasProfesor, getAlumnosMateria };