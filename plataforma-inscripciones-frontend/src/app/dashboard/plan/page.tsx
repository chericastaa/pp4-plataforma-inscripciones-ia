"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/src/store";
import { authHeaders, ACADEMIC_API } from "@/src/lib/api";
import {
  ETIQUETAS,
  MateriaPlan,
  Mesa,
  cargarPlan,
  formatearFecha,
  hhmm,
  nota1,
} from "@/src/lib/plan";
import styles from "./plan.module.css";

const horario = (m: MateriaPlan) =>
  m.dia && m.hora_inicio && m.hora_fin ? `${m.dia} de ${hhmm(m.hora_inicio)} a ${hhmm(m.hora_fin)}` : "Sin horario cargado";

export default function PlanDeEstudios() {
  const { user } = useAppStore();
  const [materias, setMaterias] = useState<MateriaPlan[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [carrera, setCarrera] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);

  const aplicar = (d: Awaited<ReturnType<typeof cargarPlan>>) => {
    setMaterias(d.materias);
    setMesas(d.mesas);
    setCarrera(d.carrera);
    setError(d.error);
    setCargando(false);
  };

  const cargar = () => cargarPlan().then(aplicar);

  useEffect(() => {
    if (!user?.id) return;
    cargarPlan().then((d) => {
      aplicar(d);
      const id = Number(new URLSearchParams(window.location.search).get("materia"));
      if (id) setSeleccionada(id);
    });
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

  const cursar = (m: MateriaPlan) =>
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

  const periodos = useMemo(() => {
    const mapa = new Map<string, MateriaPlan[]>();
    materias.forEach((m) => {
      const clave = `${m.anio}-${m.cuatrimestre}`;
      mapa.set(clave, [...(mapa.get(clave) ?? []), m]);
    });
    return [...mapa.entries()];
  }, [materias]);

  const actual = materias.find((m) => m.id === seleccionada) ?? null;
  const requisitos = new Set(actual?.correlativas.map((c) => c.id) ?? []);
  const habilita = materias.filter((m) => actual && m.correlativas.some((c) => c.id === actual.id));
  const habilitaIds = new Set(habilita.map((m) => m.id));

  const aprobadas = materias.filter((m) => m.estado === "aprobada").length;
  const finalesAbiertos = mesas.filter((x) => x.inscripcion_id || x.rendir.permitido);

  if (cargando) return <div className={styles.pagina}><p className={styles.vacio}>Cargando tu plan...</p></div>;

  if (error) {
    return (
      <div className={styles.pagina}>
        <p className={styles.vacio}>
          No pudimos cargar tu plan de estudios. Recargá la página o cerrá sesión y volvé a entrar.
        </p>
      </div>
    );
  }

  const mesasDe = (m: MateriaPlan) => mesas.filter((x) => x.materia_id === m.id);

  return (
    <div className={styles.pagina}>
      <header>
        <h1 className={styles.titulo}>Plan de estudios</h1>
        <p className={styles.subtitulo}>
          {carrera ? `${carrera}. ` : ""}
          {aprobadas} de {materias.length} materias aprobadas. Tocá una materia para ver sus correlativas y qué podés hacer con ella.
        </p>
      </header>

      {finalesAbiertos.length > 0 && (
        <section className={styles.finales} aria-label="Finales abiertos">
          <h2 className={styles.finalesTitulo}>Finales abiertos</h2>
          <ul className={styles.finalesLista}>
            {finalesAbiertos.slice(0, 6).map((f) => (
              <li key={f.id}>
                <button type="button" className={styles.chip} onClick={() => setSeleccionada(f.materia_id)}>
                  <span className={styles.chipNombre}>{f.materia}</span>
                  <span className={styles.chipDato}>
                    {formatearFecha(f.fecha)}{f.inscripcion_id ? ", anotado" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.cuerpo}>
        <div className={styles.mallaMarco}>
          <div className={styles.malla}>
            {periodos.map(([clave, lista]) => (
              <section key={clave} className={styles.columna} aria-label={`Año ${lista[0].anio}, cuatrimestre ${lista[0].cuatrimestre}`}>
                <h2 className={styles.columnaTitulo}>
                  Año {lista[0].anio}
                  <span className={styles.columnaSub}>Cuatrimestre {lista[0].cuatrimestre}</span>
                </h2>
                {lista.map((m) => {
                  const esRequisito = requisitos.has(m.id);
                  const esHabilitada = habilitaIds.has(m.id);
                  const clases = [
                    styles.materia,
                    styles[`e_${m.estado}`],
                    seleccionada === m.id ? styles.elegida : "",
                    esRequisito ? styles.requisito : "",
                    esHabilitada ? styles.habilitada : "",
                    actual && seleccionada !== m.id && !esRequisito && !esHabilitada ? styles.apagada : "",
                  ].join(" ");
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={clases}
                      onClick={() => setSeleccionada(seleccionada === m.id ? null : m.id)}
                      aria-pressed={seleccionada === m.id}
                    >
                      <span className={styles.codigo}>{m.codigo}</span>
                      <span className={styles.nombre}>{m.nombre}</span>
                      <span className={styles.pie}>
                        <span className={styles.estado}>{ETIQUETAS[m.estado]}</span>
                        {m.nota !== null && <span className={styles.nota}>{nota1(Number(m.nota))}</span>}
                      </span>
                      {esRequisito && <span className={styles.relacion}>Correlativa</span>}
                      {esHabilitada && <span className={styles.relacion}>La necesita</span>}
                    </button>
                  );
                })}
              </section>
            ))}
          </div>
        </div>

        <aside className={`${styles.detalle} ${actual ? styles.detalleAbierto : ""}`} aria-live="polite">
          {!actual ? (
            <p className={styles.detalleVacio}>
              Elegí una materia de la malla. Vas a ver qué materias necesitás para cursarla y cuáles habilita.
            </p>
          ) : (
            <>
              <button type="button" className={styles.cerrar} onClick={() => setSeleccionada(null)} aria-label="Cerrar detalle">
                Cerrar
              </button>
              <div className={styles.detalleCodigo}>{actual.codigo}</div>
              <h2 className={styles.detalleNombre}>{actual.nombre}</h2>
              <p className={styles.detalleDato}>
                Año {actual.anio}, cuatrimestre {actual.cuatrimestre}. {horario(actual)}.
              </p>

              <div className={styles.detalleEstado}>
                <span className={`${styles.pill} ${styles[`p_${actual.estado}`]}`}>
                  {ETIQUETAS[actual.estado]}
                  {actual.via === "promocion" ? " por promoción" : actual.via === "final" ? " con final" : ""}
                </span>
                {actual.nota !== null && <span className={styles.detalleNota}>Nota {nota1(Number(actual.nota))}</span>}
              </div>

              <h3 className={styles.detalleSub}>Correlativas</h3>
              {actual.correlativas.length === 0 ? (
                <p className={styles.detalleDato}>No tiene correlativas.</p>
              ) : (
                <ul className={styles.relaciones}>
                  {actual.correlativas.map((c) => (
                    <li key={c.id}>
                      <button type="button" className={styles.relacionBtn} onClick={() => setSeleccionada(c.id)}>
                        <span>{c.nombre}</span>
                        <span className={`${styles.pillChico} ${styles[`p_${c.estado}`]}`}>{ETIQUETAS[c.estado]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {habilita.length > 0 && (
                <>
                  <h3 className={styles.detalleSub}>La necesitan</h3>
                  <ul className={styles.relaciones}>
                    {habilita.map((h) => (
                      <li key={h.id}>
                        <button type="button" className={styles.relacionBtn} onClick={() => setSeleccionada(h.id)}>
                          <span>{h.nombre}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <h3 className={styles.detalleSub}>Qué podés hacer</h3>
              <Acciones
                m={actual}
                mesas={mesasDe(actual)}
                procesando={procesando}
                onCursar={cursar}
                onAnotar={anotarFinal}
                onBaja={bajaFinal}
              />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function Acciones({
  m,
  mesas,
  procesando,
  onCursar,
  onAnotar,
  onBaja,
}: {
  m: MateriaPlan;
  mesas: Mesa[];
  procesando: string | null;
  onCursar: (m: MateriaPlan) => void;
  onAnotar: (x: Mesa) => void;
  onBaja: (x: Mesa) => void;
}) {
  if (m.estado === "aprobada") return <p className={styles.detalleDato}>Ya la aprobaste. No tenés nada pendiente acá.</p>;

  if (m.estado === "cursando") return <p className={styles.detalleDato}>La estás cursando. Cuando cierren las notas vas a ver si queda regular o aprobada.</p>;

  if (m.estado === "regular") {
    return (
      <>
        {!m.rendir.permitido && mesas.every((x) => !x.inscripcion_id) && (
          <>
            <p className={styles.detalleDato}>Todavía no podés rendir el final:</p>
            <ul className={styles.motivos}>
              {m.rendir.motivos.map((x) => <li key={x}>{x}</li>)}
            </ul>
          </>
        )}
        {mesas.length === 0 ? (
          <p className={styles.detalleDato}>No hay mesas de final cargadas para esta materia.</p>
        ) : (
          <ul className={styles.mesas}>
            {mesas.map((x) => (
              <li key={x.id} className={styles.mesa}>
                <span>
                  <span className={styles.mesaFecha}>{formatearFecha(x.fecha)}</span>
                  <span className={styles.mesaHora}>{x.hora ? `${hhmm(x.hora)} hs` : ""}</span>
                </span>
                {x.inscripcion_id ? (
                  <button className={styles.btnSecundario} disabled={procesando === `f${x.id}`} onClick={() => onBaja(x)}>
                    Darme de baja
                  </button>
                ) : (
                  <button className={styles.btnPrimario} disabled={!m.rendir.permitido || procesando === `f${x.id}`} onClick={() => onAnotar(x)}>
                    {procesando === `f${x.id}` ? "Anotando..." : "Anotarme"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  return (
    <>
      {m.cursar.permitido ? (
        <>
          <p className={styles.detalleDato}>
            {m.estado === "libre" ? "Quedaste libre. Podés volver a cursarla." : "Cumplís las correlativas. Podés inscribirte a la cursada."}
          </p>
          <button className={styles.btnPrimario} disabled={procesando === `c${m.id}`} onClick={() => onCursar(m)}>
            {procesando === `c${m.id}` ? "Inscribiendo..." : m.estado === "libre" ? "Recursar" : "Cursar"}
          </button>
        </>
      ) : (
        <>
          <p className={styles.detalleDato}>Todavía no podés cursarla:</p>
          <ul className={styles.motivos}>
            {m.cursar.motivos.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </>
      )}
    </>
  );
}
