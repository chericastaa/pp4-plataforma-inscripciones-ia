"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/src/store";
import { toast } from "sonner";
import { authHeaders, ACADEMIC_API, USERS_API } from "@/src/lib/api";
import styles from "./materia.module.css";

type Calificacion = { id: number; user_id: number; parcial1?: number; parcial2?: number; nota?: number; comentario?: string };
type Materia = { id: number; nombre: string; profesor_id: number | null };
type Usuario = { id: number; nombre: string; rol?: string; email?: string };

export default function DetalleMateria() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAppStore();
  const router = useRouter();

  const [materia, setMateria] = useState<Materia | null>(null);
  const [profesor, setProfesor] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [alumnos, setAlumnos] = useState<number[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notaForm, setNotaForm] = useState<Record<number, { parcial1: string; parcial2: string; comentario: string }>>({});
  const [guardandoNota, setGuardandoNota] = useState<number | null>(null);

  const esProfesor = user?.rol === "profesor";
  const esAdmin = user?.rol === "admin";
  const esAlumno = !esProfesor && !esAdmin;
  const puedeEditar = esProfesor || esAdmin;

  useEffect(() => {
    const fetchData = async () => {
      const [materiaRes, usersRes, inscRes, califRes] = await Promise.allSettled([
        fetch(`${ACADEMIC_API}/materias/${id}`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${USERS_API}/usuarios`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${ACADEMIC_API}/inscripciones/materias/${id}/alumnos`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${ACADEMIC_API}/materias/${id}/calificaciones`, { headers: authHeaders() }).then(r => r.json()),
      ]);

      if (materiaRes.status === "fulfilled" && materiaRes.value?.id) {
        setMateria(materiaRes.value);
        if (usersRes.status === "fulfilled" && Array.isArray(usersRes.value)) {
          const us: Usuario[] = usersRes.value;
          setUsuarios(us);
          const prof = us.find(u => u.id === materiaRes.value.profesor_id);
          if (prof) setProfesor(prof.nombre);
        }
      }
      if (inscRes.status === "fulfilled" && Array.isArray(inscRes.value)) {
        setAlumnos(inscRes.value.map((i: { user_id: number }) => i.user_id));
      }
      if (califRes.status === "fulfilled" && Array.isArray(califRes.value)) {
        setCalificaciones(califRes.value);
      }
      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    if (calificaciones.length === 0) return;
    const inicial: Record<number, { parcial1: string; parcial2: string; comentario: string }> = {};
    calificaciones.forEach(c => {
      inicial[c.user_id] = {
        parcial1: c.parcial1 !== undefined && c.parcial1 !== null ? String(c.parcial1) : "",
        parcial2: c.parcial2 !== undefined && c.parcial2 !== null ? String(c.parcial2) : "",
        comentario: c.comentario ?? "",
      };
    });
    setNotaForm(inicial);
  }, [calificaciones]);

  const calcularPromedio = (p1?: number, p2?: number) => {
    const n1 = p1 !== undefined && p1 !== null ? Number(p1) : null;
    const n2 = p2 !== undefined && p2 !== null ? Number(p2) : null;
    if (n1 !== null && n2 !== null) return ((n1 + n2) / 2).toFixed(2);
    if (n1 !== null) return n1.toFixed(2);
    if (n2 !== null) return n2.toFixed(2);
    return null;
  };

  const guardarNota = async (alumnoId: number, yaExiste: boolean) => {
  const form = notaForm[alumnoId] ?? {};
  if (!form.parcial1 && !form.parcial2) { toast.warning("Ingresá al menos una nota"); return; }
  setGuardandoNota(alumnoId);

  const p1 = form.parcial1 ? Number(form.parcial1) : undefined;
  const p2 = form.parcial2 ? Number(form.parcial2) : undefined;
  const promedio = p1 !== undefined && p2 !== undefined ? (p1 + p2) / 2 : p1 ?? p2;

  try {
    const url = yaExiste
      ? `${ACADEMIC_API}/materias/${id}/calificaciones/${alumnoId}`
      : `${ACADEMIC_API}/materias/${id}/calificaciones`;
    const res = await fetch(url, {
      method: yaExiste ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify({ user_id: alumnoId, parcial1: p1, parcial2: p2, nota: promedio, comentario: form.comentario }),
    });
    if (!res.ok) { toast.warning("Error al guardar"); return; }
    toast.success("Nota guardada");
    setCalificaciones(prev => {
      const existe = prev.find(c => c.user_id === alumnoId);
      const nueva = { id: Date.now(), user_id: alumnoId, parcial1: p1, parcial2: p2, nota: promedio, comentario: form.comentario };
      if (existe) return prev.map(c => c.user_id === alumnoId ? nueva : c);
      return [...prev, nueva];
    });
  } catch { toast.warning("Error al conectar"); }
  finally { setGuardandoNota(null); }
};

  const getCalif = (alumnoId: number) => calificaciones.find(c => c.user_id === alumnoId);
  const miCalif = calificaciones.find(c => c.user_id === user?.id);

  if (loading) return <div className={styles.loading}>Cargando...</div>;
  if (!materia) return <div className={styles.loading}>Materia no encontrada</div>;

  return (
    <div className={styles.container}>
      <button type="button" onClick={() => router.back()} className={styles.backBtn}>← Volver</button>

      <div className={styles.header}>
        <div className={styles.headerIcon}>{materia.nombre.charAt(0).toUpperCase()}</div>
        <div>
          <h1 className={styles.title}>{materia.nombre}</h1>
          {profesor && <p className={styles.subtitle}>Profesor/a: {profesor}</p>}
          <p className={styles.subtitle}>{alumnos.length} alumno{alumnos.length !== 1 ? "s" : ""} inscripto{alumnos.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className={styles.feed}>
        <h2 className={styles.feedTitle}>Calificaciones</h2>

        {esAlumno && (
          <div className={styles.miNotaBox}>
            {miCalif ? (
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>Parcial 1</div>
                  <div style={{ fontSize: "22px", fontWeight: 600, color: "#111827" }}>
                    {miCalif.parcial1 !== undefined && miCalif.parcial1 !== null ? Number(miCalif.parcial1).toFixed(2) : "-"}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>Parcial 2</div>
                  <div style={{ fontSize: "22px", fontWeight: 600, color: "#111827" }}>
                    {miCalif.parcial2 !== undefined && miCalif.parcial2 !== null ? Number(miCalif.parcial2).toFixed(2) : "-"}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>Nota Final</div>
                  <div style={{ fontSize: "22px", fontWeight: 600, color: miCalif.nota !== undefined && Number(miCalif.nota) < 7 ? "#dc2626" : "#16a34a" }}>
                    {miCalif.nota !== undefined && miCalif.nota !== null ? Number(miCalif.nota).toFixed(2) : "-"}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.empty}>Tu profesor todavía no cargó tus notas.</div>
            )}
            {miCalif?.nota !== undefined && miCalif.nota !== null && Number(miCalif.nota) < 7 && (
              <div style={{ marginTop: "12px", padding: "8px 16px", background: "#fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "13px", textAlign: "center" }}>
               Debés rendir examen final
              </div>
            )}
            {miCalif?.comentario && (
              <div style={{ marginTop: "8px", fontSize: "13px", color: "#6b7280", textAlign: "center" }}>"{miCalif.comentario}"</div>
            )}
          </div>
        )}

        {puedeEditar && (
          alumnos.length === 0 ? (
            <div className={styles.empty}>No hay alumnos inscriptos en esta materia.</div>
          ) : (
            <div className={styles.notas}>
              {alumnos.map(uid => {
                const calif = getCalif(uid);
                const alumno = usuarios.find(u => u.id === uid);
                if (!alumno || alumno.rol !== "alumno") return null;
                const promedio = calif ? calcularPromedio(calif.parcial1, calif.parcial2) : null;
                const fin = promedio && !isNaN(Number(promedio)) ? Number(promedio) : null;
                const val = (n?: number | null) => (n !== undefined && n !== null ? Number(n).toFixed(2) : "-");
                return (
                  <div key={uid} className={styles.alumnoCard}>
                    <div className={styles.alumnoTop}>
                      <div className={styles.alumnoNombre}>
                        <div className={styles.avatarSmall}>{alumno.nombre.charAt(0).toUpperCase()}</div>
                        <div>
                          <div>{alumno.nombre}</div>
                          {alumno.email && <div className={styles.alumnoMail}>{alumno.email}</div>}
                        </div>
                      </div>
                      {calif ? (
                        <div className={styles.chips}>
                          <span className={styles.chipNota}>Parcial 1 <b>{val(calif.parcial1)}</b></span>
                          <span className={styles.chipNota}>Parcial 2 <b>{val(calif.parcial2)}</b></span>
                          <span className={`${styles.chipNota} ${fin !== null && fin < 7 ? styles.chipBaja : styles.chipFinal}`}>Final <b>{fin !== null ? fin.toFixed(2) : "-"}</b></span>
                        </div>
                      ) : (
                        <span className={styles.sinNota}>Sin notas cargadas</span>
                      )}
                    </div>
                    <div className={styles.notaForm}>
                      <label className={styles.notaCampo}>
                        <span>Parcial 1</span>
                        <input type="number" min="0" max="10" step="0.1" value={notaForm[uid]?.parcial1 ?? ""}
                          onChange={e => setNotaForm(p => ({ ...p, [uid]: { ...p[uid], parcial1: e.target.value } }))} className={styles.notaInput} />
                      </label>
                      <label className={styles.notaCampo}>
                        <span>Parcial 2</span>
                        <input type="number" min="0" max="10" step="0.1" value={notaForm[uid]?.parcial2 ?? ""}
                          onChange={e => setNotaForm(p => ({ ...p, [uid]: { ...p[uid], parcial2: e.target.value } }))} className={styles.notaInput} />
                      </label>
                      <label className={`${styles.notaCampo} ${styles.notaCampoAncho}`}>
                        <span>Comentario</span>
                        <input type="text" value={notaForm[uid]?.comentario ?? ""}
                          onChange={e => setNotaForm(p => ({ ...p, [uid]: { ...p[uid], comentario: e.target.value } }))} className={styles.notaInputWide} />
                      </label>
                      <div className={styles.notaBotones}>
                        <button type="button" onClick={() => guardarNota(uid, !!calif)} disabled={guardandoNota === uid} className={styles.btnGuardarNota}>
                          {guardandoNota === uid ? "..." : calif ? "Actualizar" : "Guardar"}
                        </button>
                        {calif && (
                          <button
                            type="button"
                            className={styles.btnLimpiar}
                            onClick={async () => {
                              if (!confirm("¿Borrar las notas de este alumno?")) return;
                              await fetch(`${ACADEMIC_API}/materias/${id}/calificaciones/${uid}`, { method: "DELETE", headers: authHeaders() });
                              setCalificaciones(prev => prev.filter(c => c.user_id !== uid));
                              setNotaForm(prev => ({ ...prev, [uid]: { parcial1: "", parcial2: "", comentario: "" } }));
                              toast.success("Notas eliminadas");
                            }}
                          >
                            Borrar notas
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}