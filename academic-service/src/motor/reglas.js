const NOTA_REGULAR = 4;
const NOTA_PROMOCION = 7;
const NOTA_FINAL = 4;

const num = (v) => (v === null || v === undefined ? null : Number(v));
const hora = (h) => String(h).slice(0, 5);

function crearMotor({ materias, correlativas, inscripciones, calificaciones, finales }) {
  const porId = new Map(materias.map((m) => [m.id, m]));
  const nombre = (id) => porId.get(id)?.nombre ?? `materia ${id}`;
  const requeridas = (id) => correlativas.filter((c) => c.materia_id === id).map((c) => c.materia_requerida_id);
  const inscripto = (id) => inscripciones.some((i) => i.materia_id === id);
  const cache = new Map();

  function estado(id) {
    if (cache.has(id)) return cache.get(id);

    let resultado = { estado: "no_cursada", nota: null, via: null };

    const finalAprobado = finales.find((f) => f.materia_id === id && num(f.nota) >= NOTA_FINAL);
    const cal = calificaciones.find((c) => c.materia_id === id);
    const p1 = num(cal?.parcial1);
    const p2 = num(cal?.parcial2);

    if (finalAprobado) {
      resultado = { estado: "aprobada", nota: num(finalAprobado.nota), via: "final" };
    } else if (p1 !== null && p2 !== null) {
      const promedio = (p1 + p2) / 2;
      const correlativasAprobadas = requeridas(id).every((r) => estado(r).estado === "aprobada");
      if (p1 >= NOTA_PROMOCION && p2 >= NOTA_PROMOCION && correlativasAprobadas) {
        resultado = { estado: "aprobada", nota: promedio, via: "promocion" };
      } else if (p1 >= NOTA_REGULAR && p2 >= NOTA_REGULAR) {
        resultado = { estado: "regular", nota: promedio, via: null };
      } else {
        resultado = { estado: "libre", nota: promedio, via: null };
      }
    } else if ((p1 !== null && p1 < NOTA_REGULAR) || (p2 !== null && p2 < NOTA_REGULAR)) {
      resultado = { estado: "libre", nota: null, via: null };
    } else if (inscripto(id)) {
      resultado = { estado: "cursando", nota: null, via: null };
    }

    cache.set(id, resultado);
    return resultado;
  }

  function seSuperponen(a, b) {
    if (!a.dia || !b.dia || a.dia !== b.dia) return false;
    if (!a.hora_inicio || !a.hora_fin || !b.hora_inicio || !b.hora_fin) return false;
    return a.hora_inicio < b.hora_fin && b.hora_inicio < a.hora_fin;
  }

  function puedeCursar(id, carreraId) {
    const m = porId.get(id);
    if (!m) return { permitido: false, motivos: ["La materia no existe"] };

    const motivos = [];

    if (m.carrera_id && carreraId && m.carrera_id !== carreraId) {
      motivos.push(`${m.nombre} no pertenece a tu carrera`);
    }

    const actual = estado(id).estado;
    if (actual === "aprobada") motivos.push(`Ya aprobaste ${m.nombre}`);
    if (actual === "regular") motivos.push(`Ya tenés la cursada regular de ${m.nombre}, te falta rendir el final`);
    if (actual === "cursando") motivos.push(`Ya estás cursando ${m.nombre}`);

    for (const r of requeridas(id)) {
      const e = estado(r).estado;
      if (e !== "regular" && e !== "aprobada") {
        motivos.push(`Para cursar ${m.nombre} necesitás tener regularizada ${nombre(r)}`);
      }
    }

    for (const otra of materias) {
      if (otra.id !== id && estado(otra.id).estado === "cursando" && seSuperponen(m, otra)) {
        motivos.push(`Se superpone con ${otra.nombre} (${otra.dia} de ${hora(otra.hora_inicio)} a ${hora(otra.hora_fin)})`);
      }
    }

    return { permitido: motivos.length === 0, motivos };
  }

  function puedeRendir(id) {
    const m = porId.get(id);
    if (!m) return { permitido: false, motivos: ["La materia no existe"] };

    const motivos = [];
    const actual = estado(id).estado;

    if (actual === "aprobada") motivos.push(`Ya aprobaste ${m.nombre}`);
    if (actual === "cursando") motivos.push(`Todavía estás cursando ${m.nombre}, primero tenés que regularizarla`);
    if (actual === "libre") motivos.push(`Quedaste libre en ${m.nombre}, tenés que volver a cursarla`);
    if (actual === "no_cursada") motivos.push(`Tenés que cursar ${m.nombre} antes de rendir el final`);

    if (finales.some((f) => f.materia_id === id && f.nota === null)) {
      motivos.push(`Ya estás anotado a una mesa de ${m.nombre}`);
    }

    for (const r of requeridas(id)) {
      if (estado(r).estado !== "aprobada") {
        motivos.push(`Para rendir ${m.nombre} necesitás tener aprobada ${nombre(r)}`);
      }
    }

    return { permitido: motivos.length === 0, motivos };
  }

  return { estado, puedeCursar, puedeRendir, requeridas, nombre };
}

module.exports = { crearMotor, NOTA_REGULAR, NOTA_PROMOCION, NOTA_FINAL };
