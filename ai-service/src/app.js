const express = require("express");
const cors = require("cors");
const verificarToken = require("./auth");
const { crearHerramientas } = require("./tools");

const AI_BASE_URL = process.env.AI_BASE_URL || "http://ollama:11434/v1";
const AI_MODEL = process.env.AI_MODEL || "qwen2.5:1.5b";
const AI_API_KEY = process.env.AI_API_KEY || "ollama";
const MAX_VUELTAS = 4;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI service funcionando");
});

const MODELO_RESPALDO = process.env.AI_MODEL_RESPALDO || (AI_BASE_URL.includes("googleapis") ? "gemini-3.1-flash-lite" : "");
const MODELOS = [AI_MODEL, MODELO_RESPALDO].filter(Boolean);
const REINTENTABLES = [429, 500, 502, 503, 504];

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedirModelo(modelo, mensajes, tools) {
  return fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${AI_API_KEY}` },
    body: JSON.stringify({ model: modelo, messages: mensajes, tools, temperature: 0.1, max_tokens: 500 }),
    signal: AbortSignal.timeout(30000),
  });
}

async function llamarModelo(mensajes, tools) {
  let ultimo = null;

  for (const modelo of MODELOS) {
    for (let intento = 0; intento < 3; intento++) {
      try {
        const respuesta = await pedirModelo(modelo, mensajes, tools);

        if (respuesta.ok) {
          const data = await respuesta.json();
          return data.choices[0].message;
        }

        const detalle = await respuesta.text();
        console.error(`Error de la IA (${modelo}):`, respuesta.status, detalle.slice(0, 200));
        ultimo = respuesta.status;
        if (!REINTENTABLES.includes(respuesta.status)) break;
      } catch (err) {
        console.error(`Error de red con la IA (${modelo}):`, err.message);
        ultimo = 0;
      }
      await esperar(1000 * (intento + 1));
    }
  }

  const error = new Error(ultimo === 404
    ? "La IA todavía se está descargando, probá de nuevo en unos minutos."
    : "La IA está con mucha demanda en este momento, probá de nuevo en unos segundos.");
  error.status = 503;
  throw error;
}

const normalizar = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const preguntaDe = (t) =>
  t.tipo === "final"
    ? `¿Confirmás anotarte al final de ${t.materia} del ${t.fecha}?`
    : `¿Confirmás inscribirte a cursar ${t.materia}?`;

app.post("/chat", verificarToken, async (req, res) => {
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

  try {
    for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
      const msg = await llamarModelo(mensajes, definiciones);

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
