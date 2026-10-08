"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/src/store";
import { authHeaders, USERS_API, ACADEMIC_API } from "@/src/lib/api";
import { PanelAlumno } from "@/src/components/panel-alumno";
import { nombreCarrera, ORDEN_DIAS, hhmm } from "@/src/lib/plan";
import styles from "./panel-staff.module.css";

type Usuario = { id: number; nombre: string; rol?: string; email?: string };
type Materia = {
  id: number; nombre: string; profesor_id: number | null; carrera_id?: number | null;
  anio?: number | null; cuatrimestre?: number | null; dia?: string | null;
  hora_inicio?: string | null; hora_fin?: string | null;
};
type Alumno = { id: number; nombre: string; email?: string };

export default function Dashboard() {
  const { user } = useAppStore();
  if (!user) return null;
  if (user.rol === "alumno") return <PanelAlumno />;
  if (user.rol === "profesor") return <VistaProfesor />;
  return <VistaAdmin />;
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

function VistaAdmin() {
  const { user, setUser } = useAppStore();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [inscripciones, setInscripciones] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [u, m, i] = await Promise.allSettled([
        fetch(`${USERS_API}/usuarios`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${ACADEMIC_API}/materias`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${ACADEMIC_API}/inscripciones/count`, { headers: authHeaders() }).then(r => r.json()),
      ]);
      const users: Usuario[] = u.status === "fulfilled" && Array.isArray(u.value) ? u.value : [];
      const mats: Materia[] = m.status === "fulfilled" && Array.isArray(m.value) ? m.value : [];
      setUsuarios(users);
      setMaterias(mats);
      setInscripciones(i.status === "fulfilled" ? (i.value?.total ?? 0) : 0);
      if (!user?.nombre && user?.id) {
        const found = users.find(x => x.id === user.id);
        if (found?.nombre) setUser({ ...user, nombre: found.nombre });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const alumnos = usuarios.filter(u => u.rol === "alumno").length;
  const profesores = usuarios.filter(u => u.rol === "profesor").length;
  const sinProfe = materias.filter(m => !m.profesor_id).length;
  const carreras = [1, 2].map(id => {
    const ms = materias.filter(m => m.carrera_id === id);
    return { id, nombre: nombreCarrera(id), total: ms.length, conProfe: ms.filter(m => m.profesor_id).length };
  }).filter(c => c.total > 0);

  const accesos = [
    { n: "Usuarios", d: "Alumnos, profesores y administradores", href: "/dashboard/usuarios" },
    { n: "Materias", d: "Crear materias y asignar profesores", href: "/dashboard/materias" },
    { n: "Inscripciones", d: "Quién cursa cada materia", href: "/dashboard/inscripciones" },
  ];

  return (
    <div className={styles.pagina}>
      <h1 className={styles.saludo}>Hola, {user?.nombre?.split(" ")[0] || "admin"}</h1>
      <p className={styles.resumen}>
        {loading ? "Cargando el estado de la plataforma..." : `Hay ${plural(alumnos, "alumno", "alumnos")} y ${plural(profesores, "profesor", "profesores")} en ${plural(carreras.length, "carrera", "carreras")}, con ${plural(inscripciones, "inscripción activa", "inscripciones activas")}.`}
      </p>

      {!loading && sinProfe > 0 && (
        <div className={styles.aviso}>
          <span className={styles.avisoTexto}>
            {sinProfe === 1 ? "Hay 1 materia sin profesor asignado." : `Hay ${sinProfe} materias sin profesor asignado.`}
          </span>
          <button type="button" className={styles.btnAviso} onClick={() => router.push("/dashboard/materias?filtro=sin-profesor")}>Asignar profesores</button>
        </div>
      )}

      <div className={styles.cifras}>
        <div className={styles.cifra}><div className={styles.cifraNum}>{loading ? "-" : usuarios.length}</div><div className={styles.cifraEt}>Usuarios</div></div>
        <div className={styles.cifra}><div className={styles.cifraNum}>{loading ? "-" : materias.length}</div><div className={styles.cifraEt}>Materias</div></div>
        <div className={styles.cifra}><div className={styles.cifraNum}>{loading ? "-" : inscripciones}</div><div className={styles.cifraEt}>Inscripciones activas</div></div>
      </div>

      {carreras.length > 0 && (
        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>Carreras</h2>
          <div className={styles.carreras}>
            {carreras.map(c => (
              <div key={c.id} className={`${styles.carreraCard} ${c.id === 2 ? styles.carreraCard2 : ""}`}>
                <div className={styles.carreraNombre}>{c.nombre}</div>
                <div className={styles.carreraDatos}>{c.total} materias, {c.conProfe} con profesor asignado</div>
                <div className={styles.barraFondo}><div className={styles.barraRelleno} style={{ width: `${Math.round((c.conProfe / c.total) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.seccion}>
        <h2 className={styles.seccionTitulo}>Gestión</h2>
        <div className={styles.accesos}>
          {accesos.map(a => (
            <button key={a.href} type="button" className={styles.acceso} onClick={() => router.push(a.href)}>
              <div className={styles.accesoNombre}>{a.n}</div>
              <div className={styles.accesoDesc}>{a.d}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function VistaProfesor() {
  const { user } = useAppStore();
  const router = useRouter();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandida, setExpandida] = useState<number | null>(null);
  const [alumnosPorMateria, setAlumnosPorMateria] = useState<Record<number, Alumno[]>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${ACADEMIC_API}/profesores/${user?.id}/materias`, { headers: authHeaders() });
        const data = await res.json();
        if (Array.isArray(data)) {
          setMaterias([...data].sort((a: Materia, b: Materia) => (ORDEN_DIAS[a.dia ?? ""] ?? 9) - (ORDEN_DIAS[b.dia ?? ""] ?? 9) || (a.hora_inicio ?? "").localeCompare(b.hora_inicio ?? "")));
          const conteos = await Promise.all(data.map((m: Materia) =>
            fetch(`${ACADEMIC_API}/materias/${m.id}/alumnos`, { headers: authHeaders() }).then(r => r.json()).then(a => [m.id, Array.isArray(a) ? a : []] as [number, Alumno[]]).catch(() => [m.id, []] as [number, Alumno[]])
          ));
          setAlumnosPorMateria(Object.fromEntries(conteos));
        }
      } catch {
        /* servicio no disponible */
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [user?.id]);

  const totalAlumnos = new Set(Object.values(alumnosPorMateria).flat().map(a => a.id)).size;
  const dias = new Set(materias.map(m => m.dia).filter(Boolean)).size;

  return (
    <div className={styles.pagina}>
      <h1 className={styles.saludo}>Hola, {user?.nombre?.split(" ")[0] || "profe"}</h1>
      <p className={styles.resumen}>
        {loading ? "Cargando tus materias..." : materias.length === 0
          ? "Todavía no tenés materias asignadas. Cuando el administrador te asigne alguna, la vas a ver acá."
          : `Tenés ${plural(materias.length, "materia", "materias")} a cargo, ${plural(totalAlumnos, "alumno", "alumnos")} en total y clases ${plural(dias, "día", "días")} por semana.`}
      </p>

      <section className={styles.seccion} style={{ marginTop: "1.5rem" }}>
        <h2 className={styles.seccionTitulo}>Mis materias</h2>
        <div className={styles.lista}>
          {loading ? <div className={styles.vacio}>Cargando...</div> : materias.length === 0 ? (
            <div className={styles.vacio}>No tenés materias asignadas todavía</div>
          ) : materias.map(m => {
            const alumnos = alumnosPorMateria[m.id];
            return (
              <div key={m.id} className={styles.fila}>
                <div>
                  <div className={styles.nombre}>{m.nombre}</div>
                  <div className={styles.meta}>
                    {m.carrera_id ? <span className={`${styles.carrera} ${m.carrera_id === 2 ? styles.carrera2 : styles.carrera1}`}>{nombreCarrera(m.carrera_id)}</span> : null}
                    {m.anio ? `${m.anio}° año` : ""}{m.cuatrimestre ? `, ${m.cuatrimestre}° cuatrimestre` : ""}
                  </div>
                </div>
                <div>
                  <div className={styles.horario}>{m.dia ? `${m.dia} de ${hhmm(m.hora_inicio ?? null)} a ${hhmm(m.hora_fin ?? null)}` : "Sin horario"}</div>
                  <div className={styles.horarioSub}>{alumnos ? plural(alumnos.length, "alumno cursando", "alumnos cursando") : "..."}</div>
                </div>
                <div className={styles.acciones}>
                  <button type="button" className={styles.btn} onClick={() => setExpandida(expandida === m.id ? null : m.id)}>{expandida === m.id ? "Ocultar alumnos" : "Ver alumnos"}</button>
                  <button type="button" className={`${styles.btn} ${styles.btnAzul}`} onClick={() => router.push(`/dashboard/materia/${m.id}`)}>Ver notas</button>
                </div>
                {expandida === m.id && (
                  <div className={styles.alumnos}>
                    {!alumnos || alumnos.length === 0 ? <span className={styles.alumnoMail}>Todavía no hay alumnos inscriptos</span> : alumnos.map(a => (
                      <div key={a.id} className={styles.alumno}>
                        <div className={styles.avatar}>{a.nombre.charAt(0).toUpperCase()}</div>
                        <div style={{ minWidth: 0 }}>
                          <div className={styles.alumnoNombre}>{a.nombre}</div>
                          {a.email && <div className={styles.alumnoMail}>{a.email}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
