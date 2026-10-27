const db = require("../db/db");
const axios = require("axios");
const { q, choque, textoChoque } = require("../motor/horarios");

const crearMateria = (req, res) => {
  const { nombre, profesor_id } = req.body;
  const query = `INSERT INTO materias (nombre, profesor_id) VALUES (?, ?)`;
  db.query(query, [nombre, profesor_id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Materia creada", id: result.insertId });
  });
};

const getMaterias = (req, res) => {
  db.query("SELECT * FROM materias", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

const eliminarMateria = (req, res) => {
  const materia_id = req.params.id;
  db.query(
    "SELECT COUNT(*) as total FROM inscripciones WHERE materia_id = ?",
    [materia_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result[0].total > 0) {
        return res.status(400).json({ message: "No se puede eliminar: hay alumnos inscriptos en esta materia" });
      }
      db.query("SELECT profesor_id FROM materias WHERE id = ?", [materia_id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (!result[0]) return res.status(404).json({ message: "Materia no encontrada" });
        if (result[0].profesor_id) {
          return res.status(400).json({ message: "No se puede eliminar: tiene un profesor asignado" });
        }
        db.query("DELETE FROM materias WHERE id = ?", [materia_id], (err) => {
          if (err) return res.status(500).json(err);
          res.json({ message: "Materia eliminada" });
        });
      });
    }
  );
};

const asignarProfesor = async (req, res) => {
  const materia_id = req.params.id;
  const { profesor_id } = req.body;
  try {
    const response = await axios.get(
      `${process.env.USERS_SERVICE_URL}/usuarios/${profesor_id}`,
      { headers: { Authorization: `Bearer ${req.headers.authorization?.split(" ")[1]}` } }
    );
    const usuario = response.data;
    if (!usuario) return res.status(404).json({ message: "Usuario no existe" });
    if (usuario.rol !== "profesor") return res.status(400).json({ message: "El usuario no es profesor" });

    const [materia] = await q("SELECT * FROM materias WHERE id = ?", [materia_id]);
    if (!materia) return res.status(404).json({ message: "Materia no encontrada" });

    const otra = await choque(materia, profesor_id);
    if (otra) return res.status(400).json({ message: textoChoque(usuario.nombre, otra) });

    await q("UPDATE materias SET profesor_id = ? WHERE id = ?", [profesor_id, materia_id]);
    res.json({ message: "Profesor asignado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error validando usuario", error: error.message });
  }
};

const asignarAuto = async (req, res) => {
  try {
    const { data } = await axios.get(`${process.env.USERS_SERVICE_URL}/usuarios`, {
      headers: { Authorization: req.headers.authorization },
    });
    const profes = data.filter((u) => u.rol === "profesor");
    if (profes.length === 0) return res.status(400).json({ message: "No hay profesores cargados" });

    const materias = await q("SELECT * FROM materias WHERE profesor_id IS NULL ORDER BY carrera_id, anio, cuatrimestre, id");
    const cargas = await q("SELECT profesor_id, COUNT(*) AS n FROM materias WHERE profesor_id IS NOT NULL GROUP BY profesor_id");
    const carga = new Map(cargas.map((c) => [c.profesor_id, c.n]));

    const asignadas = [];
    const sin_lugar = [];

    for (const m of materias) {
      const orden = [...profes].sort((a, b) => (carga.get(a.id) || 0) - (carga.get(b.id) || 0));
      let elegido = null;
      for (const p of orden) {
        if (!(await choque(m, p.id))) { elegido = p; break; }
      }
      if (!elegido) { sin_lugar.push({ id: m.id, nombre: m.nombre }); continue; }
      await q("UPDATE materias SET profesor_id = ? WHERE id = ?", [elegido.id, m.id]);
      carga.set(elegido.id, (carga.get(elegido.id) || 0) + 1);
      asignadas.push({ id: m.id, profesor_id: elegido.id });
    }

    res.json({ asignadas, sin_lugar });
  } catch (error) {
    res.status(500).json({ message: "No se pudo asignar", error: error.message });
  }
};

const cambiarHorario = async (req, res) => {
  const { dia, hora_inicio, hora_fin } = req.body;
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  if (!dias.includes(dia)) return res.status(400).json({ message: "Día inválido" });
  if (!hora_inicio || !hora_fin || hora_inicio >= hora_fin) {
    return res.status(400).json({ message: "La hora de fin tiene que ser después del inicio" });
  }

  try {
    const [materia] = await q("SELECT * FROM materias WHERE id = ?", [req.params.id]);
    if (!materia) return res.status(404).json({ message: "Materia no encontrada" });

    if (materia.profesor_id) {
      const otra = await choque({ ...materia, dia, hora_inicio, hora_fin }, materia.profesor_id);
      if (otra) return res.status(400).json({ message: `El profesor ya da ${otra.nombre} en ese horario` });
    }

    await q("UPDATE materias SET dia = ?, hora_inicio = ?, hora_fin = ? WHERE id = ?", [dia, hora_inicio, hora_fin, req.params.id]);
    res.json({ message: "Horario cambiado" });
  } catch (error) {
    res.status(500).json({ message: "No se pudo cambiar el horario" });
  }
};

const desasignarProfesor = (req, res) => {
  const materia_id = req.params.id;
  db.query(
    "UPDATE materias SET profesor_id = NULL WHERE id = ?",
    [materia_id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Profesor desasignado" });
    }
  );
};

module.exports = {
  crearMateria,
  getMaterias,
  asignarProfesor,
  asignarAuto,
  cambiarHorario,
  desasignarProfesor,
  eliminarMateria,
};