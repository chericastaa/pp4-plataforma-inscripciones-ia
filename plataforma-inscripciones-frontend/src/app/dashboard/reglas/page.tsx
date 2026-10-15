"use client";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/src/store";
import { authHeaders, ACADEMIC_API } from "@/src/lib/api";
import { CARRERAS, nombreCarrera } from "@/src/lib/plan";
import styles from "./reglas.module.css";

type Requisito = "regular" | "aprobada";
type Materia = { id: number; nombre: string; codigo: string | null; carrera_id: number | null; anio: number | null; cuatrimestre: number | null };
type Correlativa = { id: number; materia_id: number; materia_requerida_id: number; requerida: string; para_cursar: Requisito; para_final: Requisito };
type Equivalencia = { id: number; materia_id: number; materia: string; carrera_id: number | null; materia_equivalente_id: number; equivalente: string; carrera_equivalente_id: number | null };

const numero = (m: Materia) => ((m.anio ?? 1) - 1) * 2 + (m.cuatrimestre ?? 1);
const etiqueta = (m: Materia) => `${m.codigo ? `${m.codigo} ` : ""}${m.nombre}`;

export default function PaginaReglas() {
  const { user } = useAppStore();
  const router = useRouter();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [correlativas, setCorrelativas] = useState<Correlativa[]>([]);
  const [equivalencias, setEquivalencias] = useState<Equivalencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState<number>(1);
  const [busqueda, setBusqueda] = useState("");
  const [nuevas, setNuevas] = useState<Record<number, string>>({});
  const [parA, setParA] = useState("");
  const [parB, setParB] = useState("");

  const traer = async () => {
    const [m, r] = await Promise.allSettled([
      fetch(`${ACADEMIC_API}/materias`, { headers: authHeaders() }).then((x) => x.json()),
      fetch(`${ACADEMIC_API}/reglas`, { headers: authHeaders() }).then((x) => x.json()),
    ]);
    return {
      materias: m.status === "fulfilled" && Array.isArray(m.value) ? (m.value as Materia[]) : [],
      correlativas: r.status === "fulfilled" && Array.isArray(r.value?.correlativas) ? (r.value.correlativas as Correlativa[]) : [],
      equivalencias: r.status === "fulfilled" && Array.isArray(r.value?.equivalencias) ? (r.value.equivalencias as Equivalencia[]) : [],
    };
  };

  const aplicar = (d: Awaited<ReturnType<typeof traer>>) => {
    setMaterias(d.materias);
    setCorrelativas(d.correlativas);
    setEquivalencias(d.equivalencias);
    setCargando(false);
  };

  const cargar = () => traer().then(aplicar);

  useEffect(() => {
    if (user?.rol !== "admin") { router.push("/dashboard"); return; }
    traer().then(aplicar);
  }, []);

  const llamar = async (url: string, opciones: RequestInit, exito: string) => {
    try {
      const res = await fetch(`${ACADEMIC_API}${url}`, { headers: authHeaders(), ...opciones });
      const data = res.status === 204 ? null : await res.json();
      if (!res.ok) { toast.warning(data?.message || "No se pudo guardar"); return false; }
      toast.success(exito);
      await cargar();
      return true;
    } catch {
      toast.warning("Error al conectar con el servidor");
      return false;
    }
  };

  const cambiar = (c: Correlativa, campo: "para_cursar" | "para_final", valor: Requisito) =>
    llamar(`/reglas/correlativas/${c.id}`, {
      method: "PUT",
      body: JSON.stringify({ para_cursar: c.para_cursar, para_final: c.para_final, [campo]: valor }),
    }, "Regla actualizada");

  const quitar = (c: Correlativa) => llamar(`/reglas/correlativas/${c.id}`, { method: "DELETE" }, "Correlativa quitada");

  const agregar = async (materiaId: number) => {
    const requerida = nuevas[materiaId];
    if (!requerida) return;
    const ok = await llamar("/reglas/correlativas", {
      method: "POST",
      body: JSON.stringify({ materia_id: materiaId, materia_requerida_id: Number(requerida) }),
    }, "Correlativa agregada");
    if (ok) setNuevas((p) => ({ ...p, [materiaId]: "" }));
  };

  const agregarEquivalencia = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await llamar("/reglas/equivalencias", {
      method: "POST",
      body: JSON.stringify({ materia_id: Number(parA), materia_equivalente_id: Number(parB) }),
    }, "Equivalencia agregada");
    if (ok) { setParA(""); setParB(""); }
  };

  const quitarEquivalencia = (e: Equivalencia) => llamar(`/reglas/equivalencias/${e.id}`, { method: "DELETE" }, "Equivalencia quitada");

  const delaCarrera = useMemo(
    () =>
      materias
        .filter((m) => m.carrera_id === pestana && m.codigo)
        .filter((m) => !busqueda.trim() || etiqueta(m).toLowerCase().includes(busqueda.trim().toLowerCase()))
        .sort((a, b) => numero(a) - numero(b) || (a.codigo ?? "").localeCompare(b.codigo ?? "")),
    [materias, pestana, busqueda]
  );

  const grupos = useMemo(() => {
    const mapa = new Map<number, Materia[]>();
    delaCarrera.forEach((m) => mapa.set(numero(m), [...(mapa.get(numero(m)) ?? []), m]));
    return [...mapa.entries()];
  }, [delaCarrera]);

  const conCodigo = materias.filter((m) => m.codigo);

  if (cargando) return <div className={styles.pagina}><p className={styles.vacio}>Cargando reglas...</p></div>;

  return (
    <div className={styles.pagina}>
      <h1 className={styles.titulo}>Reglas de inscripción</h1>
      <p className={styles.sub}>
        Definí qué hace falta tener para cursar una materia y para rendir su final. Los cambios se aplican enseguida a todos los alumnos.
      </p>

      <div className={styles.barra}>
        <div className={styles.tabs} role="tablist">
          {Object.entries(CARRERAS).map(([id, nombre]) => (
            <button key={id} role="tab" aria-selected={pestana === Number(id)} className={`${styles.tab} ${pestana === Number(id) ? styles.tabOn : ""}`} onClick={() => setPestana(Number(id))}>
              {nombre}
            </button>
          ))}
          <button role="tab" aria-selected={pestana === 0} className={`${styles.tab} ${pestana === 0 ? styles.tabOn : ""}`} onClick={() => setPestana(0)}>
            Equivalencias ({equivalencias.length})
          </button>
        </div>
        {pestana !== 0 && (
          <input className={styles.buscar} placeholder="Buscar materia..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar materia" />
        )}
      </div>

      {pestana === 0 ? (
        <>
          <form className={styles.form} onSubmit={agregarEquivalencia}>
            <div>
              <label className={styles.etiqueta} htmlFor="par-a">Materia</label>
              <select id="par-a" className={styles.campo} value={parA} onChange={(e) => setParA(e.target.value)}>
                <option value="">Elegir...</option>
                {conCodigo.map((m) => <option key={m.id} value={m.id}>{etiqueta(m)} ({nombreCarrera(m.carrera_id)})</option>)}
              </select>
            </div>
            <div>
              <label className={styles.etiqueta} htmlFor="par-b">Equivale a</label>
              <select id="par-b" className={styles.campo} value={parB} onChange={(e) => setParB(e.target.value)}>
                <option value="">Elegir...</option>
                {conCodigo.filter((m) => String(m.id) !== parA).map((m) => <option key={m.id} value={m.id}>{etiqueta(m)} ({nombreCarrera(m.carrera_id)})</option>)}
              </select>
            </div>
            <button type="submit" className={styles.btnOk} disabled={!parA || !parB}>Agregar equivalencia</button>
          </form>

          <section className={styles.grupo}>
            <h2 className={styles.grupoTitulo}>Aprobar una materia cuenta como aprobar la otra</h2>
            {equivalencias.length === 0 ? (
              <p className={styles.vacio}>Todavía no hay equivalencias cargadas.</p>
            ) : (
              equivalencias.map((e) => (
                <div key={e.id} className={styles.filaEq}>
                  <span>{e.materia}<span className={styles.carreraEq}>{nombreCarrera(e.carrera_id)}</span></span>
                  <span className={styles.igual} aria-label="equivale a">=</span>
                  <span>{e.equivalente}<span className={styles.carreraEq}>{nombreCarrera(e.carrera_equivalente_id)}</span></span>
                  <button className={`${styles.btnChico} ${styles.btnPeligro}`} onClick={() => quitarEquivalencia(e)}>Quitar</button>
                </div>
              ))
            )}
          </section>
        </>
      ) : grupos.length === 0 ? (
        <p className={styles.vacio}>No hay materias que coincidan con la búsqueda.</p>
      ) : (
        grupos.map(([n, lista]) => (
          <section key={n} className={styles.grupo}>
            <h2 className={styles.grupoTitulo}>
              {n}° cuatrimestre <span className={styles.grupoCant}>Año {lista[0].anio}</span>
            </h2>
            {lista.map((m) => {
              const propias = correlativas.filter((c) => c.materia_id === m.id);
              const disponibles = materias.filter((x) => x.carrera_id === m.carrera_id && x.codigo && x.id !== m.id && !propias.some((c) => c.materia_requerida_id === x.id));
              return (
                <div key={m.id} className={styles.materia}>
                  <div className={styles.materiaCab}>
                    <span className={styles.codigo}>{m.codigo}</span>
                    <span className={styles.nombre}>{m.nombre}</span>
                  </div>
                  {propias.length === 0 && <p className={styles.sinReglas}>No tiene correlativas.</p>}
                  {propias.map((c) => (
                    <div key={c.id} className={styles.regla}>
                      <span className={styles.requerida}>{c.requerida}</span>
                      <label className={styles.selector}>
                        <span className={styles.etiqueta}>Para cursar</span>
                        <select className={styles.campo} value={c.para_cursar} onChange={(e) => cambiar(c, "para_cursar", e.target.value as Requisito)}>
                          <option value="regular">Regular</option>
                          <option value="aprobada">Aprobada</option>
                        </select>
                      </label>
                      <label className={styles.selector}>
                        <span className={styles.etiqueta}>Para el final</span>
                        <select className={styles.campo} value={c.para_final} onChange={(e) => cambiar(c, "para_final", e.target.value as Requisito)}>
                          <option value="regular">Regular</option>
                          <option value="aprobada">Aprobada</option>
                        </select>
                      </label>
                      <button className={`${styles.btnChico} ${styles.btnPeligro}`} onClick={() => quitar(c)}>Quitar</button>
                    </div>
                  ))}
                  <div className={styles.agregar}>
                    <select className={styles.campo} aria-label={`Agregar correlativa a ${m.nombre}`} value={nuevas[m.id] ?? ""} onChange={(e) => setNuevas((p) => ({ ...p, [m.id]: e.target.value }))}>
                      <option value="">Agregar correlativa...</option>
                      {disponibles.map((x) => <option key={x.id} value={x.id}>{etiqueta(x)}</option>)}
                    </select>
                    <button className={`${styles.btnChico} ${styles.btnAzul}`} disabled={!nuevas[m.id]} onClick={() => agregar(m.id)}>Agregar</button>
                  </div>
                </div>
              );
            })}
          </section>
        ))
      )}
    </div>
  );
}
