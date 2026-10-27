"use client";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../store";
import { Markdown } from "./markdown";
import styles from "./asistente-ia.module.css";

type Tarjeta = { tipo: "cursar" | "final"; materia: string; fecha?: string; hora?: string | null };
type Mensaje = { role: "user" | "assistant"; content: string; tarjeta?: Tarjeta | null };

const fechaCorta = (f: string) =>
  new Date(f).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

const aiApi = () =>
  process.env.NEXT_PUBLIC_AI_API || `${window.location.protocol}//${window.location.hostname}:5000`;

export const AsistenteIA = () => {
  const { user } = useAppStore();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  const mandar = async (mensaje: string) => {
    if (!mensaje || cargando) return;

    const historial = mensajes.map(({ role, content }) => ({ role, content }));
    setMensajes([...mensajes, { role: "user", content: mensaje }]);
    setTexto("");
    setCargando(true);

    try {
      const res = await fetch(`${aiApi()}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
        body: JSON.stringify({ mensaje, historial }),
      });
      const data = await res.json();
      const respuesta = res.ok ? data.respuesta : data.message || "Algo salió mal, probá de nuevo.";
      setMensajes((prev) => [...prev, { role: "assistant", content: respuesta, tarjeta: res.ok ? data.tarjeta : null }]);
      if (res.ok && data.actualizo) window.dispatchEvent(new Event("plan:actualizar"));
    } catch {
      setMensajes((prev) => [...prev, { role: "assistant", content: "No me pude conectar con el asistente." }]);
    } finally {
      setCargando(false);
    }
  };

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    mandar(texto.trim());
  };

  return (
    <>
      {abierto && (
        <div className={styles.panel}>
          <div className={styles.cabecera}>
            <div>
              <div className={styles.titulo}>Asistente virtual</div>
              <div className={styles.subtitulo}>Con Gemini</div>
            </div>
            <button className={styles.cerrar} onClick={() => setAbierto(false)} aria-label="Cerrar">×</button>
          </div>

          <div className={styles.mensajes}>
            {mensajes.length === 0 && (
              <div className={styles.vacio}>
                Hola{user?.nombre ? `, ${user.nombre}` : ""}. Preguntame sobre materias, horarios, profesores, correlativas o tus inscripciones.
              </div>
            )}
            {mensajes.map((m, i) => (
              <div key={i} className={m.role === "user" ? styles.burbujaUser : styles.burbujaIA}>
                {m.role === "assistant" ? <Markdown texto={m.content} /> : m.content}
                {m.tarjeta && i === mensajes.length - 1 && (
                  <div className={styles.tarjeta}>
                    <div className={styles.tarjetaTipo}>{m.tarjeta.tipo === "final" ? "Anotarte al final" : "Inscribirte a cursar"}</div>
                    <div className={styles.tarjetaMateria}>{m.tarjeta.materia}</div>
                    {m.tarjeta.fecha && (
                      <div className={styles.tarjetaDato}>{fechaCorta(m.tarjeta.fecha)}{m.tarjeta.hora ? `, ${m.tarjeta.hora} hs` : ""}</div>
                    )}
                    <div className={styles.tarjetaBotones}>
                      <button type="button" className={styles.confirmar} disabled={cargando} onClick={() => mandar("Sí, confirmo")}>Confirmar</button>
                      <button type="button" className={styles.cancelar} disabled={cargando} onClick={() => mandar("No, cancelá")}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {cargando && <div className={styles.burbujaIA}>Pensando...</div>}
            <div ref={finRef} />
          </div>

          <form className={styles.formulario} onSubmit={enviar}>
            <input
              className={styles.input}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribí tu pregunta..."
              disabled={cargando}
            />
            <button className={styles.enviar} type="submit" disabled={cargando || !texto.trim()}>
              Enviar
            </button>
          </form>
        </div>
      )}

      <button className={styles.boton} onClick={() => setAbierto(!abierto)} aria-label="Asistente virtual">
        {abierto ? "×" : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.5A8 8 0 1 1 21 12z" />
          </svg>
        )}
      </button>
    </>
  );
};
