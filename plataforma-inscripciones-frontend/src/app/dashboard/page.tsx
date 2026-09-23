"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/src/store";
import { authHeaders, USERS_API, ACADEMIC_API } from "@/src/lib/api";
import styles from "./dashboard.module.css";

type Usuario = { id: number; nombre: string; rol?: string; email?: string };
type Materia = { id: number; nombre: string; profesor_id: number | null; inscripcion_id?: number };
type Alumno = { id: number; nombre: string; email?: string };

export default function Dashboard() {
  const { user } = useAppStore();
  if (!user) return null;
  if (user.rol === "alumno") return <VistaAlumno />;
  if (user.rol === "profesor") return <VistaProfesor />;
  return <VistaAdmin />;
}

// ─── ADMIN ───────────────────────────────────────────────

function VistaAdmin() {
  const { user, setUser } = useAppStore();
  const router = useRouter();
  const [stats, setStats] = useState({ usuarios: 0, materias: 0, inscripciones: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [usersResult, materiasResult, inscripcionesResult] = await Promise.allSettled([
        fetch(`${USERS_API}/usuarios`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${ACADEMIC_API}/materias`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${ACADEMIC_API}/inscripciones/count`, { headers: authHeaders() }).then(r => r.json()),
      ]);
      const users: Usuario[] = usersResult.status === "fulfilled" && Array.isArray(usersResult.value) ? usersResult.value : [];
      const mats: Materia[] = materiasResult.status === "fulfilled" && Array.isArray(materiasResult.value) ? materiasResult.value : [];
      const insc = inscripcionesResult.status === "fulfilled" ? (inscripcionesResult.value?.total ?? 0) : 0;
      setStats({ usuarios: users.length, materias: mats.length, inscripciones: insc });
      if (!user?.nombre && user?.id) {
        const found = users.find(u => u.id === user.id);
        if (found?.nombre) setUser({ ...user, nombre: found.nombre });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const secciones = [
    { label: "Usuarios", desc: "Ver todos los usuarios registrados", href: "/dashboard/usuarios", cardClass: styles.navCardPurple, labelClass: styles.navLabelPurple },
    { label: "Materias", desc: "Crear materias y asignar profesores", href: "/dashboard/materias", cardClass: styles.navCardBlue, labelClass: styles.navLabelBlue },
    { label: "Inscripciones", desc: "Ver alumnos inscriptos por materia", href: "/dashboard/inscripciones", cardClass: styles.navCardGreen, labelClass: styles.navLabelGreen },
  ];

  return (
    <div className={styles.container}>
      <Encabezado nombre={user?.nombre} subtitulo="Panel de administración" />
      <div className={styles.grid3}>
        <TarjetaStat numero={loading ? "-" : stats.usuarios} label="Usuarios registrados" />
        <TarjetaStat numero={loading ? "-" : stats.materias} label="Materias cargadas" />
        <TarjetaStat numero={loading ? "-" : stats.inscripciones} label="Inscripciones activas" />
      </div>
      <div className={styles.navGrid}>
        {secciones.map(s => (
          <div key={s.href} onClick={() => router.push(s.href)} className={`${styles.navCard} ${s.cardClass}`}>
            <div className={s.labelClass}>{s.label}</div>
            <div className={styles.navCardDesc}>{s.desc}</div>
            <div className={styles.navCardArrow}>Ir →</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ALUMNO ──────────────────────────────────────────────

function VistaAlumno() {
  const { user } = useAppStore();
  const router = useRouter();
  const [todasMaterias, setTodasMaterias] = useState<Materia[]>([]);
  const [misMaterias, setMisMaterias] = useState<Materia[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [inscribiendo, setInscribiendo] = useState<number | null>(null);
  const [desinscribiendo, setDesinscribiendo] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [todasRes, misRes, usersRes] = await Promise.allSettled([
        fetch(`${ACADEMIC_API}/materias`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${ACADEMIC_API}/inscripciones/usuarios/${user?.id}/materias`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${USERS_API}/usuarios`, { headers: authHeaders() }).then(r => r.json()),
      ]);
      if (todasRes.status === "fulfilled" && Array.isArray(todasRes.value)) setTodasMaterias(todasRes.value);
      if (misRes.status === "fulfilled" && Array.isArray(misRes.value)) setMisMaterias(misRes.value);
      if (usersRes.status === "fulfilled" && Array.isArray(usersRes.value)) setUsuarios(usersRes.value);
      setLoading(false);
    };
    if (user?.id) fetchData();
  }, [user?.id]);

  const nombreProfesor = (profesorId: number | null) => {
    if (!profesorId) return null;
    return usuarios.find(u => u.id === profesorId)?.nombre ?? null;
  };

  const inscribirse = async (materiaId: number) => {
  setInscribiendo(materiaId);
  try {
    const res = await fetch(`${ACADEMIC_API}/inscripciones`, {
  method: "POST",
  headers: authHeaders(),
  body: JSON.stringify({ user_id: user?.id, materia_id: materiaId }),
});
    const data = await res.json();
    if (!res.ok) {
      toast.warning(data.message || "No se pudo inscribir");
    } else {
      toast.success("¡Inscripción exitosa!");
      const materia = todasMaterias.find(m => m.id === materiaId);
      if (materia) setMisMaterias(prev => [...prev, { ...materia, inscripcion_id: data.id }]);
    }
  } catch {
    toast.warning("Error al conectar con el servidor");
  } finally {
    setInscribiendo(null);
  }
};

  const desinscribirse = async (materiaId: number, inscripcionId?: number) => {
  if (!inscripcionId) return;
  setDesinscribiendo(materiaId);
  try {
    const res = await fetch(`${ACADEMIC_API}/inscripciones/${inscripcionId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) {
      toast.success("Desinscripción exitosa");
      setMisMaterias(prev => prev.filter(m => m.id !== materiaId));
    } else {
      const data = await res.json();
      toast.warning(data.message || "No se pudo desinscribir");
    }
  } catch {
    toast.warning("Error al conectar con el servidor");
  } finally {
    setDesinscribiendo(null);
  }
};

  const yaInscrito = (materiaId: number) => misMaterias.some(m => m.id === materiaId);

  return (
    <div className={styles.container}>
      <Encabezado nombre={user?.nombre} subtitulo="Período lectivo 2026" />
      <div className={styles.grid2}>
        <TarjetaStat numero={todasMaterias.length} label="Materias disponibles" />
        <TarjetaStat numero={misMaterias.length} label="Mis inscripciones" />
      </div>
      <div className={styles.grid2}>
        <TablaTarjeta titulo="Materias disponibles">
          {loading ? <FilaCargando /> : todasMaterias.map((m) => (
            <div key={m.id} className={styles.tableRowFlex}>
              <div className={styles.itemInfo}>
                <div className={styles.itemTitle}>{m.nombre}</div>
                {nombreProfesor(m.profesor_id) && (
                  <div className={styles.muted}>Prof. {nombreProfesor(m.profesor_id)}</div>
                )}
              </div>
              {yaInscrito(m.id) ? (
                <span className={styles.pillSuccess}>Inscrito</span>
              ) : (
                <button type="button" onClick={() => inscribirse(m.id)} disabled={inscribiendo === m.id} className={styles.btnEnroll}>
                  {inscribiendo === m.id ? "..." : "Inscribirme"}
                </button>
              )}
            </div>
          ))}
        </TablaTarjeta>

        <TablaTarjeta titulo="Mis materias">
          {loading ? <FilaCargando /> : misMaterias.length === 0 ? (
            <div className={styles.noData}>Todavía no estás inscrito en ninguna materia</div>
          ) : misMaterias.map((m) => (
            <div key={m.id} className={styles.tableRowFlex}>
              <div className={styles.itemClickable} onClick={() => router.push(`/dashboard/materia/${m.id}`)}>
                <div className={styles.itemTitle}>{m.nombre}</div>
                {nombreProfesor(m.profesor_id) && (
                  <div className={styles.muted}>Prof. {nombreProfesor(m.profesor_id)}</div>
                )}
              </div>
              <button
  type="button"
  onClick={() => desinscribirse(m.id, m.inscripcion_id)}
  disabled={desinscribiendo === m.id}
  className={styles.btnUnenroll}
>
  {desinscribiendo === m.id ? "..." : "Salir"}
</button>
            </div>
          ))}
        </TablaTarjeta>
      </div>
    </div>
  );
}

// ─── PROFESOR ────────────────────────────────────────────

function VistaProfesor() {
  const { user } = useAppStore();
  const router = useRouter();
  const [misMaterias, setMisMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandida, setExpandida] = useState<number | null>(null);
  const [alumnosPorMateria, setAlumnosPorMateria] = useState<Record<number, Alumno[]>>({});
  const [cargandoAlumnos, setCargandoAlumnos] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${ACADEMIC_API}/profesores/${user?.id}/materias`, { headers: authHeaders() });
        const data = await res.json();
        if (Array.isArray(data)) setMisMaterias(data);
      } catch {
        // servicio no disponible
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [user?.id]);

  const toggleMateria = async (materiaId: number) => {
    if (expandida === materiaId) {
      setExpandida(null);
      return;
    }
    setExpandida(materiaId);
    if (alumnosPorMateria[materiaId] !== undefined) return;
    setCargandoAlumnos(materiaId);
    try {
      const res = await fetch(`${ACADEMIC_API}/materias/${materiaId}/alumnos`, { headers: authHeaders() });
      const data = await res.json();
      setAlumnosPorMateria(prev => ({ ...prev, [materiaId]: Array.isArray(data) ? data : [] }));
    } catch {
      setAlumnosPorMateria(prev => ({ ...prev, [materiaId]: [] }));
    } finally {
      setCargandoAlumnos(null);
    }
  };

  return (
    <div className={styles.container}>
      <Encabezado nombre={user?.nombre} subtitulo="Período lectivo 2026" />
      <div className={styles.grid3}>
        <TarjetaStat numero={misMaterias.length} label="Materias a cargo" />
      </div>
      <TablaTarjeta titulo="Mis materias">
        {loading ? <FilaCargando /> : misMaterias.length === 0 ? (
          <div className={styles.noData}>No tenés materias asignadas todavía</div>
        ) : misMaterias.map((m) => (
          <div key={m.id}>
            <div className={`${styles.tableRowFlex} ${styles.expandable}`}>
              <div className={styles.itemInfo}>
                <div className={styles.itemTitle}>{m.nombre}</div>
                {alumnosPorMateria[m.id] !== undefined && (
                  <div className={styles.muted}>
                    {alumnosPorMateria[m.id].length} alumno{alumnosPorMateria[m.id].length !== 1 ? "s" : ""} inscripto{alumnosPorMateria[m.id].length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
              <div className={styles.rowActions}>
                <button type="button" className={styles.btnVerAlumnos} onClick={() => toggleMateria(m.id)}>
                  {expandida === m.id ? "Ocultar" : "Ver alumnos"}
                </button>
                <button type="button" className={styles.btnEnroll} onClick={() => router.push(`/dashboard/materia/${m.id}`)}>
                  Ver notas
                </button>
              </div>
            </div>
            {expandida === m.id && (
              <div className={styles.detailsBox}>
                {cargandoAlumnos === m.id ? (
                  <div className={styles.detailsText}>Cargando alumnos...</div>
                ) : alumnosPorMateria[m.id]?.length === 0 ? (
                  <div className={styles.detailsText}>Sin alumnos inscriptos</div>
                ) : (
                  <div className={styles.detailsList}>
                    {alumnosPorMateria[m.id]?.map((a) => (
                      <div key={a.id} className={styles.tableRow}>
                        <Avatar nombre={a.nombre} />
                        <div>
                          <div className={styles.itemTitle}>{a.nombre}</div>
                          {a.email && <div className={styles.muted}>{a.email}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </TablaTarjeta>
    </div>
  );
}

// ─── COMPONENTES COMPARTIDOS ─────────────────────────────

function Encabezado({ nombre, subtitulo }: { nombre?: string; subtitulo: string }) {
  return (
    <div className={styles.mb1}>
      <h1 className={styles.headerTitle}>Bienvenido, {nombre || "Usuario"}!</h1>
      <p className={styles.headerSubtitle}>{subtitulo}</p>
    </div>
  );
}

function TarjetaStat({ numero, label }: { numero: number | string; label: string }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statNumber}>{numero}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function TablaTarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{titulo}</h2>
      </div>
      {children}
    </div>
  );
}

function Avatar({ nombre }: { nombre: string }) {
  return (
    <div className={styles.avatar}>{nombre ? nombre.charAt(0).toUpperCase() : "?"}</div>
  );
}

function FilaCargando() {
  return <div className={styles.loadingRow}>Cargando...</div>;
}