const ACADEMIC_API = process.env.ACADEMIC_SERVICE_URL || "http://academic-service:4000";
const USERS_API = process.env.USERS_SERVICE_URL || "http://users-service:3001";

const normalizar = (t) =>
  String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

const estados = {
  aprobada: "aprobada",
  regular: "regular (falta el final)",
  cursando: "cursando",
  libre: "libre (tiene que recursar)",
  no_cursada: "sin cursar",
};

async function pedir(url, token) {
  const res = await fetch(url, { headers: { Authorization: token } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

function buscarMateria(materias, texto) {
  const buscado = normalizar(texto);
  if (!buscado) return null;
  return (
    materias.find((m) => m.codigo === texto.trim()) ||
    materias.find((m) => normalizar(m.nombre) === buscado) ||
    materias.find((m) => normalizar(m.nombre).includes(buscado)) ||
    materias.find((m) => buscado.split(/\s+/).filter((p) => p.length > 3).every((p) => normalizar(m.nombre).includes(p))) ||
    null
  );
}

const resumen = (m) => ({
  codigo: m.codigo,
  materia: m.nombre,
  estado: estados[m.estado] || m.estado,
  ...(m.nota !== null ? { nota: Number(m.nota) } : {}),
});

function crearHerramientas(user, token) {
  const plan = (userId) =>
    pedir(`${ACADEMIC_API}/motor/plan${userId ? `?user_id=${userId}` : ""}`, token).then((d) => d.materias);

  const conMateria = async (nombre, fn) => {
    const materias = await plan();
    const m = buscarMateria(materias, nombre);
    if (!m) return { error: `No encontré ninguna materia parecida a "${nombre}"` };
    return fn(m);
  };

  const herramientas = {
    ver_mi_plan_de_estudios: {
      descripcion: "Devuelve todas las materias de la carrera del usuario con su estado (aprobada, regular, cursando, libre o sin cursar) y la nota. Usala para preguntas sobre qué materias cursa, aprobó, debe o le faltan.",
      parametros: {},
      soloAlumno: true,
      ejecutar: async () => {
        const materias = await plan();
        const aprobadas = materias.filter((m) => m.estado === "aprobada").length;
        return { aprobadas, total: materias.length, materias: materias.map(resumen) };
      },
    },

    consultar_materia: {
      descripcion: "Busca una materia por nombre y devuelve código, año, cuatrimestre, horario y sus correlativas.",
      parametros: { materia: "Nombre (o parte del nombre) de la materia" },
      ejecutar: ({ materia }) =>
        conMateria(materia, (m) => ({
          codigo: m.codigo,
          materia: m.nombre,
          anio: m.anio,
          cuatrimestre: m.cuatrimestre,
          horario: m.dia ? `${m.dia} de ${String(m.hora_inicio).slice(0, 5)} a ${String(m.hora_fin).slice(0, 5)}` : "sin horario",
          correlativas: m.correlativas.map((c) => c.nombre),
          ...(user.rol === "alumno" ? { mi_estado: estados[m.estado] } : {}),
        })),
    },

    puedo_cursar: {
      descripcion: "Le pregunta al motor de reglas si el usuario puede inscribirse a cursar una materia. Devuelve si está permitido y los motivos si no.",
      parametros: { materia: "Nombre de la materia" },
      soloAlumno: true,
      ejecutar: ({ materia }) =>
        conMateria(materia, (m) => ({ materia: m.nombre, puede_cursar: m.cursar.permitido, motivos: m.cursar.motivos })),
    },

    puedo_rendir_final: {
      descripcion: "Le pregunta al motor de reglas si el usuario puede rendir el final de una materia. Devuelve si está permitido y los motivos si no.",
      parametros: { materia: "Nombre de la materia" },
      soloAlumno: true,
      ejecutar: ({ materia }) =>
        conMateria(materia, (m) => ({ materia: m.nombre, puede_rendir: m.rendir.permitido, motivos: m.rendir.motivos })),
    },

    materias_que_puedo_cursar: {
      descripcion: "Lista las materias a las que el usuario se puede inscribir ahora según las correlatividades y horarios.",
      parametros: {},
      soloAlumno: true,
      ejecutar: async () => {
        const materias = await plan();
        return {
          materias: materias.filter((m) => m.cursar.permitido).map((m) => ({ codigo: m.codigo, materia: m.nombre })),
        };
      },
    },

    ver_mesas_de_final: {
      descripcion: "Devuelve las próximas fechas de mesas de final. Para alumnos indica a cuáles se puede anotar o ya está anotado.",
      parametros: { materia: "Opcional: filtrar por nombre de materia" },
      ejecutar: async ({ materia } = {}) => {
        let mesas = await pedir(`${ACADEMIC_API}/finales/mesas`, token);
        if (materia) mesas = mesas.filter((m) => normalizar(m.materia).includes(normalizar(materia)));
        return {
          mesas: mesas.map((m) => ({
            materia: m.materia,
            fecha: String(m.fecha).slice(0, 10),
            hora: m.hora ? String(m.hora).slice(0, 5) : null,
            ...(user.rol === "alumno"
              ? { anotado: Boolean(m.inscripcion_id), puede_anotarse: Boolean(m.rendir?.permitido) }
              : {}),
          })),
        };
      },
    },

    ver_situacion_de_alumno: {
      descripcion: "Solo para profesores y admin: busca un alumno por nombre y devuelve el estado de cada materia de su plan.",
      parametros: { alumno: "Nombre del alumno" },
      soloStaff: true,
      ejecutar: async ({ alumno }) => {
        const usuarios = await pedir(`${USERS_API}/usuarios`, token);
        const buscado = normalizar(alumno);
        const a = usuarios.find((u) => u.rol === "alumno" && normalizar(u.nombre).includes(buscado));
        if (!a) return { error: `No encontré ningún alumno parecido a "${alumno}"` };
        const materias = await plan(a.id);
        return {
          alumno: a.nombre,
          materias: materias.filter((m) => m.estado !== "no_cursada").map(resumen),
        };
      },
    },
  };

  const disponibles = Object.entries(herramientas).filter(([, h]) =>
    user.rol === "alumno" ? !h.soloStaff : !h.soloAlumno
  );

  const definiciones = disponibles.map(([nombre, h]) => ({
    type: "function",
    function: {
      name: nombre,
      description: h.descripcion,
      parameters: {
        type: "object",
        properties: Object.fromEntries(
          Object.entries(h.parametros).map(([p, desc]) => [p, { type: "string", description: desc }])
        ),
        required: Object.keys(h.parametros).filter((p) => !h.parametros[p].startsWith("Opcional")),
      },
    },
  }));

  async function ejecutar(nombre, args) {
    const h = disponibles.find(([n]) => n === nombre)?.[1];
    if (!h) return { error: `La herramienta ${nombre} no existe` };
    try {
      return await h.ejecutar(args || {});
    } catch (err) {
      return { error: err.message };
    }
  }

  return { definiciones, ejecutar };
}

module.exports = { crearHerramientas, buscarMateria, normalizar };
