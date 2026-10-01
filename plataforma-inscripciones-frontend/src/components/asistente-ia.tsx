"use client";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../store";
import styles from "./asistente-ia.module.css";

type Mensaje = { role: "user" | "assistant"; content: string };

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

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje || cargando) return;

    const historial = mensajes;
    setMensajes([...historial, { role: "user", content: mensaje }]);
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
      setMensajes((prev) => [...prev, { role: "assistant", content: respuesta }]);
    } catch {
      setMensajes((prev) => [...prev, { role: "assistant", content: "No me pude conectar con el asistente." }]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {abierto && (
        <div className={styles.panel}>
          <div className={styles.cabecera}>
            <div>
              <div className={styles.titulo}>Asistente virtual</div>
              <div className={styles.subtitulo}>IA local · Qwen 2.5</div>
            </div>
            <button className={styles.cerrar} onClick={() => setAbierto(false)} aria-label="Cerrar">×</button>
          </div>

          <div className={styles.mensajes}>
            {mensajes.length === 0 && (
              <div className={styles.vacio}>
                Hola{user?.nombre ? `, ${user.nombre}` : ""} 👋 Preguntame sobre materias, horarios, profesores, correlativas o tus inscripciones.
              </div>
            )}
            {mensajes.map((m, i) => (
              <div key={i} className={m.role === "user" ? styles.burbujaUser : styles.burbujaIA}>
                {m.content}
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
        {abierto ? "×" : "💬"}
      </button>
    </>
  );
};
