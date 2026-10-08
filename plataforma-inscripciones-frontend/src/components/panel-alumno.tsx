"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/src/store";
import {
  DIAS,
  DIAS_CORTOS,
  ETIQUETAS,
  MateriaPlan,
  Mesa,
  aMinutos,
  cargarPlan,
  formatearFecha,
  hhmm,
  nota1,
} from "@/src/lib/plan";
import styles from "./panel-alumno.module.css";

const ALTO_HORA = 56;

const horario = (m: MateriaPlan) =>
  m.dia && m.hora_inicio && m.hora_fin ? `${m.dia} de ${hhmm(m.hora_inicio)} a ${hhmm(m.hora_fin)}` : "Sin horario cargado";

export function PanelAlumno() {
  const { user } = useAppStore();
  const [materias, setMaterias] = useState<MateriaPlan[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [carrera, setCarrera] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    cargarPlan().then((d) => {
      setMaterias(d.materias);
      setMesas(d.mesas);
      setCarrera(d.carrera);
      setError(d.error);
      setCargando(false);
    });
  }, [user?.id]);

  const datos = useMemo(() => {
    const aprobadas = materias.filter((m) => m.estado === "aprobada");
    const conNota = aprobadas.filter((m) => m.nota !== null);
    const promedio = conNota.length ? conNota.reduce((s, m) => s + Number(m.nota), 0) / conNota.length : null;

    const periodos = new Map<string, MateriaPlan[]>();
    materias.forEach((m) => {
      const clave = `${m.anio}-${m.cuatrimestre}`;
      periodos.set(clave, [...(periodos.get(clave) ?? []), m]);
    });

    const cursando = materias.filter((m) => m.estado === "cursando" && m.dia && m.hora_inicio && m.hora_fin);
    const cursables = materias.filter((m) => m.cursar.permitido && (m.estado === "no_cursada" || m.estado === "libre"));
    const finales = mesas
      .filter((x) => x.inscripcion_id || x.rendir.permitido)
      .sort((a, b) => Number(!!b.inscripcion_id) - Number(!!a.inscripcion_id) || a.fecha.localeCompare(b.fecha));

    return { aprobadas, promedio, periodos: [...periodos.entries()], cursando, cursables, finales };
  }, [materias, mesas]);

  const proximoPaso = useMemo(() => {
    const anotado = datos.finales.find((f) => f.inscripcion_id);
    if (anotado) {
      return `Rendís ${anotado.materia} el ${formatearFecha(anotado.fecha)}${anotado.hora ? ` a las ${hhmm(anotado.hora)}` : ""}.`;
    }
    const posible = datos.finales[0];
    if (posible) return `Podés anotarte al final de ${posible.materia}, el ${formatearFecha(posible.fecha)}.`;
    const n = datos.cursables.length;
    if (n > 0) return `Ya podés cursar ${n} materia${n > 1 ? "s" : ""} más.`;
    return null;
  }, [datos]);

  if (cargando) return <div className={styles.pagina}><p className={styles.estadoVacio}>Cargando tu plan...</p></div>;

  if (error) {
    return (
      <div className={styles.pagina}>
        <p className={styles.estadoVacio}>
          No pudimos cargar tu plan de estudios. Recargá la página o cerrá sesión y volvé a entrar.
        </p>
      </div>
    );
  }

  const primerNombre = (user?.nombre || "").split(" ")[0] || "";

  const inicio = Math.min(18 * 60, ...datos.cursando.map((m) => Math.floor(aMinutos(m.hora_inicio!) / 60) * 60));
  const fin = Math.max(21 * 60, ...datos.cursando.map((m) => Math.ceil(aMinutos(m.hora_fin!) / 60) * 60));
  const horas = Array.from({ length: (fin - inicio) / 60 }, (_, i) => inicio / 60 + i);

  return (
    <div className={styles.pagina}>
      <header className={styles.encabezado}>
        <h1 className={styles.titulo}>Hola, {primerNombre || "estudiante"}</h1>
        <p className={styles.subtitulo}>
          {carrera ? `${carrera}. ` : ""}
          Aprobaste {datos.aprobadas.length} de {materias.length} materias
          {datos.promedio !== null ? ` con promedio ${nota1(datos.promedio)}` : ""}.
        </p>
      </header>

      {proximoPaso && (
        <div className={styles.proximo}>
          <p className={styles.proximoTexto}>{proximoPaso}</p>
          <Link href="/dashboard/plan" className={styles.proximoLink}>
            Ver en el plan
          </Link>
        </div>
      )}

      <section className={styles.tarjeta} aria-labelledby="trayectoria">
        <h2 id="trayectoria" className={styles.tarjetaTitulo}>Tu trayectoria</h2>
        <ol className={styles.periodos}>
          {datos.periodos.map(([clave, lista]) => {
            const ap = lista.filter((m) => m.estado === "aprobada").length;
            return (
              <li key={clave} className={styles.periodo}>
                <div className={styles.periodoNombre}>Año {lista[0].anio}, cuatrimestre {lista[0].cuatrimestre}</div>
                <div className={styles.bloques} role="img" aria-label={`${ap} de ${lista.length} aprobadas`}>
                  {lista.map((m) => (
                    <span key={m.id} className={`${styles.bloque} ${styles[`e_${m.estado}`]}`} title={`${m.nombre}: ${ETIQUETAS[m.estado]}`} />
                  ))}
                </div>
                <div className={styles.periodoDato}>{ap} de {lista.length} aprobadas</div>
              </li>
            );
          })}
        </ol>
        <ul className={styles.leyenda}>
          {(["aprobada", "regular", "cursando", "libre", "no_cursada"] as const).map((e) => (
            <li key={e} className={styles.leyendaItem}>
              <span className={`${styles.bloque} ${styles.bloqueChico} ${styles[`e_${e}`]}`} />
              {ETIQUETAS[e]}
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.columnas}>
        <section className={styles.tarjeta} aria-labelledby="semana">
          <h2 id="semana" className={styles.tarjetaTitulo}>Tu semana</h2>
          {datos.cursando.length === 0 ? (
            <p className={styles.vacio}>
              No estás cursando ninguna materia. <Link href="/dashboard/plan" className={styles.enlace}>Mirá cuáles podés cursar</Link>.
            </p>
          ) : (
            <>
              <div className={styles.semana} style={{ ["--alto-hora" as string]: `${ALTO_HORA}px` }}>
                <div className={styles.semanaCabecera} />
                {DIAS.map((d) => (
                  <div key={d} className={styles.semanaDia}>{DIAS_CORTOS[d]}</div>
                ))}
                <div className={styles.semanaHoras} style={{ height: horas.length * ALTO_HORA }}>
                  {[...horas, fin / 60].map((h) => (
                    <span key={h} className={styles.semanaHora} style={{ top: (h - inicio / 60) * ALTO_HORA }}>{h}:00</span>
                  ))}
                </div>
                {DIAS.map((d) => (
                  <div key={d} className={styles.semanaColumna} style={{ height: horas.length * ALTO_HORA }}>
                    {datos.cursando.filter((m) => m.dia === d).map((m) => {
                      const a = aMinutos(m.hora_inicio!);
                      const b = aMinutos(m.hora_fin!);
                      return (
                        <div
                          key={m.id}
                          className={styles.clase}
                          title={`${m.nombre}, ${hhmm(m.hora_inicio)} a ${hhmm(m.hora_fin)}`}
                          style={{ top: ((a - inicio) / 60) * ALTO_HORA + 1, height: ((b - a) / 60) * ALTO_HORA - 2 }}
                        >
                          <span className={styles.claseNombre}>{m.nombre}</span>
                          <span className={styles.claseHora}>{hhmm(m.hora_inicio)} a {hhmm(m.hora_fin)}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <ul className={styles.agenda}>
                {datos.cursando
                  .slice()
                  .sort((x, y) => DIAS.indexOf(x.dia!) - DIAS.indexOf(y.dia!))
                  .map((m) => (
                    <li key={m.id} className={styles.agendaItem}>
                      <span className={styles.agendaDia}>{DIAS_CORTOS[m.dia!] ?? m.dia}</span>
                      <span>
                        <span className={styles.agendaNombre}>{m.nombre}</span>
                        <span className={styles.agendaHora}>{hhmm(m.hora_inicio)} a {hhmm(m.hora_fin)}</span>
                      </span>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </section>

        <div className={styles.lateral}>
          <section className={styles.tarjeta} aria-labelledby="cursar">
            <h2 id="cursar" className={styles.tarjetaTitulo}>Podés cursar ahora</h2>
            {datos.cursables.length === 0 ? (
              <p className={styles.vacio}>Por ahora no hay materias habilitadas. Revisá tus correlativas en el plan.</p>
            ) : (
              <ul className={styles.lista}>
                {datos.cursables.slice(0, 6).map((m) => (
                  <li key={m.id}>
                    <Link href={`/dashboard/plan?materia=${m.id}`} className={styles.fila}>
                      <span className={styles.filaNombre}>{m.nombre}</span>
                      <span className={styles.filaDato}>
                        {m.estado === "libre" ? "Para recursar. " : ""}
                        {horario(m)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.tarjeta} aria-labelledby="finales">
            <h2 id="finales" className={styles.tarjetaTitulo}>Finales</h2>
            {datos.finales.length === 0 ? (
              <p className={styles.vacio}>No tenés finales para rendir por ahora.</p>
            ) : (
              <ul className={styles.lista}>
                {datos.finales.slice(0, 5).map((f) => (
                  <li key={f.id}>
                    <Link href={`/dashboard/plan?materia=${f.materia_id}`} className={styles.fila}>
                      <span className={styles.filaNombre}>{f.materia}</span>
                      <span className={styles.filaDato}>
                        {formatearFecha(f.fecha)}
                        {f.hora ? `, ${hhmm(f.hora)} hs` : ""}
                      </span>
                      <span className={f.inscripcion_id ? styles.pillAnotado : styles.pillPosible}>
                        {f.inscripcion_id ? "Anotado" : "Podés anotarte"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
