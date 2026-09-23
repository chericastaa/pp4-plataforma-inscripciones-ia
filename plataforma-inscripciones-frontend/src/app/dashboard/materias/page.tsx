"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/src/store";
import { useRouter } from "next/navigation";
import { authHeaders, USERS_API, ACADEMIC_API } from "@/src/lib/api";

type Usuario = { id: number; nombre: string; rol?: string };
type Materia = { id: number; nombre: string; profesor_id: number | null };

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

  return (
    <div style={{ padding: "1.5rem", fontFamily: "Poppins, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>Materias</h1>
        <p style={{ fontSize: "13px", color: "#6b7280" }}>Gestioná las materias y asigná profesores</p>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => setMostrarForm(v => !v)}
          style={{ fontSize: "13px", background: "#185FA5", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer" }}
        >
          {mostrarForm ? "Cancelar" : "+ Nueva materia"}
        </button>

        {mostrarForm && (
          <form onSubmit={crearMateria} style={{ marginTop: "12px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.25rem", display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>Nombre</label>
              <input
                type="text"
                required
                value={nuevaMateria.nombre}
                onChange={e => setNuevaMateria(p => ({ ...p, nombre: e.target.value }))}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px", outline: "none", width: "220px" }}
                placeholder="Ej: Matemáticas II"
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>Profesor (opcional)</label>
              <select
                aria-label="Profesor"
                value={nuevaMateria.profesor_id}
                onChange={e => setNuevaMateria(p => ({ ...p, profesor_id: e.target.value }))}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px", outline: "none", width: "180px", background: "#fff" }}
              >
                <option value="">Sin asignar</option>
                {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={creando}
              style={{ padding: "8px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer", opacity: creando ? 0.6 : 1 }}
            >
              {creando ? "Creando..." : "Crear"}
            </button>
          </form>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>Lista de materias</h2>
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>{materias.length} en total</span>
        </div>
        {loading ? (
          <div style={{ padding: "1rem", fontSize: "13px", color: "#6b7280" }}>Cargando...</div>
        ) : materias.length === 0 ? (
          <div style={{ padding: "1rem", fontSize: "13px", color: "#9ca3af" }}>No hay materias cargadas todavía</div>
        ) : materias.map(m => {
          const profe = nombreProfesor(m.profesor_id);
          return (
            <div key={m.id} style={{ padding: "12px 1.25rem", borderBottom: "1px solid #f9fafb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>{m.nombre}</div>
                {profe && <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>Profesor: {profe}</div>}
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {!profe ? (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <select
                      aria-label="Asignar profesor"
                      value={seleccion[m.id] ?? ""}
                      onChange={e => setSeleccion(p => ({ ...p, [m.id]: e.target.value }))}
                      style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", outline: "none" }}
                    >
                      <option value="">Asignar profesor</option>
                      {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => asignarProfesor(m.id)}
                      disabled={!seleccion[m.id] || asignando === m.id}
                      style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", background: "#185FA5", color: "#fff", border: "none", cursor: "pointer", opacity: (!seleccion[m.id] || asignando === m.id) ? 0.5 : 1 }}
                    >
                      {asignando === m.id ? "..." : "Asignar"}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: "99px", whiteSpace: "nowrap" }}>Asignado</span>
                    <button
                      type="button"
                      onClick={() => desasignarProfesor(m.id)}
                      disabled={desasignando === m.id}
                      style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "6px", background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a", cursor: "pointer", opacity: desasignando === m.id ? 0.5 : 1 }}
                    >
                      {desasignando === m.id ? "..." : "Desasignar"}
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => eliminarMateria(m.id, m.nombre)}
                  disabled={eliminando === m.id}
                  style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "6px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", cursor: "pointer", opacity: eliminando === m.id ? 0.5 : 1 }}
                >
                  {eliminando === m.id ? "..." : "Eliminar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}