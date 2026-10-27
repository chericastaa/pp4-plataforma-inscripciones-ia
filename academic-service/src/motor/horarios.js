const db = require("../db/db");

const q = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const choque = async (materia, profesorId) => {
  if (!materia.dia || !materia.hora_inicio || !materia.hora_fin) return null;
  const [otra] = await q(
    `SELECT id, nombre FROM materias
     WHERE profesor_id = ? AND id <> ? AND cuatrimestre <=> ? AND dia = ?
     AND hora_inicio < ? AND hora_fin > ? LIMIT 1`,
    [profesorId, materia.id, materia.cuatrimestre, materia.dia, materia.hora_fin, materia.hora_inicio]
  );
  return otra || null;
};

const textoChoque = (nombre, otra) =>
  `${nombre} ya da ${otra.nombre} en ese mismo horario`;

module.exports = { q, choque, textoChoque };
