const db = require("../db/db");

const q = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const actual = async () => (await q("SELECT * FROM periodos WHERE actual = 1 LIMIT 1"))[0] || null;

const ultima = `(SELECT x.id FROM inscripciones x WHERE x.user_id = i.user_id AND x.materia_id = i.materia_id
  ORDER BY x.periodo_id DESC, x.id DESC LIMIT 1)`;

const filtroPeriodo = (valor) => {
  if (valor === "todos") return { sql: "1 = 1", params: [] };
  const id = Number(valor);
  if (id) return { sql: "i.periodo_id = ?", params: [id] };
  return { sql: `i.id = ${ultima}`, params: [] };
};

const periodoDe = async (userId, materiaId) => {
  const [i] = await q(
    "SELECT periodo_id FROM inscripciones WHERE user_id = ? AND materia_id = ? ORDER BY periodo_id DESC, id DESC LIMIT 1",
    [userId, materiaId]
  );
  if (i) return i.periodo_id;
  return (await actual())?.id ?? null;
};

module.exports = { q, actual, filtroPeriodo, ultima, periodoDe };
