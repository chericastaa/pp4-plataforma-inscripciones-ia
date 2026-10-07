"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/src/store";
import { authHeaders, ACADEMIC_API } from "@/src/lib/api";
import base from "../dashboard.module.css";
import styles from "./plan.module.css";

type Resultado = { permitido: boolean; motivos: string[] };
type MateriaPlan = {
  id: number;
  codigo: string;
  nombre: string;
  anio: number;
  cuatrimestre: number;
  estado: "aprobada" | "regular" | "cursando" | "libre" | "no_cursada";
  nota: number | null;
  via: "final" | "promocion" | null;
  correlativas: { id: number; nombre: string; estado: string }[];
  cursar: Resultado;
  rendir: Resultado;
};
type Mesa = {
  id: number;
  fecha: string;
  hora: string | null;
  materia_id: number;
  materia: string;
  inscripcion_id: number | null;
  rendir: Resultado;
};

const etiquetas: Record<MateriaPlan["estado"], string> = {
  aprobada: "Aprobada",
  regular: "Regular",
  cursando: "Cursando",
  libre: "Libre",
  no_cursada: "Sin cursar",
};

const ordinal = (n: number) => `${n}°`;

const formatearFecha = (f: string) =>
  new Date(f).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export default function PlanDeEstudios() {
  const { user } = useAppStore();
  const [materias, setMaterias] = useState<MateriaPlan[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<number | null>(null);

  const cargar = async () => {
    const [planRes, mesasRes] = await Promise.allSettled([
      fetch(`${ACADEMIC_API}/motor/plan`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${ACADEMIC_API}/finales/mesas`, { headers: authHeaders() }).then((r) => r.json()),
    ]);
    if (planRes.status === "fulfilled" && Array.isArray(planRes.value?.materias)) setMaterias(planRes.value.materias);
    if (mesasRes.status === "fulfilled" && Array.isArray(mesasRes.value)) setMesas(mesasRes.value);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.id) cargar();
  }, [user?.id]);

  const accion = async (clave: string, url: string, opciones: RequestInit, exito: string) => {
    setProcesando(clave);
    try {
      const res = await fetch(url, { headers: authHeaders(), ...opciones });
      const data = await res.json();
      if (!res.ok) toast.warning(data.message || "No se pudo completar");
      else {
        toast.success(exito);
        await cargar();
      }
    } catch {
      toast.warning("Error al conectar con el servidor");
    } finally {
      setProcesando(null);
    }
  };

  const inscribirCursada = (m: MateriaPlan) =>
    accion(`c${m.id}`, `${ACADEMIC_API}/inscripciones`, {
      method: "POST",
      body: JSON.stringify({ user_id: user?.id, materia_id: m.id }),
    }, `Te inscribiste a ${m.nombre}`);

  const anotarFinal = (mesa: Mesa) =>
    accion(`f${mesa.id}`, `${ACADEMIC_API}/finales/inscripciones`, {
      method: "POST",
      body: JSON.stringify({ mesa_id: mesa.id }),
    }, `Te anotaste al final de ${mesa.materia}`);

  const bajaFinal = (mesa: Mesa) =>
    accion(`f${mesa.id}`, `${ACADEMIC_API}/finales/inscripciones/${mesa.inscripcion_id}`, { method: "DELETE" }, "Te diste de baja del final");

  const grupos = materias.reduce<Record<string, MateriaPlan[]>>((acc, m) => {
    const clave = `${ordinal(m.anio)} año · ${ordinal(m.cuatrimestre)} cuatrimestre`;
    (acc[clave] ||= []).push(m);
    return acc;
  }, {});

  const aprobadas = materias.filter((m) => m.estado === "aprobada").length;
  const mesasVisibles = mesas.filter((m) => m.inscripcion_id || m.rendir.permitido);

  return (
    <div className={base.container}>
      <div className={base.mb1}>
        <h1 className={base.headerTitle}>Plan de estudios</h1>
        <p className={base.headerSubtitle}>
          Tecnicatura Superior en Desarrollo de Software · {aprobadas} de {materias.length} materias aprobadas
        </p>
      </div>

      <div className={base.tableCard}>
        <div className={base.cardHeader}>
          <h2 className={base.cardTitle}>Mesas de final disponibles</h2>
        </div>
        {loading ? (
          <div className={base.loadingRow}>Cargando...</div>
        ) : mesasVisibles.length === 0 ? (
          <div className={base.noData}>No tenés finales para rendir por ahora</div>
        ) : (
          mesasVisibles.map((mesa) => (
            <div key={mesa.id} className={base.tableRowFlex}>
              <div>
                <div className={base.itemTitle}>{mesa.materia}</div>
                <div className={base.muted}>
                  {formatearFecha(mesa.fecha)}
                  {mesa.hora ? ` · ${mesa.hora.slice(0, 5)} hs` : ""}
                </div>
              </div>
              {mesa.inscripcion_id ? (
                <div className={styles.acciones}>
                  <span className={base.pillSuccess}>Anotado</span>
                  <button className={base.btnUnenroll} disabled={procesando === `f${mesa.id}`} onClick={() => bajaFinal(mesa)}>
                    Darme de baja
                  </button>
                </div>
              ) : (
                <button className={base.btnEnroll} disabled={procesando === `f${mesa.id}`} onClick={() => anotarFinal(mesa)}>
                  {procesando === `f${mesa.id}` ? "..." : "Anotarme"}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {Object.entries(grupos).map(([titulo, lista]) => (
        <div key={titulo} className={`${base.tableCard} ${styles.bloque}`}>
          <div className={base.cardHeader}>
            <h2 className={base.cardTitle}>{titulo}</h2>
          </div>
          {lista.map((m) => {
            const bloqueada = !m.cursar.permitido && (m.estado === "no_cursada" || m.estado === "libre");
            return (
              <div key={m.id} className={styles.fila}>
                <div className={styles.filaPrincipal}>
                  <div className={styles.info} onClick={() => setAbierta(abierta === m.id ? null : m.id)}>
                    <div className={base.itemTitle}>
                      <span className={styles.codigo}>{m.codigo}</span> {m.nombre}
                    </div>
                    {m.correlativas.length > 0 && (
                      <div className={base.muted}>Correlativas: {m.correlativas.map((c) => c.nombre).join(", ")}</div>
                    )}
                  </div>
                  <div className={styles.acciones}>
                    {m.nota !== null && <span className={styles.nota}>{Number(m.nota).toFixed(1)}</span>}
                    <span className={`${styles.estado} ${styles[m.estado]}`}>
                      {etiquetas[m.estado]}
                      {m.via === "promocion" ? " (promoción)" : ""}
                    </span>
                    {m.cursar.permitido && (
                      <button className={base.btnEnroll} disabled={procesando === `c${m.id}`} onClick={() => inscribirCursada(m)}>
                        {procesando === `c${m.id}` ? "..." : m.estado === "libre" ? "Recursar" : "Cursar"}
                      </button>
                    )}
                    {bloqueada && (
                      <button className={styles.btnBloqueada} onClick={() => setAbierta(abierta === m.id ? null : m.id)}>
                        ¿Por qué no puedo?
                      </button>
                    )}
                  </div>
                </div>
                {abierta === m.id && (bloqueada || m.estado === "regular") && (
                  <ul className={styles.motivos}>
                    {(bloqueada ? m.cursar.motivos : m.rendir.motivos).map((motivo) => (
                      <li key={motivo}>{motivo}</li>
                    ))}
                    {!bloqueada && m.rendir.permitido && <li>Ya podés anotarte al final de esta materia</li>}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
