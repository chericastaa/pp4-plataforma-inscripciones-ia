const assert = require("assert");
const { crearMotor } = require("../src/motor/reglas.js");

const materias = [
  { id: 1, nombre: "Programación", carrera_id: 1 },
  { id: 2, nombre: "Objetos", carrera_id: 1 },
  { id: 3, nombre: "Arquitectura", carrera_id: 1 },
  { id: 10, nombre: "Programación (AS)", carrera_id: 2 },
];
const base = (extra = {}) => ({
  materias,
  correlativas: [{ materia_id: 2, materia_requerida_id: 1, para_cursar: "regular", para_final: "aprobada" }],
  equivalencias: [],
  inscripciones: [],
  calificaciones: [],
  finales: [],
  ...extra,
});

let n = 0;
const t = (nombre, f) => { f(); n++; console.log("ok -", nombre); };

t("regular alcanza para cursar la siguiente (regla por defecto)", () => {
  const m = crearMotor(base({ calificaciones: [{ materia_id: 1, parcial1: 5, parcial2: 5 }] }));
  assert.strictEqual(m.estado(1).estado, "regular");
  assert.strictEqual(m.puedeCursar(2, 1).permitido, true);
});

t("regular NO alcanza para rendir el final de la siguiente (regla por defecto)", () => {
  const m = crearMotor(base({ calificaciones: [{ materia_id: 1, parcial1: 5, parcial2: 5 }, { materia_id: 2, parcial1: 6, parcial2: 6 }] }));
  const r = m.puedeRendir(2);
  assert.strictEqual(r.permitido, false);
  assert.ok(r.motivos[0].includes("aprobada Programación"));
});

t("cambiar la regla a 'aprobada para cursar' bloquea al alumno regular", () => {
  const m = crearMotor(base({
    correlativas: [{ materia_id: 2, materia_requerida_id: 1, para_cursar: "aprobada", para_final: "aprobada" }],
    calificaciones: [{ materia_id: 1, parcial1: 5, parcial2: 5 }],
  }));
  const r = m.puedeCursar(2, 1);
  assert.strictEqual(r.permitido, false);
  assert.ok(r.motivos[0].includes("tener aprobada Programación"));
});

t("cambiar la regla a 'regular para el final' habilita rendir con la correlativa regular", () => {
  const m = crearMotor(base({
    correlativas: [{ materia_id: 2, materia_requerida_id: 1, para_cursar: "regular", para_final: "regular" }],
    calificaciones: [{ materia_id: 1, parcial1: 5, parcial2: 5 }, { materia_id: 2, parcial1: 6, parcial2: 6 }],
  }));
  assert.strictEqual(m.puedeRendir(2).permitido, true);
});

t("final aprobado de la correlativa habilita ambas cosas", () => {
  const m = crearMotor(base({ finales: [{ materia_id: 1, nota: 7 }] }));
  assert.strictEqual(m.estado(1).via, "final");
  assert.strictEqual(m.puedeCursar(2, 1).permitido, true);
});

t("equivalencia: aprobar la materia de la otra carrera cuenta como aprobada", () => {
  const m = crearMotor(base({ equivalencias: [{ materia_id: 1, materia_equivalente_id: 10 }], finales: [{ materia_id: 10, nota: 8 }] }));
  const e = m.estado(1);
  assert.strictEqual(e.estado, "aprobada");
  assert.strictEqual(e.via, "equivalencia");
  assert.strictEqual(e.equivalente, "Programación (AS)");
  assert.strictEqual(m.puedeCursar(2, 1).permitido, true);
  assert.ok(m.puedeCursar(1, 1).motivos[0].includes("por equivalencia con Programación (AS)"));
});

t("equivalencia funciona en los dos sentidos", () => {
  const m = crearMotor(base({ equivalencias: [{ materia_id: 1, materia_equivalente_id: 10 }], finales: [{ materia_id: 1, nota: 8 }] }));
  assert.strictEqual(m.estado(10).estado, "aprobada");
});

t("equivalencia circular no se cuelga", () => {
  const m = crearMotor(base({ equivalencias: [{ materia_id: 1, materia_equivalente_id: 10 }, { materia_id: 10, materia_equivalente_id: 1 }] }));
  assert.strictEqual(m.estado(1).estado, "no_cursada");
});

t("sin columnas nuevas (datos viejos) usa las reglas de siempre", () => {
  const m = crearMotor(base({ correlativas: [{ materia_id: 2, materia_requerida_id: 1 }], calificaciones: [{ materia_id: 1, parcial1: 5, parcial2: 5 }] }));
  assert.strictEqual(m.puedeCursar(2, 1).permitido, true);
  assert.strictEqual(m.puedeRendir(1).permitido, true);
});

t("materia de otra carrera no se puede cursar", () => {
  const m = crearMotor(base());
  assert.ok(m.puedeCursar(10, 1).motivos.some((x) => x.includes("no pertenece a tu carrera")));
});

console.log(`\n${n} pruebas pasaron`);
