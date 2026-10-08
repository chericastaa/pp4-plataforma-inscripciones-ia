"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "@/src/store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authHeaders, USERS_API, ACADEMIC_API } from "@/src/lib/api";
import { CARRERAS, nombreCarrera } from "@/src/lib/plan";
import styles from "./usuarios.module.css";

type Usuario = { id: number; nombre: string; email?: string; rol?: string; carrera_id?: number | null };

const ROLES = [
  { id: "todos", n: "Todos" },
  { id: "alumno", n: "Alumnos" },
  { id: "profesor", n: "Profesores" },
  { id: "admin", n: "Admins" },
];
const claseAvatar: Record<string, string> = { admin: styles.avAdmin, profesor: styles.avProfesor, alumno: styles.avAlumno };
const claseRol: Record<string, string> = { admin: styles.rolAdmin, profesor: styles.rolProfesor, alumno: styles.rolAlumno };
const nombreRol: Record<string, string> = { admin: "Admin", profesor: "Profesor", alumno: "Alumno" };

export default function PageUsuarios() {
  const { user } = useAppStore();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState({ nombre: "", email: "", password: "", carrera_id: "" });
  const [carreraBloqueada, setCarreraBloqueada] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (user?.rol !== "admin") { router.push("/dashboard"); return; }
    fetch(`${USERS_API}/usuarios`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setUsuarios(data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!editando) return;
    const cerrar = (e: KeyboardEvent) => { if (e.key === "Escape") setEditando(null); };
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [editando]);

  const cuenta = (rol: string) => rol === "todos" ? usuarios.length : usuarios.filter(u => u.rol === rol).length;

  const visibles = usuarios
    .filter(u => filtro === "todos" || u.rol === filtro)
    .filter(u => !busqueda.trim() || `${u.nombre} ${u.email ?? ""}`.toLowerCase().includes(busqueda.trim().toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const abrirEdicion = async (u: Usuario) => {
    setEditando(u);
    setForm({ nombre: u.nombre ?? "", email: u.email ?? "", password: "", carrera_id: u.carrera_id ? String(u.carrera_id) : "" });
    setCarreraBloqueada(false);
    if (u.rol === "alumno") {
      try {
        const res = await fetch(`${ACADEMIC_API}/inscripciones/usuarios/${u.id}/materias`, { headers: authHeaders() });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setCarreraBloqueada(true);
      } catch { /* se deja editable */ }
    }
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    setGuardando(true);
    try {
      const cuerpo: Record<string, unknown> = { nombre: form.nombre, email: form.email };
      if (form.password) cuerpo.password = form.password;
      if (editando.rol === "alumno" && !carreraBloqueada) cuerpo.carrera_id = form.carrera_id ? Number(form.carrera_id) : null;
      const res = await fetch(`${USERS_API}/usuarios/${editando.id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(cuerpo) });
      const data = await res.json();
      if (!res.ok) { toast.warning(data.message || "No se pudo guardar"); return; }
      setUsuarios(prev => prev.map(u => u.id === data.id ? { ...u, ...data } : u));
      toast.success("Cambios guardados");
      setEditando(null);
    } catch { toast.warning("Error al conectar con el servidor"); }
    finally { setGuardando(false); }
  };

  const eliminarUsuario = async (id: number, nombre: string, rol: string) => {
    if (id === user?.id) { toast.warning("No podés eliminarte a vos mismo"); return; }

    if (rol === "alumno") {
      try {
        const res = await fetch(`${ACADEMIC_API}/inscripciones/usuarios/${id}/materias`, { headers: authHeaders() });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          toast.warning(`No se puede eliminar: ${nombre} tiene ${data.length} materia${data.length !== 1 ? "s" : ""} inscripta${data.length !== 1 ? "s" : ""}`);
          return;
        }
      } catch {
        toast.warning("Error al verificar inscripciones");
        return;
      }
    }

    if (rol === "profesor") {
      try {
        const res = await fetch(`${ACADEMIC_API}/materias`, { headers: authHeaders() });
        const data = await res.json();
        if (Array.isArray(data)) {
          const asignadas = data.filter((m: { profesor_id: number }) => m.profesor_id === id);
          if (asignadas.length > 0) {
            toast.warning(`No se puede eliminar: ${nombre} tiene ${asignadas.length} materia${asignadas.length !== 1 ? "s" : ""} asignada${asignadas.length !== 1 ? "s" : ""}`);
            return;
          }
        }
      } catch {
        toast.warning("Error al verificar materias");
        return;
      }
    }

    if (!confirm(`¿Eliminar a "${nombre}"?`)) return;
    setEliminando(id);
    try {
      const res = await fetch(`${USERS_API}/usuarios/${id}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) {
        toast.success("Usuario eliminado");
        setUsuarios(prev => prev.filter(u => u.id !== id));
      } else {
        const data = await res.json();
        toast.warning(data.message || "No se pudo eliminar");
      }
    } catch { toast.warning("Error al conectar con el servidor"); }
    finally { setEliminando(null); }
  };

  return (
    <div className={styles.pagina}>
      <h1 className={styles.titulo}>Usuarios</h1>
      <p className={styles.sub}>Editá los datos de alumnos y profesores, o restablecé una contraseña.</p>

      <div className={styles.barra}>
        <div className={styles.tabs} role="tablist" aria-label="Tipo de usuario">
          {ROLES.map(r => (
            <button key={r.id} type="button" role="tab" aria-selected={filtro === r.id}
              className={`${styles.tab} ${filtro === r.id ? styles.tabOn : ""}`} onClick={() => setFiltro(r.id)}>
              {r.n} ({loading ? "-" : cuenta(r.id)})
            </button>
          ))}
        </div>
        <input className={styles.buscar} type="search" placeholder="Buscar por nombre o email" aria-label="Buscar usuario" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      <div className={styles.lista}>
        {loading ? <div className={styles.vacio}>Cargando usuarios...</div>
          : visibles.length === 0 ? <div className={styles.vacio}>No hay usuarios que coincidan.</div>
          : visibles.map(u => {
            const rol = u.rol ?? "alumno";
            return (
              <div key={u.id} className={styles.fila}>
                <div className={`${styles.avatar} ${claseAvatar[rol]}`}>{u.nombre ? u.nombre.charAt(0).toUpperCase() : "?"}</div>
                <div className={styles.datos}>
                  <div className={styles.nombre}>{u.nombre || "Sin nombre"}</div>
                  {u.email && <div className={styles.mail}>{u.email}</div>}
                </div>
                {rol === "alumno" && u.carrera_id ? <span className={`${styles.chip} ${styles.carreraChip}`}>{nombreCarrera(u.carrera_id)}</span> : null}
                <span className={`${styles.chip} ${claseRol[rol]}`}>{nombreRol[rol] ?? rol}</span>
                <div className={styles.acciones}>
                  <button type="button" className={styles.btn} onClick={() => abrirEdicion(u)}>Editar</button>
                  {rol !== "admin" && (
                    <button type="button" className={`${styles.btn} ${styles.btnPeligro}`} onClick={() => eliminarUsuario(u.id, u.nombre, rol)} disabled={eliminando === u.id}>
                      {eliminando === u.id ? "..." : "Eliminar"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {editando && (
        <div className={styles.fondo} onMouseDown={e => { if (e.target === e.currentTarget) setEditando(null); }}>
          <form className={styles.modal} onSubmit={guardar} role="dialog" aria-modal="true" aria-labelledby="ed-titulo">
            <h2 id="ed-titulo" className={styles.modalTitulo}>Editar usuario</h2>
            <p className={styles.modalSub}>{nombreRol[editando.rol ?? "alumno"]}</p>
            <div className={styles.grupo}>
              <label className={styles.etiqueta} htmlFor="ed-nombre">Nombre</label>
              <input id="ed-nombre" className={styles.campo} required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className={styles.grupo}>
              <label className={styles.etiqueta} htmlFor="ed-email">Email</label>
              <input id="ed-email" type="email" className={styles.campo} required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            {editando.rol === "alumno" && (
              <div className={styles.grupo}>
                <label className={styles.etiqueta} htmlFor="ed-carrera">Carrera</label>
                <select id="ed-carrera" className={styles.campo} value={form.carrera_id} disabled={carreraBloqueada} onChange={e => setForm(f => ({ ...f, carrera_id: e.target.value }))}>
                  <option value="">Sin carrera</option>
                  {Object.entries(CARRERAS).map(([id, n]) => <option key={id} value={id}>{n}</option>)}
                </select>
                {carreraBloqueada && <p className={styles.ayuda}>No se puede cambiar mientras tenga materias inscriptas.</p>}
              </div>
            )}
            <div className={styles.grupo}>
              <label className={styles.etiqueta} htmlFor="ed-pass">Nueva contraseña</label>
              <input id="ed-pass" type="password" autoComplete="new-password" className={styles.campo} minLength={6} placeholder="Dejala vacía para no cambiarla" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div className={styles.pie}>
              <button type="button" className={styles.btn} onClick={() => setEditando(null)}>Cancelar</button>
              <button type="submit" className={styles.btnGuardar} disabled={guardando}>{guardando ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
