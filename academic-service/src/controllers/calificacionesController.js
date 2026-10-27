const { q, periodoDe } = require("../motor/periodos");

const falla = (res, err) => {
  console.error(err);
  res.status(500).json({ message: "Error interno del servidor" });
};

const notaInvalida = (nota) => nota < 0 || nota > 10;

const getCalificaciones = async (req, res) => {
  const materia_id = req.params.id;
  const periodo = req.query.periodo;

  let filtro = `c.periodo_id <=> (SELECT x.periodo_id FROM inscripciones x
    WHERE x.user_id = c.user_id AND x.materia_id = c.materia_id ORDER BY x.periodo_id DESC, x.id DESC LIMIT 1)`;
  const params = [materia_id];

  if (periodo === "todos") filtro = "1 = 1";
  else if (Number(periodo)) { filtro = "c.periodo_id = ?"; params.push(Number(periodo)); }

  try {
    res.json(await q(`SELECT c.* FROM calificaciones c WHERE c.materia_id = ? AND ${filtro}`, params));
  } catch (err) {
    falla(res, err);
  }
};

const guardarCalificacion = async (req, res) => {
  const materia_id = req.params.id;
  const { user_id, parcial1, parcial2, nota, comentario } = req.body;

  if (notaInvalida(nota)) return res.status(400).json({ message: "La nota debe estar entre 0 y 10" });

  try {
    const periodo_id = await periodoDe(user_id, materia_id);
    const r = await q(
      "INSERT INTO calificaciones (materia_id, user_id, periodo_id, parcial1, parcial2, nota, comentario) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [materia_id, user_id, periodo_id, parcial1, parcial2, nota, comentario]
    );
    res.status(201).json({ id: r.insertId, materia_id, user_id, parcial1, parcial2, nota, comentario });
  } catch (err) {
    falla(res, err);
  }
};

const actualizarCalificacion = async (req, res) => {
  const materia_id = req.params.id;
  const user_id = req.params.user_id;
  const { parcial1, parcial2, nota, comentario } = req.body;

  if (notaInvalida(nota)) return res.status(400).json({ message: "La nota debe estar entre 0 y 10" });

  try {
    const periodo_id = await periodoDe(user_id, materia_id);
    await q(
      "UPDATE calificaciones SET parcial1 = ?, parcial2 = ?, nota = ?, comentario = ? WHERE materia_id = ? AND user_id = ? AND periodo_id <=> ?",
      [parcial1, parcial2, nota, comentario, materia_id, user_id, periodo_id]
    );
    res.json({ materia_id, user_id, parcial1, parcial2, nota, comentario });
  } catch (err) {
    falla(res, err);
  }
};

const eliminarCalificacion = async (req, res) => {
  const { id, user_id } = req.params;

  try {
    const periodo_id = await periodoDe(user_id, id);
    await q("DELETE FROM calificaciones WHERE materia_id = ? AND user_id = ? AND periodo_id <=> ?", [id, user_id, periodo_id]);
    res.json({ materia_id: Number(id), user_id: Number(user_id), deleted: true });
  } catch (err) {
    falla(res, err);
  }
};

module.exports = { getCalificaciones, guardarCalificacion, eliminarCalificacion, actualizarCalificacion };
