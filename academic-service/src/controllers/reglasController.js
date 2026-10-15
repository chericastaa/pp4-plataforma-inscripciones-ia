const db = require("../db/db");

const q = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const ESTADOS = ["regular", "aprobada"];

const SQL_CORRELATIVA = `
  SELECT c.id, c.materia_id, m.nombre AS materia, m.codigo, m.carrera_id, m.anio, m.cuatrimestre,
         c.materia_requerida_id, r.nombre AS requerida, c.para_cursar, c.para_final
  FROM correlativas c
  JOIN materias m ON m.id = c.materia_id
  JOIN materias r ON r.id = c.materia_requerida_id`;

const SQL_EQUIVALENCIA = `
  SELECT e.id, e.materia_id, a.nombre AS materia, a.codigo, a.carrera_id,
         e.materia_equivalente_id, b.nombre AS equivalente, b.codigo AS codigo_equivalente, b.carrera_id AS carrera_equivalente_id
  FROM equivalencias e
  JOIN materias a ON a.id = e.materia_id
  JOIN materias b ON b.id = e.materia_equivalente_id`;

const entero = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);

const existeMateria = async (id) => (await q("SELECT id FROM materias WHERE id = ?", [id])).length > 0;

const dependeDe = async (desde, buscada) => {
  const filas = await q("SELECT materia_id, materia_requerida_id FROM correlativas");
  const vistos = new Set();
  const pendientes = [desde];
  while (pendientes.length) {
    const actual = pendientes.pop();
    if (actual === buscada) return true;
    if (vistos.has(actual)) continue;
    vistos.add(actual);
    filas.filter((f) => f.materia_id === actual).forEach((f) => pendientes.push(f.materia_requerida_id));
  }
  return false;
};

const getReglas = async (req, res) => {
  try {
    const [correlativas, equivalencias] = await Promise.all([
      q(`${SQL_CORRELATIVA} ORDER BY m.carrera_id, m.anio, m.cuatrimestre, m.codigo, r.codigo`),
      q(`${SQL_EQUIVALENCIA} ORDER BY a.codigo, b.codigo`),
    ]);
    res.json({ correlativas, equivalencias });
  } catch (err) {
    console.error("Error en reglas/get:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const crearCorrelativa = async (req, res) => {
  try {
    const materiaId = entero(req.body.materia_id);
    const requeridaId = entero(req.body.materia_requerida_id);
    const paraCursar = req.body.para_cursar ?? "regular";
    const paraFinal = req.body.para_final ?? "aprobada";

    if (!materiaId || !requeridaId) return res.status(400).json({ message: "Elegí la materia y su correlativa" });
    if (materiaId === requeridaId) return res.status(400).json({ message: "Una materia no puede ser correlativa de sí misma" });
    if (!ESTADOS.includes(paraCursar) || !ESTADOS.includes(paraFinal)) {
      return res.status(400).json({ message: "El requisito tiene que ser regular o aprobada" });
    }
    if (!(await existeMateria(materiaId)) || !(await existeMateria(requeridaId))) {
      return res.status(404).json({ message: "Materia no encontrada" });
    }

    const repetida = await q("SELECT id FROM correlativas WHERE materia_id = ? AND materia_requerida_id = ?", [materiaId, requeridaId]);
    if (repetida.length) return res.status(409).json({ message: "Esa correlativa ya existe" });

    if (await dependeDe(requeridaId, materiaId)) {
      return res.status(400).json({ message: "Esa correlativa crearía un círculo: la otra materia ya depende de esta" });
    }

    const r = await db.promise().query(
      "INSERT INTO correlativas (materia_id, materia_requerida_id, para_cursar, para_final) VALUES (?, ?, ?, ?)",
      [materiaId, requeridaId, paraCursar, paraFinal]
    );
    const [fila] = await q(`${SQL_CORRELATIVA} WHERE c.id = ?`, [r[0].insertId]);
    res.status(201).json(fila);
  } catch (err) {
    console.error("Error en reglas/crear-correlativa:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const editarCorrelativa = async (req, res) => {
  try {
    const id = entero(req.params.id);
    const { para_cursar, para_final } = req.body;
    if (!id) return res.status(400).json({ message: "Correlativa inválida" });
    if (!ESTADOS.includes(para_cursar) || !ESTADOS.includes(para_final)) {
      return res.status(400).json({ message: "El requisito tiene que ser regular o aprobada" });
    }

    const r = await db.promise().query("UPDATE correlativas SET para_cursar = ?, para_final = ? WHERE id = ?", [para_cursar, para_final, id]);
    if (r[0].affectedRows === 0) return res.status(404).json({ message: "Correlativa no encontrada" });

    const [fila] = await q(`${SQL_CORRELATIVA} WHERE c.id = ?`, [id]);
    res.json(fila);
  } catch (err) {
    console.error("Error en reglas/editar-correlativa:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const eliminarCorrelativa = async (req, res) => {
  try {
    const r = await db.promise().query("DELETE FROM correlativas WHERE id = ?", [entero(req.params.id)]);
    if (r[0].affectedRows === 0) return res.status(404).json({ message: "Correlativa no encontrada" });
    res.status(204).end();
  } catch (err) {
    console.error("Error en reglas/eliminar-correlativa:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const crearEquivalencia = async (req, res) => {
  try {
    const a = entero(req.body.materia_id);
    const b = entero(req.body.materia_equivalente_id);

    if (!a || !b) return res.status(400).json({ message: "Elegí las dos materias" });
    if (a === b) return res.status(400).json({ message: "Elegí dos materias distintas" });
    if (!(await existeMateria(a)) || !(await existeMateria(b))) {
      return res.status(404).json({ message: "Materia no encontrada" });
    }

    const repetida = await q(
      "SELECT id FROM equivalencias WHERE (materia_id = ? AND materia_equivalente_id = ?) OR (materia_id = ? AND materia_equivalente_id = ?)",
      [a, b, b, a]
    );
    if (repetida.length) return res.status(409).json({ message: "Esas materias ya son equivalentes" });

    const r = await db.promise().query("INSERT INTO equivalencias (materia_id, materia_equivalente_id) VALUES (?, ?)", [a, b]);
    const [fila] = await q(`${SQL_EQUIVALENCIA} WHERE e.id = ?`, [r[0].insertId]);
    res.status(201).json(fila);
  } catch (err) {
    console.error("Error en reglas/crear-equivalencia:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const eliminarEquivalencia = async (req, res) => {
  try {
    const r = await db.promise().query("DELETE FROM equivalencias WHERE id = ?", [entero(req.params.id)]);
    if (r[0].affectedRows === 0) return res.status(404).json({ message: "Equivalencia no encontrada" });
    res.status(204).end();
  } catch (err) {
    console.error("Error en reglas/eliminar-equivalencia:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  getReglas,
  crearCorrelativa,
  editarCorrelativa,
  eliminarCorrelativa,
  crearEquivalencia,
  eliminarEquivalencia,
};
