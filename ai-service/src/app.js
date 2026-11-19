const express = require("express");
const cors = require("cors");
const verificarToken = require("./auth");
const { crearHerramientas } = require("./tools");

const AI_BASE_URL = process.env.AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai";
const AI_MODEL = process.env.AI_MODEL || "gemini-flash-lite-latest";
const AI_API_KEY = process.env.AI_API_KEY || "";
const MAX_VUELTAS = 4;
const TIEMPO_MAXIMO_MS = 60000;

const LIMITE_SOLICITUDES = 10;
const VENTANA_MS = 60 * 1000;
const solicitudes = new Map();

const limitarSolicitudes = (req, res, next) => {
  const id = req.user.id;
  const ahora = Date.now();
  const datos = solicitudes.get(id) || { cantidad: 0, inicio: ahora };

  if (ahora - datos.inicio >= VENTANA_MS) {
    datos.cantidad = 0;
    datos.inicio = ahora;
  }

  if (datos.cantidad >= LIMITE_SOLICITUDES) {
    return res.status(429).json({
      message: "Alcanzaste el límite de solicitudes. Esperá un minuto y volvé a intentar."
    });
  }

  datos.cantidad++;
  solicitudes.set(id, datos);

  next();
};

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI service funcionando");
});

const MODELO_RESPALDO = process.env.AI_MODEL_RESPALDO || (AI_BASE_URL.includes("googleapis") ? "gemini-3.1-flash-lite" : "");
const URL_RESPALDO = process.env.AI_BASE_URL_RESPALDO || AI_BASE_URL;
const KEY_RESPALDO = process.env.AI_API_KEY_RESPALDO || AI_API_KEY;
const PROVEEDORES = [
  { nombre: "principal", url: AI_BASE_URL, key: AI_API_KEY, modelo: AI_MODEL },
  { nombre: "respaldo", url: URL_RESPALDO, key: KEY_RESPALDO, modelo: MODELO_RESPALDO }
].filter((p) => p.modelo);
const REINTENTABLES = [429, 500, 502, 503, 504];

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedirModelo(p, mensajes, tools, restante) {
  return fetch(`${p.url}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.key}` },
    body: JSON.stringify({ model: p.modelo, messages: mensajes, tools, temperature: 0.1, max_tokens: 500 }),
    signal: AbortSignal.timeout(Math.min(15000, restante)),
  });
}

async function llamarModelo(mensajes, tools, limiteTiempo) {
  for (const p of PROVEEDORES) {
    for (let intento = 0; intento < 2; intento++) {
      const restante = limiteTiempo - Date.now();
      if (restante <= 0) break;

      try {
        const respuesta = await pedirModelo(p, mensajes, tools, restante);

        if (respuesta.ok) {
          const data = await respuesta.json();
          if (p.nombre === "respaldo") {
            console.warn(`[ia] respondio el respaldo (${p.modelo})`);
          }
          return data.choices[0].message;
        }

        const detalle = await respuesta.text();
        console.error(`[ia] fallo ${p.nombre} (${p.modelo}):`, respuesta.status, detalle.slice(0, 200));
        if (!REINTENTABLES.includes(respuesta.status)) break;
      } catch (err) {
        console.error(`[ia] fallo ${p.nombre} (${p.modelo}):`, err.message);
      }

      const espera = Math.min(1000 * (intento + 1), Math.max(0, limiteTiempo - Date.now()));
      if (espera > 0) await esperar(espera);
    }

    if (p !== PROVEEDORES[PROVEEDORES.length - 1]) {
      console.warn(`[ia] paso del ${p.nombre} al siguiente`);
    }
  }

  console.error("[ia] fallaron todos los proveedores");
  const error = new Error("La IA está con mucha demanda en este momento, probá de nuevo en unos segundos.");
  error.status = 503;
  throw error;
}

const normalizar = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const preguntaDe = (t) =>
  t.tipo === "final"
    ? `¿Confirmás anotarte al final de ${t.materia} del ${t.fecha}?`
    : `¿Confirmás inscribirte a cursar ${t.materia}?`;

app.post("/chat", verificarToken, limitarSolicitudes, async (req, res) => {
  const { mensaje, historial = [] } = req.body;

  if (!mensaje || !mensaje.trim()) {
    return res.status(400).json({ message: "Falta el mensaje" });
  }

  const { definiciones, ejecutar } = crearHerramientas(req.user, req.headers.authorization, { mensaje, historial });

  const system = `Sos el asistente de la plataforma de inscripciones del IFTS N°16.
Hablás en español rioplatense, con vos, corto y claro.
Hablás con ${req.user.nombre}, que es ${req.user.rol}.
No sabés nada de memoria: para materias, notas, correlativas, inscripciones o finales usá siempre las herramientas. La carrera del alumno la ves con ver_mi_plan_de_estudios.
Para saber si puede cursar o rendir algo, usá puedo_cursar o puedo_rendir_final y contá los motivos que devuelvan.
Si preguntan cuándo, usá ver_mesas_de_final o el horario de la materia y respondé con fechas y horarios en el mismo mensaje.
Si un alumno pide inscribirse a cursar o anotarse a un final, usá inscribirme_a_cursar o anotarme_a_final. Solo si lo pidió. Antes pedile confirmación nombrando la materia (y la fecha si es final), y cuando confirme volvé a llamar a la herramienta. Cursada y final son distintos, aclará cuál es. Decí que quedó inscripto solo si la herramienta devolvió true. Si devuelve motivos, contáselos.
Profesores y admin no pueden inscribir a nadie desde el chat.
Si no tenés el dato, decilo. No inventes.
${req.user.rol === "alumno" ? "No podés ver datos de otros alumnos." : ""}
Si saludan o preguntan algo ajeno a la plataforma, respondé sin herramientas.`;

  const mensajes = [
    { role: "system", content: system },
    ...historial.slice(-8).filter((m) => m.role === "user" || m.role === "assistant"),
    { role: "user", content: mensaje },
  ];

  let tarjeta = null;
  let actualizo = false;
  const limiteTiempo = Date.now() + TIEMPO_MAXIMO_MS;
  try {
    for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {

      const msg = await llamarModelo(mensajes, definiciones, limiteTiempo);

      if (!msg.tool_calls?.length) {
        let respuesta = msg.content || "No entendí la pregunta, ¿me la repetís?";
        if (tarjeta) {
          const pregunta = preguntaDe(tarjeta);
          if (!respuesta.includes("?") || !normalizar(respuesta).includes(normalizar(tarjeta.materia))) {
            respuesta = `${respuesta}\n\n${pregunta}`;
          }
        }
        return res.json({ respuesta, tarjeta, actualizo });
      }

      mensajes.push({ role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls });

      for (const llamada of msg.tool_calls) {
        let args = llamada.function.arguments;
        if (typeof args === "string") {
          try { args = JSON.parse(args || "{}"); } catch { args = {}; }
        }
        const resultado = await ejecutar(llamada.function.name, args);
        if (resultado?.tarjeta) tarjeta = resultado.tarjeta;
        if (resultado?.inscripto || resultado?.anotado) { tarjeta = null; actualizo = true; }
        mensajes.push({ role: "tool", tool_call_id: llamada.id, content: JSON.stringify(resultado) });
      }
    }

    res.json({ respuesta: "Me costó encontrar esa información, probá preguntarlo de otra forma." });
  } catch (err) {
    console.error("Error en /chat:", err);
    res.status(err.status || 500).json({
      message: err.message?.startsWith("La IA") ? err.message : "No me pude conectar con la IA, probá de nuevo en un rato.",
    });
  }
});

module.exports = app;
