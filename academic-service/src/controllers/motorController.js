const db = require("../db/db");
const { crearMotor } = require("../motor/reglas");
const { cargarDatosAlumno, obtenerUsuario } = require("../motor/datos");

const alumnoObjetivo = (req) =>
  req.user.rol === "alumno" ? req.user.id : Number(req.query.user_id) || req.user.id;

async function prepararMotor(req) {
  const userId = alumnoObjetivo(req);
  const [usuario, datos] = await Promise.all([
    obtenerUsuario(userId, req.headers.authorization).catch(() => null),
    cargarDatosAlumno(userId),
  ]);
  return { userId, carreraId: usuario?.carrera_id ?? null, datos, motor: crearMotor(datos) };
}

const getPlan = async (req, res) => {
  try {
    const { userId, carreraId, datos, motor } = await prepararMotor(req);

    const materias = datos.materias
      .filter((m) => (carreraId ? m.carrera_id === carreraId : m.codigo))
      .map((m) => {
        const e = motor.estado(m.id);
        return {
          id: m.id,
          codigo: m.codigo,
          nombre: m.nombre,
          anio: m.anio,
          cuatrimestre: m.cuatrimestre,
          dia: m.dia,
          hora_inicio: m.hora_inicio,
          hora_fin: m.hora_fin,
          estado: e.estado,
          nota: e.nota,
          via: e.via,
          correlativas: motor.requeridas(m.id).map((r) => ({ id: r, nombre: motor.nombre(r), estado: motor.estado(r).estado })),
          cursar: motor.puedeCursar(m.id, carreraId),
          rendir: motor.puedeRendir(m.id),
        };
      });

    const [carrera] = carreraId
      ? await db.promise().query("SELECT nombre FROM carreras WHERE id = ?", [carreraId]).then(([rows]) => rows)
      : [null];

    res.json({ user_id: userId, carrera_id: carreraId, carrera: carrera?.nombre ?? null, materias });
  } catch (err) {
    console.error("Error en motor/plan:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getPuedeCursar = async (req, res) => {
  try {
    const { carreraId, motor } = await prepararMotor(req);
    res.json(motor.puedeCursar(Number(req.params.id), carreraId));
  } catch (err) {
    console.error("Error en motor/puede-cursar:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getPuedeRendir = async (req, res) => {
  try {
    const { motor } = await prepararMotor(req);
    res.json(motor.puedeRendir(Number(req.params.id)));
  } catch (err) {
    console.error("Error en motor/puede-rendir:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = { getPlan, getPuedeCursar, getPuedeRendir };
