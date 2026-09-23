"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "@/src/store";
import { useRouter } from "next/navigation";
import { authHeaders, USERS_API, ACADEMIC_API } from "@/src/lib/api";
import "./inscripciones.css";

type Materia = { id: number; nombre: string; profesor_id: number | null };
type Alumno = { id: number; nombre: string; email?: string };
type Usuario = { id: number; nombre: string; rol?: string };
type Calificacion = { user_id: number; parcial1?: number; parcial2?: number; nota?: number };

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

  useEffect(() => {
    if (user?.rol !== "admin") { router.push("/dashboard"); return; }
    const fetchData = async () => {
      const [materiasRes, usersRes] = await Promise.allSettled([
        fetch(`${ACADEMIC_API}/materias`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${USERS_API}/usuarios`, { headers: authHeaders() }).then(r => r.json()),
      ]);
      if (materiasRes.status === "fulfilled" && Array.isArray(materiasRes.value)) setMaterias(materiasRes.value);
      if (usersRes.status === "fulfilled" && Array.isArray(usersRes.value)) setUsuarios(usersRes.value);
      setLoading(false);
    };
    fetchData();
  }, []);

  const toggleMateria = async (materiaId: number) => {
    if (expandida === materiaId) { setExpandida(null); return; }
    setExpandida(materiaId);
    if (alumnosPorMateria[materiaId] !== undefined) return;
    setCargandoAlumnos(materiaId);
    try {
      const [inscRes, califRes] = await Promise.allSettled([
        fetch(`${ACADEMIC_API}/inscripciones/materias/${materiaId}/alumnos`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${ACADEMIC_API}/materias/${materiaId}/calificaciones`, { headers: authHeaders() }).then(r => r.json()),
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

  const getNotaAlumno = (materiaId: number, alumnoId: number) =>
    calificacionesPorMateria[materiaId]?.find(c => c.user_id === alumnoId);

  return (
    <div className="inscripciones-container">
      <div className="inscripciones-header">
        <h1 className="inscripciones-title">Inscripciones</h1>
        <p className="inscripciones-subtitle">Alumnos inscriptos por materia</p>
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
                  <div className="materia-profesor">Profesor: {nombreProfesor(m.profesor_id)}</div>
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
                  <div className="alumnos-loading">Cargando alumnos...</div>
                ) : alumnosPorMateria[m.id]?.length === 0 ? (
                  <div className="alumnos-empty">Sin alumnos inscriptos</div>
                ) : (
                  <div className="alumnos-list">
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 12px", fontSize: "11px", color: "#9ca3af", fontWeight: 600 }}>
                      <span>Alumno</span>
                      <span style={{ display: "flex", gap: "24px" }}>
                        <span>P1</span>
                        <span>P2</span>
                        <span>Final</span>
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
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}