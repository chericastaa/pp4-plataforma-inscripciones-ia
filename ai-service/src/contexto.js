const db = require("./db");

const hora = (h) => (h ? String(h).slice(0, 5) : "");

async function armarContexto(user) {
  const [materias] = await db.query(`
    SELECT m.id, m.nombre, m.dia, m.hora_inicio, m.hora_fin, u.nombre AS profesor,
      (SELECT COUNT(*) FROM academic_db.inscripciones i WHERE i.materia_id = m.id) AS inscriptos
    FROM academic_db.materias m
    LEFT JOIN users_db.usuarios u ON u.id = m.profesor_id
    ORDER BY m.nombre
  `);

  const [correlativas] = await db.query(`
    SELECT m.nombre AS materia, r.nombre AS requiere
    FROM academic_db.correlativas c
    JOIN academic_db.materias m ON m.id = c.materia_id
    JOIN academic_db.materias r ON r.id = c.materia_requerida_id
  `);

  let texto = "MATERIAS DE LA PLATAFORMA:\n";
  if (materias.length === 0) texto += "- Todavía no hay materias cargadas.\n";
  for (const m of materias) {
    const horario = m.dia ? `${m.dia} de ${hora(m.hora_inicio)} a ${hora(m.hora_fin)}` : "sin horario cargado";
    texto += `- ${m.nombre}: ${horario}, profesor ${m.profesor || "sin asignar"}`;
    if (user.rol !== "alumno") texto += `, ${m.inscriptos} inscriptos`;
    texto += "\n";
  }

  texto += "\nCORRELATIVAS:\n";
  if (correlativas.length === 0) texto += "- No hay correlativas cargadas.\n";
  for (const c of correlativas) texto += `- Para cursar ${c.materia} hay que tener ${c.requiere}\n`;

  if (user.rol === "alumno") {
    const [mias] = await db.query(`
      SELECT m.nombre, c.parcial1, c.parcial2, c.nota
      FROM academic_db.inscripciones i
      JOIN academic_db.materias m ON m.id = i.materia_id
      LEFT JOIN academic_db.calificaciones c ON c.materia_id = i.materia_id AND c.user_id = i.user_id
      WHERE i.user_id = ?
    `, [user.id]);

    texto += "\nMATERIAS EN LAS QUE ESTÁ INSCRIPTO EL USUARIO:\n";
    if (mias.length === 0) texto += "- No está inscripto en ninguna materia.\n";
    for (const m of mias) {
      const notas = [m.parcial1 && `parcial 1: ${m.parcial1}`, m.parcial2 && `parcial 2: ${m.parcial2}`, m.nota && `nota final: ${m.nota}`].filter(Boolean);
      texto += `- ${m.nombre}${notas.length ? ` (${notas.join(", ")})` : " (sin notas cargadas)"}\n`;
    }
  }

  if (user.rol === "profesor") {
    const dicta = materias.filter((m) => m.profesor === user.nombre).map((m) => m.nombre);
    texto += `\nMATERIAS QUE DICTA EL USUARIO: ${dicta.length ? dicta.join(", ") : "ninguna"}\n`;
  }

  if (user.rol === "admin") {
    const [[totales]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users_db.usuarios WHERE rol = 'alumno') AS alumnos,
        (SELECT COUNT(*) FROM users_db.usuarios WHERE rol = 'profesor') AS profesores,
        (SELECT COUNT(*) FROM academic_db.inscripciones) AS inscripciones
    `);
    texto += `\nRESUMEN: ${totales.alumnos} alumnos, ${totales.profesores} profesores y ${totales.inscripciones} inscripciones en total.\n`;
  }

  return texto;
}

module.exports = armarContexto;
