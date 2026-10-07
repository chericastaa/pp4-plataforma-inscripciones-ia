const db = require("../db/db");
const { crearMotor } = require("../motor/reglas");
const { cargarDatosAlumno, obtenerUsuario } = require("../motor/datos");

const q = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const getMesas = async (req, res) => {
  try {
    const usuario = await obtenerUsuario(req.user.id, req.headers.authorization).catch(() => null);
    const carreraId = usuario?.carrera_id ?? null;

    const mesas = await q(
      `SELECT mf.id, mf.fecha, mf.hora, m.id AS materia_id, m.codigo, m.nombre AS materia
       FROM mesas_finales mf
       JOIN materias m ON m.id = mf.materia_id
       WHERE mf.fecha >= CURDATE() AND (? IS NULL OR m.carrera_id = ?)
       ORDER BY mf.fecha, m.codigo`,
      [carreraId, carreraId]
    );

    if (req.user.rol !== "alumno") return res.json(mesas);

    const datos = await cargarDatosAlumno(req.user.id);
    const motor = crearMotor(datos);

    res.json(
      mesas.map((mesa) => {
        const inscripcion = datos.finales.find((f) => f.mesa_id === mesa.id);
        return {
          ...mesa,
          inscripcion_id: inscripcion?.id ?? null,
          estado_materia: motor.estado(mesa.materia_id).estado,
          rendir: inscripcion ? { permitido: false, motivos: [] } : motor.puedeRendir(mesa.materia_id),
        };
      })
    );
  } catch (err) {
    console.error("Error en finales/mesas:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const inscribirFinal = async (req, res) => {
  if (req.user.rol !== "alumno") {
    return res.status(403).json({ message: "Solo alumnos pueden anotarse a finales" });
  }

  const mesaId = Number(req.body.mesa_id);

  try {
    const [mesa] = await q("SELECT id, materia_id, fecha FROM mesas_finales WHERE id = ?", [mesaId]);
    if (!mesa) return res.status(404).json({ message: "La mesa no existe" });
    if (new Date(mesa.fecha) < new Date(new Date().toDateString())) {
      return res.status(400).json({ message: "Esa mesa ya pasó" });
    }

    const motor = crearMotor(await cargarDatosAlumno(req.user.id));
    const resultado = motor.puedeRendir(mesa.materia_id);

    if (!resultado.permitido) {
      return res.status(400).json({ message: resultado.motivos.join(" · "), motivos: resultado.motivos });
    }

    const result = await q("INSERT INTO inscripciones_finales (mesa_id, user_id) VALUES (?, ?)", [mesaId, req.user.id]);
    res.status(201).json({ message: "Te anotaste al final", id: result.insertId });
  } catch (err) {
    console.error("Error en finales/inscribir:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const bajaFinal = async (req, res) => {
  try {
    const [insc] = await q("SELECT id, user_id, nota FROM inscripciones_finales WHERE id = ?", [req.params.id]);
    if (!insc) return res.status(404).json({ message: "La inscripción no existe" });
    if (req.user.rol === "alumno" && insc.user_id !== req.user.id) {
      return res.status(403).json({ message: "No podés dar de baja la inscripción de otro alumno" });
    }
    if (insc.nota !== null) return res.status(400).json({ message: "Ese final ya tiene nota cargada" });

    await q("DELETE FROM inscripciones_finales WHERE id = ?", [req.params.id]);
    res.json({ id: Number(req.params.id), deleted: true });
  } catch (err) {
    console.error("Error en finales/baja:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const cargarNotaFinal = async (req, res) => {
  if (req.user.rol === "alumno") {
    return res.status(403).json({ message: "Solo profesores o admin pueden cargar notas" });
  }

  const nota = Number(req.body.nota);
  if (Number.isNaN(nota) || nota < 1 || nota > 10) {
    return res.status(400).json({ message: "La nota tiene que ser entre 1 y 10" });
  }

  try {
    const result = await q("UPDATE inscripciones_finales SET nota = ? WHERE id = ?", [nota, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "La inscripción no existe" });
    res.json({ id: Number(req.params.id), nota });
  } catch (err) {
    console.error("Error en finales/nota:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getInscriptosMesa = async (req, res) => {
  try {
    const rows = await q(
      `SELECT inf.id, inf.user_id, inf.nota, u.nombre
       FROM inscripciones_finales inf
       LEFT JOIN users_db.usuarios u ON u.id = inf.user_id
       WHERE inf.mesa_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error en finales/inscriptos:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = { getMesas, inscribirFinal, bajaFinal, cargarNotaFinal, getInscriptosMesa };
