const db = require("./db");

const hora = (h) => (h ? String(h).slice(0, 5) : "");
const num = (n) => (n === null || n === undefined ? null : Number(n));

function calcularEstado(c) {
  const p1 = num(c.parcial1);
  const p2 = num(c.parcial2);
  let final = num(c.nota);
  if (final === null && (p1 !== null || p2 !== null)) {
    final = p1 !== null && p2 !== null ? (p1 + p2) / 2 : p1 ?? p2;
  }
  if (final === null) return { final: null, estado: "sin notas" };
  return { final, estado: final >= 7 ? "aprobado" : "desaprobado" };
}

function detalleNotas(a) {
  const partes = [];
  if (num(a.parcial1) !== null) partes.push(`parcial 1: ${num(a.parcial1)}`);
  if (num(a.parcial2) !== null) partes.push(`parcial 2: ${num(a.parcial2)}`);
  if (a.final !== null) partes.push(`nota final: ${a.final}`);
  return partes.length ? partes.join(", ") : "sin notas cargadas";
}

async function armarContexto(user) {
  const [materias] = await db.query(`
    SELECT m.id, m.nombre, m.dia, m.hora_inicio, m.hora_fin, m.profesor_id, u.nombre AS profesor
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

  const [filas] = await db.query(`
    SELECT i.materia_id, i.user_id, u.nombre AS alumno, c.parcial1, c.parcial2, c.nota
    FROM academic_db.inscripciones i
    JOIN users_db.usuarios u ON u.id = i.user_id
    LEFT JOIN academic_db.calificaciones c ON c.materia_id = i.materia_id AND c.user_id = i.user_id
    ORDER BY u.nombre
  `);

  const alumnos = filas.map((f) => ({ ...f, ...calcularEstado(f) }));

  let texto = "REGLA DE APROBACIÓN: la nota final es el promedio de los parciales. Se aprueba con 7 o más.\n\n";

  texto += "MATERIAS DE LA PLATAFORMA:\n";
  if (materias.length === 0) texto += "- Todavía no hay materias cargadas.\n";
  for (const m of materias) {
    const horario = m.dia ? `${m.dia} de ${hora(m.hora_inicio)} a ${hora(m.hora_fin)}` : "sin horario cargado";
    texto += `- ${m.nombre}: ${horario}, profesor ${m.profesor || "sin asignar"}\n`;
  }

  texto += "\nCORRELATIVAS:\n";
  if (correlativas.length === 0) texto += "- No hay correlativas cargadas.\n";
  for (const c of correlativas) texto += `- Para cursar ${c.materia} hay que tener ${c.requiere}\n`;

  if (user.rol === "alumno") {
    const mias = alumnos.filter((a) => a.user_id === user.id);
    texto += "\nMATERIAS EN LAS QUE ESTÁ INSCRIPTO EL USUARIO:\n";
    if (mias.length === 0) texto += "- No está inscripto en ninguna materia.\n";
    for (const a of mias) {
      const nombre = materias.find((m) => m.id === a.materia_id)?.nombre;
      texto += `- ${nombre}: ${detalleNotas(a)}. Estado: ${a.estado}\n`;
    }
    return texto;
  }

  const visibles = user.rol === "profesor" ? materias.filter((m) => m.profesor_id === user.id) : materias;
  const ids = visibles.map((m) => m.id);
  const delGrupo = alumnos.filter((a) => ids.includes(a.materia_id));

  if (user.rol === "profesor") {
    texto += `\nMATERIAS QUE DICTA EL USUARIO: ${visibles.length ? visibles.map((m) => m.nombre).join(", ") : "ninguna"}\n`;
  }

  texto += "\nALUMNOS INSCRIPTOS POR MATERIA:\n";
  for (const m of visibles) {
    const lista = delGrupo.filter((a) => a.materia_id === m.id);
    texto += `${m.nombre} (${lista.length} inscriptos):\n`;
    if (lista.length === 0) texto += "  - Sin alumnos inscriptos\n";
    for (const a of lista) texto += `  - ${a.alumno}: ${detalleNotas(a)}. Estado: ${a.estado}\n`;
  }

  const listar = (estado) => {
    const l = delGrupo.filter((a) => a.estado === estado);
    const nombres = l.map((a) => {
      const mat = materias.find((m) => m.id === a.materia_id)?.nombre;
      return a.final !== null ? `${a.alumno} en ${mat} con ${a.final}` : `${a.alumno} en ${mat}`;
    });
    return `${l.length}${l.length ? ` (${nombres.join("; ")})` : ""}`;
  };

  texto += "\nRESUMEN YA CALCULADO (usá estos números tal cual):\n";
  texto += `- Aprobados: ${listar("aprobado")}\n`;
  texto += `- Desaprobados: ${listar("desaprobado")}\n`;
  texto += `- Sin notas todavía: ${listar("sin notas")}\n`;

  if (user.rol === "admin") {
    const [[totales]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users_db.usuarios WHERE rol = 'alumno') AS alumnos,
        (SELECT COUNT(*) FROM users_db.usuarios WHERE rol = 'profesor') AS profesores
    `);
    texto += `- Total: ${totales.alumnos} alumnos, ${totales.profesores} profesores, ${materias.length} materias y ${alumnos.length} inscripciones.\n`;
  }

  return texto;
}

module.exports = armarContexto;
