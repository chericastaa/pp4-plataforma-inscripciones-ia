"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "@/src/store";
import { useRouter } from "next/navigation";
import { authHeaders, USERS_API, ACADEMIC_API } from "@/src/lib/api";
import { nombreCarrera } from "@/src/lib/plan";
import "./inscripciones.css";

type Materia = { id: number; nombre: string; profesor_id: number | null; carrera_id?: number | null };
type Alumno = { id: number; nombre: string; email?: string };
type Usuario = { id: number; nombre: string; rol?: string };
type Calificacion = { user_id: number; parcial1?: number; parcial2?: number; nota?: number };
type Periodo = { id: number; nombre: string; actual: number };
type Mesa = { id: number; fecha: string; hora: string | null; materia_id: number };
type InscriptoFinal = { id: number; user_id: number; nombre: string | null; nota: number | null };

const fechaLarga = (f: string) =>
  new Date(f).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const yaPaso = (f: string) => f.slice(0, 10) < new Date().toISOString().slice(0, 10);

export default function PageInscripciones() {
  const { user } = useAppStore();
  const router = useRouter();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandida, setExpandida] = useState<number | null>(null);
  const [alumnosPorMateria, setAlumnosPorMateria] = useState<Record<number, Alumno[]>>({});
  const [calificacionesPorMateria, setCalificacionesPorMateria] = useState<Record<number, Calificacion[]>>({});
  const [cargandoAlumnos, setCargandoAlumnos] = useState<number | null>(null);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoSel, setPeriodoSel] = useState("");
  const [mesas, setMesas] = useState<Mesa[] | null>(null);
  const [inscriptosPorMesa, setInscriptosPorMesa] = useState<Record<number, InscriptoFinal[]>>({});

  useEffect(() => {
    if (user?.rol !== "admin") { router.push("/dashboard"); return; }
    const fetchData = async () => {
      const [materiasRes, usersRes, periodosRes] = await Promise.allSettled([
        fetch(`${ACADEMIC_API}/materias`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${USERS_API}/usuarios`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${ACADEMIC_API}/inscripciones/periodos`, { headers: authHeaders() }).then(r => r.json()),
      ]);
      if (periodosRes.status === "fulfilled" && Array.isArray(periodosRes.value)) setPeriodos(periodosRes.value);
      if (materiasRes.status === "fulfilled" && Array.isArray(materiasRes.value)) setMaterias(materiasRes.value);
      if (usersRes.status === "fulfilled" && Array.isArray(usersRes.value)) setUsuarios(usersRes.value);
      setLoading(false);
    };
    fetchData();
  }, []);

  const cargarFinales = async (materiaId: number) => {
    let lista = mesas;
    if (lista === null) {
      const res = await fetch(`${ACADEMIC_API}/finales/mesas?todas=1`, { headers: authHeaders() })
        .then(r => r.json())
        .catch(() => []);
      lista = Array.isArray(res) ? res : [];
      setMesas(lista);
    }
    const propias = lista.filter(x => x.materia_id === materiaId);
    const filas = await Promise.all(
      propias.map(x =>
        fetch(`${ACADEMIC_API}/finales/mesas/${x.id}/inscriptos`, { headers: authHeaders() })
          .then(r => r.json())
          .then(d => [x.id, Array.isArray(d) ? d : []] as [number, InscriptoFinal[]])
          .catch(() => [x.id, []] as [number, InscriptoFinal[]])
      )
    );
    setInscriptosPorMesa(prev => ({ ...prev, ...Object.fromEntries(filas) }));
  };

  const cambiarPeriodo = (valor: string) => {
    setPeriodoSel(valor);
    setExpandida(null);
    setAlumnosPorMateria({});
    setCalificacionesPorMateria({});
  };

  const query = periodoSel ? `?periodo=${periodoSel}` : "";

  const toggleMateria = async (materiaId: number) => {
    if (expandida === materiaId) { setExpandida(null); return; }
    setExpandida(materiaId);
    if (alumnosPorMateria[materiaId] !== undefined) return;
    setCargandoAlumnos(materiaId);
    try {
      const [inscRes, califRes] = await Promise.allSettled([
        fetch(`${ACADEMIC_API}/inscripciones/materias/${materiaId}/alumnos${query}`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${ACADEMIC_API}/materias/${materiaId}/calificaciones${query}`, { headers: authHeaders() }).then(r => r.json()),
        cargarFinales(materiaId),
      ]);

      if (inscRes.status === "fulfilled") {
        const ids: number[] = Array.isArray(inscRes.value) ? inscRes.value.map((d: { user_id: number }) => d.user_id) : [];
        const alumnos = ids
          .map(id => usuarios.find(u => u.id === id))
          .filter((u): u is Usuario => !!u && u.rol === "alumno")
          .map(u => ({ id: u.id, nombre: u.nombre }));
        setAlumnosPorMateria(prev => ({ ...prev, [materiaId]: alumnos }));
      }

      if (califRes.status === "fulfilled" && Array.isArray(califRes.value)) {
        setCalificacionesPorMateria(prev => ({ ...prev, [materiaId]: califRes.value }));
      }
    } catch {
      setAlumnosPorMateria(prev => ({ ...prev, [materiaId]: [] }));
    } finally {
      setCargandoAlumnos(null);
    }
  };

  const nombreProfesor = (id: number | null) =>
    id ? (usuarios.find(u => u.id === id)?.nombre ?? `ID: ${id}`) : "Sin asignar";

  const mesasDe = (materiaId: number) => (mesas ?? []).filter(x => x.materia_id === materiaId);

  const getNotaAlumno = (materiaId: number, alumnoId: number) =>
    calificacionesPorMateria[materiaId]?.find(c => c.user_id === alumnoId);

  return (
    <div className="inscripciones-container">
      <div className="inscripciones-header">
        <h1 className="inscripciones-title">Inscripciones</h1>
        <p className="inscripciones-subtitle">Abrí una materia para ver quién se inscribió a cursar y quién se anotó a cada final.</p>
        <label className="periodo-selector">
          Cursada de
          <select value={periodoSel} onChange={e => cambiarPeriodo(e.target.value)}>
            <option value="">La más reciente de cada alumno</option>
            {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}{p.actual ? " (abierto)" : ""}</option>)}
            <option value="todos">Todos los períodos</option>
          </select>
        </label>
      </div>

      <div className="inscripciones-card">
        <div className="inscripciones-card-header">
          <h2 className="inscripciones-card-title">Materias</h2>
        </div>
        {loading ? (
          <div className="inscripciones-loading">Cargando...</div>
        ) : materias.length === 0 ? (
          <div className="inscripciones-empty">No hay materias cargadas</div>
        ) : materias.map(m => (
          <div key={m.id}>
            <div className="materia-row" style={{ display: "flex", alignItems: "center" }}>
              <div
                onClick={() => toggleMateria(m.id)}
                style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              >
                <div className="materia-info">
                  <div className="materia-nombre">
                    {m.nombre}
                    {alumnosPorMateria[m.id] !== undefined && (
                      <span style={{ marginLeft: "8px", fontSize: "13px", color: "#6b7280" }}>
                        ({alumnosPorMateria[m.id].length})
                      </span>
                    )}
                  </div>
                  <div className="materia-profesor">{m.carrera_id ? `${nombreCarrera(m.carrera_id)} · ` : ""}Profesor: {nombreProfesor(m.profesor_id)}</div>
                </div>
                <span className="materia-icon">{expandida === m.id ? "▲" : "▼"}</span>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/materia/${m.id}`)}
                style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", background: "#185FA5", color: "#fff", border: "none", cursor: "pointer", marginLeft: "12px", whiteSpace: "nowrap" }}
              >
                Ver/editar notas
              </button>
            </div>
            {expandida === m.id && (
              <div className="materia-expanded">
                {cargandoAlumnos === m.id ? (
                  <div className="alumnos-loading">Cargando inscriptos...</div>
                ) : (
                  <>
                    <h3 className="seccion-titulo">
                      Inscriptos a cursar
                      <span className="seccion-cuenta">{alumnosPorMateria[m.id]?.length ?? 0}</span>
                    </h3>
                    {!alumnosPorMateria[m.id]?.length ? (
                      <div className="alumnos-empty">Nadie se inscribió a cursar esta materia.</div>
                    ) : (
                      <div className="alumnos-list">
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 12px", fontSize: "11px", color: "#9ca3af", fontWeight: 600 }}>
                          <span>Alumno</span>
                          <span style={{ display: "flex", gap: "24px" }}>
                            <span>P1</span>
                            <span>P2</span>
                            <span>Nota</span>
                          </span>
                        </div>
                        {alumnosPorMateria[m.id]?.map(a => {
                          const nota = getNotaAlumno(m.id, a.id);
                          const final = nota?.nota !== undefined && nota.nota !== null ? Number(nota.nota).toFixed(2) : "-";
                          const aprueba = nota?.nota !== undefined && nota.nota !== null && Number(nota.nota) >= 7;
                          return (
                            <div key={a.id} className="alumno-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div className="alumno-avatar">{a.nombre.charAt(0).toUpperCase()}</div>
                                {a.nombre}
                              </div>
                              <div style={{ display: "flex", gap: "24px", fontSize: "12px", minWidth: "120px", justifyContent: "flex-end" }}>
                                <span>{nota?.parcial1 !== undefined && nota.parcial1 !== null ? Number(nota.parcial1).toFixed(2) : "-"}</span>
                                <span>{nota?.parcial2 !== undefined && nota.parcial2 !== null ? Number(nota.parcial2).toFixed(2) : "-"}</span>
                                <span style={{ fontWeight: 600, color: final === "-" ? "#9ca3af" : aprueba ? "#16a34a" : "#dc2626" }}>
                                  {final}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <h3 className="seccion-titulo seccion-final">Inscriptos a finales</h3>
                    {mesasDe(m.id).length === 0 ? (
                      <div className="alumnos-empty">Esta materia no tiene mesas de final cargadas.</div>
                    ) : (
                      mesasDe(m.id).map(mesa => {
                        const lista = inscriptosPorMesa[mesa.id] ?? [];
                        return (
                          <div key={mesa.id} className="mesa-bloque">
                            <div className="mesa-cabecera">
                              <span className="mesa-fecha">
                                Final del {fechaLarga(mesa.fecha)}{mesa.hora ? `, ${mesa.hora.slice(0, 5)} hs` : ""}
                              </span>
                              <span className="mesa-estado">
                                {yaPaso(mesa.fecha) ? "Ya se rindió" : "Próxima"} · {lista.length} {lista.length === 1 ? "inscripto" : "inscriptos"}
                              </span>
                            </div>
                            {lista.length === 0 ? (
                              <div className="alumnos-empty">Nadie se anotó a esta mesa.</div>
                            ) : (
                              lista.map(i => (
                                <div key={i.id} className="alumno-row mesa-alumno">
                                  <div className="alumno-avatar">{(i.nombre ?? "?").charAt(0).toUpperCase()}</div>
                                  <span className="mesa-nombre">{i.nombre ?? `Alumno ${i.user_id}`}</span>
                                  <span
                                    className="mesa-nota"
                                    style={{ color: i.nota === null ? "#9ca3af" : Number(i.nota) >= 4 ? "#16a34a" : "#dc2626" }}
                                  >
                                    {i.nota === null ? "Sin nota" : `Nota ${Number(i.nota).toFixed(1)}`}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}