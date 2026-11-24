"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppStore } from "@/src/store";
import { authHeaders, ACADEMIC_API } from "@/src/lib/api";
import { nombreCarrera, hhmm } from "@/src/lib/plan";
import "../inscripciones/inscripciones.css";

type Materia = { id: number; nombre: string; carrera_id?: number | null };
type Mesa = { id: number; fecha: string; hora: string | null; materia_id: number };
type Inscripto = { id: number; user_id: number; nombre: string | null; nota: number | null; ausente: number };

const fechaLarga = (f: string) =>
  new Date(f).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const yaPaso = (f: string) => f.slice(0, 10) < new Date().toISOString().slice(0, 10);

export default function PageFinales() {
  const { user } = useAppStore();
  const router = useRouter();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [inscriptos, setInscriptos] = useState<Record<number, Inscripto[]>>({});
  const [notas, setNotas] = useState<Record<number, string>>({});
  const [guardando, setGuardando] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    if (user.rol !== "profesor") { router.push("/dashboard"); return; }

    const cargar = async () => {
      try {
        const [mRes, fRes] = await Promise.all([
          fetch(`${ACADEMIC_API}/profesores/${user.id}/materias`, { headers: authHeaders() }).then(r => r.json()),
          fetch(`${ACADEMIC_API}/finales/mesas?todas=1`, { headers: authHeaders() }).then(r => r.json()),
        ]);
        const propias: Materia[] = Array.isArray(mRes) ? mRes : [];
        const ids = new Set(propias.map(m => m.id));
        const delProfe: Mesa[] = (Array.isArray(fRes) ? fRes : []).filter((x: Mesa) => ids.has(x.materia_id));
        setMaterias(propias);
        setMesas(delProfe);

        const filas = await Promise.all(
          delProfe.map(x =>
            fetch(`${ACADEMIC_API}/finales/mesas/${x.id}/inscriptos`, { headers: authHeaders() })
              .then(r => r.json())
              .then(d => [x.id, Array.isArray(d) ? d : []] as [number, Inscripto[]])
              .catch(() => [x.id, []] as [number, Inscripto[]])
          )
        );
        setInscriptos(Object.fromEntries(filas));
      } catch {
        toast.warning("No se pudieron cargar las mesas");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [user?.id]);

  const mesasDe = (materiaId: number) =>
    mesas.filter(x => x.materia_id === materiaId).sort((a, b) => a.fecha.localeCompare(b.fecha));

  const actualizar = (mesaId: number, id: number, cambios: Partial<Inscripto>) =>
    setInscriptos(prev => ({
      ...prev,
      [mesaId]: (prev[mesaId] ?? []).map(x => (x.id === id ? { ...x, ...cambios } : x)),
    }));

  const enviar = async (i: Inscripto, mesaId: number, cuerpo: object, okMensaje: string, cambios: Partial<Inscripto>) => {
    setGuardando(i.id);
    try {
      const res = await fetch(`${ACADEMIC_API}/finales/inscripciones/${i.id}/nota`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(cuerpo),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.warning(data.message || "No se pudo guardar");
        return;
      }
      actualizar(mesaId, i.id, cambios);
      toast.success(okMensaje);
    } catch {
      toast.warning("Error al conectar con el servidor");
    } finally {
      setGuardando(null);
    }
  };

  const guardarNota = (i: Inscripto, mesaId: number) => {
    const nota = Number(notas[i.id]);
    if (!notas[i.id] || !Number.isFinite(nota) || nota < 1 || nota > 10) {
      toast.warning("Ingresá una nota entre 1 y 10");
      return;
    }
    enviar(i, mesaId, { nota }, "Nota guardada", { nota, ausente: 0 });
  };

  const marcarAusente = (i: Inscripto, mesaId: number) => {
    if (!window.confirm(`¿Marcar como ausente a ${i.nombre ?? "este alumno"}?`)) return;
    enviar(i, mesaId, { ausente: true }, "Ausencia registrada", { nota: null, ausente: 1 });
  };

  return (
    <div className="inscripciones-container">
      <div className="inscripciones-header">
        <h1 className="inscripciones-title">Mesas de final</h1>
        <p className="inscripciones-subtitle">
          Acá ves las mesas de tus materias y los alumnos anotados. Cargá la nota de cada uno o marcá si estuvo ausente.
        </p>
      </div>

      <div className="inscripciones-card">
        <div className="inscripciones-card-header">
          <h2 className="inscripciones-card-title">Mis materias</h2>
        </div>
        {loading ? (
          <div className="inscripciones-loading">Cargando...</div>
        ) : materias.length === 0 ? (
          <div className="inscripciones-empty">Todavía no tenés materias asignadas</div>
        ) : (
          materias.map(m => (
            <div key={m.id}>
              <div className="materia-row">
                <div className="materia-info">
                  <div className="materia-nombre">{m.nombre}</div>
                  {m.carrera_id ? <div className="materia-profesor">{nombreCarrera(m.carrera_id)}</div> : null}
                </div>
              </div>
              <div className="materia-expanded">
                {mesasDe(m.id).length === 0 ? (
                  <div className="alumnos-empty">Esta materia no tiene mesas de final cargadas.</div>
                ) : (
                  mesasDe(m.id).map(mesa => {
                    const lista = inscriptos[mesa.id] ?? [];
                    return (
                      <div key={mesa.id} className="mesa-bloque">
                        <div className="mesa-cabecera">
                          <span className="mesa-fecha">
                            Final del {fechaLarga(mesa.fecha)}{mesa.hora ? `, ${hhmm(mesa.hora)} hs` : ""}
                          </span>
                          <span className="mesa-estado">
                            {yaPaso(mesa.fecha) ? "Ya se rindió" : "Próxima"} · {lista.length} {lista.length === 1 ? "anotado" : "anotados"}
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
                                style={{
                                  color: i.ausente === 1 ? "#dc2626" : i.nota === null ? "#9ca3af" : Number(i.nota) >= 4 ? "#16a34a" : "#dc2626",
                                }}
                              >
                                {i.ausente === 1 ? "Ausente" : i.nota === null ? "Sin nota" : `Nota ${Number(i.nota).toFixed(1)}`}
                              </span>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                step="0.5"
                                placeholder="Nota"
                                value={notas[i.id] ?? (i.nota !== null ? String(i.nota) : "")}
                                onChange={e => setNotas(prev => ({ ...prev, [i.id]: e.target.value }))}
                                style={{ width: "65px", padding: "6px" }}
                              />
                              <button type="button" disabled={guardando === i.id} onClick={() => guardarNota(i, mesa.id)}>
                                {guardando === i.id ? "Guardando..." : "Guardar nota"}
                              </button>
                              <button type="button" disabled={guardando === i.id || i.ausente === 1} onClick={() => marcarAusente(i, mesa.id)}>
                                Marcar ausente
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
