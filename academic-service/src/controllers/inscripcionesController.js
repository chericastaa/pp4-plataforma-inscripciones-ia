const axios = require("axios");
const { crearMotor } = require("../motor/reglas");
const { cargarDatosAlumno } = require("../motor/datos");
const { q, filtroPeriodo, ultima } = require("../motor/periodos");

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://localhost:3001";

const falla = (res, err) => {
  console.error(err);
  res.status(500).json({ message: "Error interno del servidor" });
};

const inscribir = async (req, res) => {
  const { user_id, materia_id } = req.body;

  try {
    const { data: user } = await axios.get(`${USERS_SERVICE_URL}/usuarios/${user_id}`, {
      headers: { Authorization: req.headers.authorization },
    });

    if (!user) return res.status(404).json({ message: "Usuario no existe" });
    if (user.rol !== "alumno") return res.status(403).json({ message: "Solo alumnos pueden inscribirse" });

    const datos = await cargarDatosAlumno(user_id);
    if (!datos.periodo) return res.status(400).json({ message: "No hay un período abierto" });

    const motor = crearMotor(datos);
    const resultado = motor.puedeCursar(Number(materia_id), user.carrera_id ?? null);

    if (!resultado.permitido) {
      return res.status(400).json({ message: resultado.motivos.join(" · "), motivos: resultado.motivos });
    }

    const [ya] = await q(
      "SELECT id FROM inscripciones WHERE user_id = ? AND materia_id = ? AND periodo_id = ?",
      [user_id, materia_id, datos.periodo.id]
    );
    if (ya) return res.status(400).json({ message: "Ya está inscripto en esta materia" });

    const recursa = motor.estado(Number(materia_id)).estado === "libre";
    const r = await q("INSERT INTO inscripciones (user_id, materia_id, periodo_id) VALUES (?, ?, ?)", [
      user_id,
      materia_id,
      datos.periodo.id,
    ]);

    res.status(201).json({
      message: recursa ? "Te volviste a inscribir para recursar" : "Inscripción exitosa",
      id: r.insertId,
      user_id,
      materia_id,
      periodo: datos.periodo.nombre,
    });
  } catch (err) {
    falla(res, err);
  }
};

const getAlumnosMateria = async (req, res) => {
  try {
    const f = filtroPeriodo(req.query.periodo);
    const rows = await q(
      `SELECT i.*, p.nombre AS periodo FROM inscripciones i
       LEFT JOIN periodos p ON p.id = i.periodo_id
       WHERE i.materia_id = ? AND ${f.sql}`,
      [req.params.id, ...f.params]
    );
    res.json(rows);
  } catch (err) {
    falla(res, err);
  }
};

const eliminarInscripcion = async (req, res) => {
  try {
    await q("DELETE FROM inscripciones WHERE id = ?", [req.params.id]);
    res.json({ id: Number(req.params.id), deleted: true });
  } catch (err) {
    falla(res, err);
  }
};

const getMateriasDeUsuario = async (req, res) => {
  try {
    const rows = await q(
      `SELECT m.*, i.id AS inscripcion_id FROM materias m
       JOIN inscripciones i ON m.id = i.materia_id
       WHERE i.user_id = ? AND i.id = ${ultima}`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    falla(res, err);
  }
};

const getCount = async (req, res) => {
  try {
    const [r] = await q("SELECT COUNT(*) AS total FROM (SELECT DISTINCT user_id, materia_id FROM inscripciones) t");
    res.json({ total: r.total });
  } catch (err) {
    falla(res, err);
  }
};

const getAllInscripciones = async (req, res) => {
  try {
    res.json(await q("SELECT * FROM inscripciones"));
  } catch (err) {
    falla(res, err);
  }
};

const getPeriodos = async (req, res) => {
  try {
    res.json(await q(`SELECT p.*, (SELECT COUNT(*) FROM inscripciones i WHERE i.periodo_id = p.id) AS inscriptos
       FROM periodos p ORDER BY p.anio, p.cuatrimestre`));
  } catch (err) {
    falla(res, err);
  }
};

const crearPeriodo = async (req, res) => {
  const anio = Number(req.body.anio);
  const cuatrimestre = Number(req.body.cuatrimestre);
  if (!anio || ![1, 2].includes(cuatrimestre)) return res.status(400).json({ message: "Año o cuatrimestre inválido" });

  try {
    const [ultimo] = await q("SELECT anio, cuatrimestre FROM periodos ORDER BY anio DESC, cuatrimestre DESC LIMIT 1");
    if (ultimo && (anio < ultimo.anio || (anio === ultimo.anio && cuatrimestre <= ultimo.cuatrimestre))) {
      return res.status(400).json({ message: "Tiene que ser un período posterior al último que hay" });
    }
    const nombre = `${cuatrimestre === 1 ? "1er" : "2do"} cuatrimestre ${anio}`;
    const r = await q("INSERT INTO periodos (anio, cuatrimestre, nombre) VALUES (?, ?, ?)", [anio, cuatrimestre, nombre]);
    res.status(201).json({ id: r.insertId, anio, cuatrimestre, nombre, actual: 0 });
  } catch (err) {
    falla(res, err);
  }
};

const abrirPeriodo = async (req, res) => {
  try {
    const [p] = await q("SELECT id FROM periodos WHERE id = ?", [req.params.id]);
    if (!p) return res.status(404).json({ message: "El período no existe" });
    await q("UPDATE periodos SET actual = (id = ?)", [req.params.id]);
    res.json({ id: Number(req.params.id), actual: 1 });
  } catch (err) {
    falla(res, err);
  }
};

module.exports = {
  inscribir,
  getAlumnosMateria,
  eliminarInscripcion,
  getMateriasDeUsuario,
  getCount,
  getAllInscripciones,
  getPeriodos,
  crearPeriodo,
  abrirPeriodo,
};
