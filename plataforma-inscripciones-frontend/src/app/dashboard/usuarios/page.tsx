"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "@/src/store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authHeaders, USERS_API, ACADEMIC_API } from "@/src/lib/api";

type Usuario = { id: number; nombre: string; email?: string; rol?: string };

const colores: Record<string, string> = {
  admin: "#7c3aed",
  profesor: "#185FA5",
  alumno: "#16a34a",
};

export default function PageUsuarios() {
  const { user } = useAppStore();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<string>("todos");

  useEffect(() => {
    if (user?.rol !== "admin") { router.push("/dashboard"); return; }
    fetch(`${USERS_API}/usuarios`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setUsuarios(data); })
      .finally(() => setLoading(false));
  }, []);

  const porRol = (rol: string) => usuarios.filter(u => u.rol === rol).length;

  const usuariosFiltrados = usuarios
    .filter(u => filtro === "todos" || u.rol === filtro)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

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
          const materiasAsignadas = data.filter((m: { profesor_id: number }) => m.profesor_id === id);
          if (materiasAsignadas.length > 0) {
            toast.warning(`No se puede eliminar: ${nombre} tiene ${materiasAsignadas.length} materia${materiasAsignadas.length !== 1 ? "s" : ""} asignada${materiasAsignadas.length !== 1 ? "s" : ""}`);
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
    <div style={{ padding: "1.5rem", fontFamily: "Poppins, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>Usuarios</h1>
        <p style={{ fontSize: "13px", color: "#6b7280" }}>Todos los usuarios registrados en la plataforma</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div
          onClick={() => setFiltro("todos")}
          style={{ background: filtro === "todos" ? "#111827" : "#fff", borderRadius: "12px", padding: "1.25rem", border: filtro === "todos" ? "2px solid #111827" : "1px solid #e5e7eb", cursor: "pointer" }}
        >
          <div style={{ fontSize: "28px", fontWeight: 600, color: filtro === "todos" ? "#fff" : "#111827" }}>{loading ? "-" : usuarios.length}</div>
          <div style={{ fontSize: "12px", color: filtro === "todos" ? "#d1d5db" : "#6b7280", marginTop: "4px" }}>Todos</div>
        </div>
        {["admin", "profesor", "alumno"].map(rol => (
          <div
            key={rol}
            onClick={() => setFiltro(rol)}
            style={{ background: filtro === rol ? colores[rol] : "#fff", borderRadius: "12px", padding: "1.25rem", border: filtro === rol ? `2px solid ${colores[rol]}` : "1px solid #e5e7eb", cursor: "pointer" }}
          >
            <div style={{ fontSize: "28px", fontWeight: 600, color: filtro === rol ? "#fff" : "#111827" }}>{loading ? "-" : porRol(rol)}</div>
            <div style={{ fontSize: "12px", color: filtro === rol ? "#e0f2fe" : "#6b7280", marginTop: "4px", textTransform: "capitalize" }}>{rol}s</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
            {filtro === "todos" ? "Lista de usuarios" : `${filtro.charAt(0).toUpperCase() + filtro.slice(1)}s`}
            <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 400, marginLeft: "8px" }}>({usuariosFiltrados.length})</span>
          </h2>
        </div>
        {loading ? (
          <div style={{ padding: "1rem", fontSize: "13px", color: "#6b7280" }}>Cargando...</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div style={{ padding: "1rem", fontSize: "13px", color: "#9ca3af" }}>No hay usuarios en esta categoría</div>
        ) : usuariosFiltrados.map(u => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 1.25rem", borderBottom: "1px solid #f9fafb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: colores[u.rol ?? "alumno"] ?? "#185FA5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "13px", fontWeight: 600, flexShrink: 0 }}>
                {u.nombre ? u.nombre.charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>{u.nombre || "Sin nombre"}</div>
                {u.email && <div style={{ fontSize: "11px", color: "#9ca3af" }}>{u.email}</div>}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: `${colores[u.rol ?? "alumno"]}18`, color: colores[u.rol ?? "alumno"] ?? "#6b7280", fontWeight: 500, textTransform: "capitalize" }}>
                {u.rol || "alumno"}
              </span>
              {u.rol !== "admin" && (
                <button
                  type="button"
                  onClick={() => eliminarUsuario(u.id, u.nombre, u.rol ?? "alumno")}
                  disabled={eliminando === u.id}
                  style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "6px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", cursor: "pointer", opacity: eliminando === u.id ? 0.5 : 1 }}
                >
                  {eliminando === u.id ? "..." : "Eliminar"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}