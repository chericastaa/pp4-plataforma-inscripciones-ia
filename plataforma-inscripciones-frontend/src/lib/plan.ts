import { ACADEMIC_API, authHeaders } from "./api";

export type Estado = "aprobada" | "regular" | "cursando" | "libre" | "no_cursada";

export type Resultado = { permitido: boolean; motivos: string[] };

export type MateriaPlan = {
  id: number;
  codigo: string;
  nombre: string;
  anio: number;
  cuatrimestre: number;
  dia: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado: Estado;
  nota: number | null;
  via: "final" | "promocion" | null;
  correlativas: { id: number; nombre: string; estado: Estado }[];
  cursar: Resultado;
  rendir: Resultado;
};

export type Mesa = {
  id: number;
  fecha: string;
  hora: string | null;
  materia_id: number;
  materia: string;
  inscripcion_id: number | null;
  rendir: Resultado;
};

export const ETIQUETAS: Record<Estado, string> = {
  aprobada: "Aprobada",
  regular: "Regular",
  cursando: "Cursando",
  libre: "Libre",
  no_cursada: "Sin cursar",
};

export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

export const DIAS_CORTOS: Record<string, string> = {
  Lunes: "Lun",
  Martes: "Mar",
  Miércoles: "Mié",
  Jueves: "Jue",
  Viernes: "Vie",
};

export const aMinutos = (hora: string) => {
  const [h, m] = hora.split(":");
  return Number(h) * 60 + Number(m);
};

export const hhmm = (hora: string | null) => (hora ? hora.slice(0, 5) : "");

export const formatearFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export const nota1 = (n: number) => Number(n).toLocaleString("es-AR", { maximumFractionDigits: 1 });

export async function cargarPlan(): Promise<{ carrera: string; materias: MateriaPlan[]; mesas: Mesa[]; error: boolean }> {
  const [planRes, mesasRes] = await Promise.allSettled([
    fetch(`${ACADEMIC_API}/motor/plan`, { headers: authHeaders() }).then((r) => r.json()),
    fetch(`${ACADEMIC_API}/finales/mesas`, { headers: authHeaders() }).then((r) => r.json()),
  ]);

  const plan = planRes.status === "fulfilled" ? planRes.value : null;
  const materias: MateriaPlan[] = Array.isArray(plan?.materias) ? plan.materias : [];
  const mesas: Mesa[] = mesasRes.status === "fulfilled" && Array.isArray(mesasRes.value) ? mesasRes.value : [];

  return { carrera: plan?.carrera || "", materias, mesas, error: materias.length === 0 };
}

export const CARRERAS: Record<number, string> = { 1: "Desarrollo de Software", 2: "Análisis de Sistemas" };
export const nombreCarrera = (id: number | null | undefined) => (id ? CARRERAS[id] ?? `Carrera ${id}` : "");
export const ORDEN_DIAS: Record<string, number> = { Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6 };
