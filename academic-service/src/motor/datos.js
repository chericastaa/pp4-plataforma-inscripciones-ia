const axios = require("axios");
const db = require("../db/db");
const { actual } = require("./periodos");

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://localhost:3001";

async function cargarDatosAlumno(userId) {
  const q = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

  const [materias, correlativas, equivalencias, inscTodas, calTodas, finales, periodo] = await Promise.all([
    q("SELECT id, codigo, nombre, carrera_id, anio, cuatrimestre, profesor_id, dia, hora_inicio, hora_fin FROM materias ORDER BY codigo IS NULL, codigo, nombre"),
    q("SELECT materia_id, materia_requerida_id, para_cursar, para_final FROM correlativas"),
    q("SELECT materia_id, materia_equivalente_id, bidireccional FROM equivalencias"),
    q(`SELECT i.id, i.materia_id, i.periodo_id, p.nombre AS periodo FROM inscripciones i
       LEFT JOIN periodos p ON p.id = i.periodo_id
       WHERE i.user_id = ? ORDER BY i.periodo_id, i.id`, [userId]),
    q("SELECT materia_id, periodo_id, parcial1, parcial2, nota FROM calificaciones WHERE user_id = ?", [userId]),
    q(`SELECT inf.id, inf.mesa_id, inf.nota, mf.materia_id, mf.fecha
       FROM inscripciones_finales inf
       JOIN mesas_finales mf ON mf.id = inf.mesa_id
       WHERE inf.user_id = ?`, [userId]),
    actual(),
  ]);

  const mismoPeriodo = (a, b) => (a ?? null) === (b ?? null);
  const tieneNota = (i) => calTodas.some((c) => c.materia_id === i.materia_id && mismoPeriodo(c.periodo_id, i.periodo_id));

  const ultimas = new Map();
  for (const i of inscTodas) {
    if (periodo && i.periodo_id !== periodo.id && !tieneNota(i)) continue;
    ultimas.set(i.materia_id, i);
  }

  const inscripciones = [...ultimas.values()];
  const calificaciones = calTodas.filter((c) => {
    const u = ultimas.get(c.materia_id);
    return !u || mismoPeriodo(c.periodo_id, u.periodo_id);
  });

  const historial = inscTodas
    .filter((i) => ultimas.get(i.materia_id) !== i)
    .map((i) => ({
      materia_id: i.materia_id,
      periodo: i.periodo,
      cal: calTodas.find((c) => c.materia_id === i.materia_id && mismoPeriodo(c.periodo_id, i.periodo_id)) || null,
    }));

  return { materias, correlativas, equivalencias, inscripciones, calificaciones, finales, periodo, historial, ultimas };
}

async function obtenerUsuario(userId, authorization) {
  const { data } = await axios.get(`${USERS_SERVICE_URL}/usuarios/${userId}`, {
    headers: { Authorization: authorization },
  });
  return data;
}

module.exports = { cargarDatosAlumno, obtenerUsuario };
