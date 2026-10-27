"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/src/store";
import { authHeaders, ACADEMIC_API } from "@/src/lib/api";
import { nombreCarrera, formatearFecha, hhmm } from "@/src/lib/plan";
import styles from "./periodos.module.css";

type Periodo = { id: number; anio: number; cuatrimestre: number; nombre: string; actual: number; inscriptos: number };
type Materia = { id: number; nombre: string; codigo: string | null; carrera_id: number | null };
type Mesa = { id: number; materia_id: number; fecha: string; hora: string | null; inscriptos: number };

export default function PaginaPeriodos() {
  const { user } = useAppStore();
  const router = useRouter();
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [anio, setAnio] = useState("");
  const [cuat, setCuat] = useState("1");
  const [materiaId, setMateriaId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("18:00");

  const traer = async () => {
    const [p, m, f] = await Promise.allSettled([
      fetch(`${ACADEMIC_API}/inscripciones/periodos`, { headers: authHeaders() }).then((x) => x.json()),
      fetch(`${ACADEMIC_API}/materias`, { headers: authHeaders() }).then((x) => x.json()),
      fetch(`${ACADEMIC_API}/finales/mesas?todas=1`, { headers: authHeaders() }).then((x) => x.json()),
    ]);
    const lista = (r: PromiseSettledResult<unknown>) => (r.status === "fulfilled" && Array.isArray(r.value) ? r.value : []);
    return { periodos: lista(p) as Periodo[], materias: (lista(m) as Materia[]).filter((x) => x.codigo), mesas: lista(f) as Mesa[] };
  };

  const aplicar = (d: Awaited<ReturnType<typeof traer>>) => {
    setPeriodos(d.periodos);
    setMaterias(d.materias);
    setMesas(d.mesas);
    setCargando(false);
    setMateriaId((actual) => actual || String(d.materias[0]?.id ?? ""));
  };

  const cargar = () => traer().then(aplicar);

  useEffect(() => {
    if (user?.rol !== "admin") { router.push("/dashboard"); return; }
    traer().then(aplicar);
  }, []);

  const llamar = async (url: string, opciones: RequestInit, exito: string) => {
    try {
      const res = await fetch(`${ACADEMIC_API}${url}`, { headers: authHeaders(), ...opciones });
      const data = await res.json();
      if (!res.ok) { toast.warning(data?.message || "No se pudo guardar"); return false; }
      toast.success(exito);
      await cargar();
      return true;
    } catch {
      toast.warning("Error al conectar con el servidor");
      return false;
    }
  };

  const ultimo = periodos[periodos.length - 1];
  const siguiente = ultimo ? (ultimo.cuatrimestre === 1 ? { anio: ultimo.anio, cuat: 2 } : { anio: ultimo.anio + 1, cuat: 1 }) : null;

  const crearPeriodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await llamar("/inscripciones/periodos", {
      method: "POST",
      body: JSON.stringify({ anio: Number(anio || siguiente?.anio), cuatrimestre: Number(anio ? cuat : siguiente?.cuat ?? cuat) }),
    }, "Período creado");
    if (ok) setAnio("");
  };

  const abrir = (p: Periodo) => llamar(`/inscripciones/periodos/${p.id}/abrir`, { method: "PUT" }, `Quedó abierto el ${p.nombre}`);

  const crearMesa = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await llamar("/finales/mesas", {
      method: "POST",
      body: JSON.stringify({ materia_id: Number(materiaId), fecha, hora }),
    }, "Mesa creada");
    if (ok) setFecha("");
  };

  const borrarMesa = (m: Mesa) => {
    if (!confirm("¿Borrar esta mesa?")) return;
    llamar(`/finales/mesas/${m.id}`, { method: "DELETE" }, "Mesa borrada");
  };

  const delaMateria = mesas.filter((m) => String(m.materia_id) === materiaId).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const materia = materias.find((m) => String(m.id) === materiaId);
  const carreras = [...new Set(materias.map((m) => m.carrera_id))];
  const hoy = new Date().toISOString().slice(0, 10);

  if (cargando) return <div className={styles.pagina}><p className={styles.vacio}>Cargando...</p></div>;

  return (
    <div className={styles.pagina}>
      <h1 className={styles.titulo}>Períodos y mesas</h1>
      <p className={styles.sub}>Los alumnos se inscriben a cursar en el período abierto. Cada materia se cursa en el cuatrimestre que le toca.</p>

      <section className={styles.bloque}>
        <h2 className={styles.bloqueTitulo}>Períodos de cursada</h2>
        {periodos.map((p) => (
          <div key={p.id} className={styles.fila}>
            <span className={styles.nombre}>{p.nombre}</span>
            <span className={styles.dato}>{p.inscriptos} inscripciones</span>
            {p.actual ? <span className={styles.abierto}>Abierto</span> : <button type="button" className={styles.btnChico} onClick={() => abrir(p)}>Abrir este período</button>}
          </div>
        ))}
        <form onSubmit={crearPeriodo} className={styles.form}>
          <div>
            <label className={styles.etiqueta} htmlFor="p-anio">Año</label>
            <input id="p-anio" className={styles.campo} type="number" placeholder={siguiente ? String(siguiente.anio) : "2027"} value={anio} onChange={(e) => setAnio(e.target.value)} />
          </div>
          <div>
            <label className={styles.etiqueta} htmlFor="p-cuat">Cuatrimestre</label>
            <select id="p-cuat" className={styles.campo} value={anio ? cuat : String(siguiente?.cuat ?? cuat)} onChange={(e) => setCuat(e.target.value)} disabled={!anio}>
              <option value="1">1er cuatrimestre</option>
              <option value="2">2do cuatrimestre</option>
            </select>
          </div>
          <button type="submit" className={styles.btnOk}>Crear período</button>
        </form>
      </section>

      <section className={styles.bloque}>
        <h2 className={styles.bloqueTitulo}>Mesas de final</h2>
        <div className={styles.form}>
          <div>
            <label className={styles.etiqueta} htmlFor="m-materia">Materia</label>
            <select id="m-materia" className={`${styles.campo} ${styles.ancho}`} value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
              {carreras.map((c) => (
                <optgroup key={c ?? 0} label={nombreCarrera(c) || "Sin carrera"}>
                  {materias.filter((m) => m.carrera_id === c).map((m) => <option key={m.id} value={m.id}>{m.codigo} {m.nombre}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        {delaMateria.length === 0 && <p className={styles.vacio}>{materia?.nombre} no tiene mesas.</p>}
        {delaMateria.map((m, i) => (
          <div key={m.id} className={styles.fila}>
            <span className={styles.nombre}>{formatearFecha(m.fecha)}{m.hora ? `, ${hhmm(m.hora)}` : ""}</span>
            <span className={styles.dato}>{i + 1}° llamado, {m.inscriptos} anotados{m.fecha.slice(0, 10) < hoy ? ", ya pasó" : ""}</span>
            <button type="button" className={styles.btnChico} onClick={() => borrarMesa(m)} disabled={m.inscriptos > 0}>Borrar</button>
          </div>
        ))}
        <form onSubmit={crearMesa} className={styles.form}>
          <div>
            <label className={styles.etiqueta} htmlFor="m-fecha">Fecha</label>
            <input id="m-fecha" className={styles.campo} type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <label className={styles.etiqueta} htmlFor="m-hora">Hora</label>
            <input id="m-hora" className={styles.campo} type="time" required value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
          <button type="submit" className={styles.btnOk} disabled={!materiaId}>Crear mesa</button>
        </form>
      </section>
    </div>
  );
}
