const axios = require("axios");
const db = require("../db/db");

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://localhost:3001";

async function cargarDatosAlumno(userId) {
  const q = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

  const [materias, correlativas, inscripciones, calificaciones, finales] = await Promise.all([
    q("SELECT id, codigo, nombre, carrera_id, anio, cuatrimestre, profesor_id, dia, hora_inicio, hora_fin FROM materias ORDER BY codigo IS NULL, codigo, nombre"),
    q("SELECT materia_id, materia_requerida_id FROM correlativas"),
    q("SELECT id, materia_id FROM inscripciones WHERE user_id = ?", [userId]),
    q("SELECT materia_id, parcial1, parcial2, nota FROM calificaciones WHERE user_id = ?", [userId]),
    q(`SELECT inf.id, inf.mesa_id, inf.nota, mf.materia_id, mf.fecha
       FROM inscripciones_finales inf
       JOIN mesas_finales mf ON mf.id = inf.mesa_id
       WHERE inf.user_id = ?`, [userId]),
  ]);

  return { materias, correlativas, inscripciones, calificaciones, finales };
}

async function obtenerUsuario(userId, authorization) {
  const { data } = await axios.get(`${USERS_SERVICE_URL}/usuarios/${userId}`, {
    headers: { Authorization: authorization },
  });
  return data;
}

module.exports = { cargarDatosAlumno, obtenerUsuario };
