"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/src/store";
import { useRouter } from "next/navigation";
import { authHeaders, USERS_API, ACADEMIC_API } from "@/src/lib/api";
import { nombreCarrera, hhmm } from "@/src/lib/plan";
import styles from "./materias.module.css";

type Usuario = { id: number; nombre: string; rol?: string };
type Materia = {
  id: number; nombre: string; profesor_id: number | null; codigo?: string | null; carrera_id?: number | null;
  anio?: number | null; cuatrimestre?: number | null; dia?: string | null; hora_inicio?: string | null; hora_fin?: string | null;
};

export default function PageMaterias() {
  const { user } = useAppStore();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevaMateria, setNuevaMateria] = useState({ nombre: "", profesor_id: "" });
  const [creando, setCreando] = useState(false);
  const [seleccion, setSeleccion] = useState<Record<number, string>>({});
  const [asignando, setAsignando] = useState<number | null>(null);
  const [desasignando, setDesasignando] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [carrera, setCarrera] = useState<number>(0);
  const [soloSinProfe, setSoloSinProfe] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const profesores = usuarios.filter(u => u.rol === "profesor");

  useEffect(() => {
    if (user?.rol !== "admin") { router.push("/dashboard"); return; }
    const fetchData = async () => {
      const [usersRes, materiasRes] = await Promise.allSettled([
        fetch(`${USERS_API}/usuarios`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${ACADEMIC_API}/materias`, { headers: authHeaders() }).then(r => r.json()),
      ]);
      if (usersRes.status === "fulfilled" && Array.isArray(usersRes.value)) setUsuarios(usersRes.value);
      if (materiasRes.status === "fulfilled" && Array.isArray(materiasRes.value)) setMaterias(materiasRes.value);
      if (new URLSearchParams(window.location.search).get("filtro") === "sin-profesor") setSoloSinProfe(true);
      setLoading(false);
    };
    fetchData();
  }, []);

  const crearMateria = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    try {
      const res = await fetch(`${ACADEMIC_API}/admin/materias`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ nombre: nuevaMateria.nombre, profesor_id: nuevaMateria.profesor_id ? Number(nuevaMateria.profesor_id) : null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.warning(data.message || "No se pudo crear");
      } else {
        toast.success("Materia creada!");
        setMaterias(prev => [...prev, { id: data.id, nombre: nuevaMateria.nombre, profesor_id: nuevaMateria.profesor_id ? Number(nuevaMateria.profesor_id) : null }]);
        setNuevaMateria({ nombre: "", profesor_id: "" });
        setMostrarForm(false);
      }
    } catch { toast.warning("Error al conectar con el servidor"); }
    finally { setCreando(false); }
  };

  const asignarProfesor = async (materiaId: number) => {
    const profesorId = seleccion[materiaId];
    if (!profesorId) return;
    setAsignando(materiaId);
    try {
      const res = await fetch(`${ACADEMIC_API}/admin/materias/${materiaId}/profesor`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ profesor_id: Number(profesorId) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.warning(data.message || "No se pudo asignar");
      } else {
        toast.success("Profesor asignado!");
        setMaterias(prev => prev.map(m => m.id === materiaId ? { ...m, profesor_id: Number(profesorId) } : m));
      }
    } catch { toast.warning("Error al conectar con el servidor"); }
    finally { setAsignando(null); }
  };

  const desasignarProfesor = async (materiaId: number) => {
    if (!confirm("¿Desasignar el profesor de esta materia?")) return;
    setDesasignando(materiaId);
    try {
      const res = await fetch(`${ACADEMIC_API}/admin/materias/${materiaId}/desasignar`, {
        method: "PUT",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.warning(data.message || "No se pudo desasignar");
      } else {
        toast.success("Profesor desasignado!");
        setMaterias(prev => prev.map(m => m.id === materiaId ? { ...m, profesor_id: null } : m));
      }
    } catch { toast.warning("Error al conectar con el servidor"); }
    finally { setDesasignando(null); }
  };

  const eliminarMateria = async (materiaId: number, nombre: string) => {
    if (!confirm(`¿Eliminár "${nombre}"? También se borran todas sus inscripciones.`)) return;
    setEliminando(materiaId);
    try {
      const res = await fetch(`${ACADEMIC_API}/admin/materias/${materiaId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        toast.success("Materia eliminada");
        setMaterias(prev => prev.filter(m => m.id !== materiaId));
      } else {
        const data = await res.json();
        toast.warning(data.message || "No se pudo eliminar");
      }
    } catch { toast.warning("Error al conectar con el servidor"); }
    finally { setEliminando(null); }
  };

  const nombreProfesor = (id: number | null) => {
    if (!id) return null;
    return usuarios.find(u => u.id === id)?.nombre ?? `ID: ${id}`;
  };

  const visibles = materias.filter(m =>
    (!carrera || m.carrera_id === carrera) &&
    (!soloSinProfe || !m.profesor_id) &&
    (!busqueda.trim() || m.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()))
  );
  const grupos = new Map<string, { titulo: string; items: Materia[] }>();
  [...visibles]
    .sort((a, b) => (a.carrera_id ?? 99) - (b.carrera_id ?? 99) || (a.anio ?? 9) - (b.anio ?? 9) || (a.cuatrimestre ?? 9) - (b.cuatrimestre ?? 9) || a.id - b.id)
    .forEach(m => {
      const clave = `${m.carrera_id ?? 0}-${m.anio ?? 0}`;
      if (!grupos.has(clave)) {
        const partes = [carrera ? "" : nombreCarrera(m.carrera_id), m.anio ? `${m.anio}° año` : "Sin año"].filter(Boolean);
        grupos.set(clave, { titulo: partes.join(" · "), items: [] });
      }
      grupos.get(clave)!.items.push(m);
    });
  const sinProfe = materias.filter(m => !m.profesor_id).length;

  return (
    <div className={styles.pagina}>
      <h1 className={styles.titulo}>Materias</h1>
      <p className={styles.sub}>{materias.length} materias en total, {sinProfe} sin profesor asignado</p>

      <div className={styles.barra}>
        <div className={styles.tabs} role="tablist" aria-label="Carrera">
          {[{ id: 0, n: "Todas" }, { id: 1, n: nombreCarrera(1) }, { id: 2, n: nombreCarrera(2) }].map(t => (
            <button key={t.id} type="button" role="tab" aria-selected={carrera === t.id}
              className={`${styles.tab} ${carrera === t.id ? styles.tabOn : ""}`} onClick={() => setCarrera(t.id)}>{t.n}</button>
          ))}
        </div>
        <button type="button" aria-pressed={soloSinProfe} className={`${styles.chipFiltro} ${soloSinProfe ? styles.chipFiltroOn : ""}`} onClick={() => setSoloSinProfe(v => !v)}>
          Sin profesor ({sinProfe})
        </button>
        <input className={styles.buscar} type="search" placeholder="Buscar materia" aria-label="Buscar materia" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <span className={styles.espacio} />
        <button type="button" className={styles.btnNueva} onClick={() => setMostrarForm(v => !v)}>{mostrarForm ? "Cancelar" : "Nueva materia"}</button>
      </div>

      {mostrarForm && (
        <form onSubmit={crearMateria} className={styles.form}>
          <div>
            <label className={styles.etiqueta} htmlFor="nm-nombre">Nombre</label>
            <input id="nm-nombre" type="text" required className={`${styles.campo} ${styles.campoAncho}`} value={nuevaMateria.nombre}
              onChange={e => setNuevaMateria(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Matemática II" />
          </div>
          <div>
            <label className={styles.etiqueta} htmlFor="nm-prof">Profesor (opcional)</label>
            <select id="nm-prof" className={styles.campo} value={nuevaMateria.profesor_id} onChange={e => setNuevaMateria(p => ({ ...p, profesor_id: e.target.value }))}>
              <option value="">Sin asignar</option>
              {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <button type="submit" disabled={creando} className={styles.btnOk}>{creando ? "Creando..." : "Crear materia"}</button>
        </form>
      )}

      {loading ? (
        <div className={styles.vacio}>Cargando materias...</div>
      ) : grupos.size === 0 ? (
        <div className={styles.vacio}>No hay materias que coincidan con el filtro.</div>
      ) : [...grupos.entries()].map(([clave, g]) => (
        <section key={clave} className={styles.grupo}>
          <div className={styles.grupoTitulo}>{g.titulo}<span className={styles.grupoCant}>{g.items.length} materias</span></div>
          {g.items.map(m => {
            const profe = nombreProfesor(m.profesor_id);
            const horario = m.dia ? `${m.dia} ${hhmm(m.hora_inicio ?? null)} a ${hhmm(m.hora_fin ?? null)}` : "Sin horario";
            return (
              <div key={m.id} className={styles.fila}>
                <span className={styles.codigo}>{m.codigo}</span>
                <div>
                  <div className={styles.nombre}>{m.nombre}</div>
                </div>
                <span className={styles.horario}>{m.cuatrimestre ? `${m.cuatrimestre}° cuat. · ` : ""}{horario}</span>
                {profe ? (
                  <span className={styles.profe}>{profe}</span>
                ) : (
                  <div className={styles.asignar}>
                    <select aria-label={`Profesor para ${m.nombre}`} className={styles.campo} value={seleccion[m.id] ?? ""} onChange={e => setSeleccion(p => ({ ...p, [m.id]: e.target.value }))}>
                      <option value="">Sin profesor</option>
                      {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    <button type="button" className={`${styles.btnChico} ${styles.btnAzul}`} onClick={() => asignarProfesor(m.id)} disabled={!seleccion[m.id] || asignando === m.id}>
                      {asignando === m.id ? "..." : "Asignar"}
                    </button>
                  </div>
                )}
                <div className={styles.acciones}>
                  {profe && <button type="button" className={styles.btnChico} onClick={() => desasignarProfesor(m.id)} disabled={desasignando === m.id}>{desasignando === m.id ? "..." : "Quitar profesor"}</button>}
                  <button type="button" className={`${styles.btnChico} ${styles.btnPeligro}`} onClick={() => eliminarMateria(m.id, m.nombre)} disabled={eliminando === m.id}>{eliminando === m.id ? "..." : "Eliminar"}</button>
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
