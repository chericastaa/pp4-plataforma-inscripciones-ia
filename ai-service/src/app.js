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

app.post("/chat", verificarToken, async (req, res) => {
  const { mensaje, historial = [] } = req.body;

  if (!mensaje || !mensaje.trim()) {
    return res.status(400).json({ message: "Falta el mensaje" });
  }

  const { definiciones, ejecutar } = crearHerramientas(req.user, req.headers.authorization);

  const system = `Sos el asistente virtual de la Plataforma de Inscripciones del IFTS N°16.
Respondés en español rioplatense (usás "vos"), corto, claro y amable.
Estás hablando con ${req.user.nombre}, que tiene rol de ${req.user.rol}.
Cada alumno cursa una carrera distinta; la suya la ves con ver_mi_plan_de_estudios. No sabés nada de la plataforma de memoria: para cualquier dato sobre materias, notas, correlativas, inscripciones o finales tenés que usar las herramientas.
Para saber si se puede cursar o rendir algo, usá siempre puedo_cursar o puedo_rendir_final y explicá los motivos que devuelvan.
Si preguntan "cuándo" pueden rendir o cursar algo, usá también ver_mesas_de_final o el horario de la materia y respondé con fechas y horarios concretos en el mismo mensaje, sin preguntar si querés que los busques.
No podés inscribir ni anotar a nadie: nunca ofrezcas anotar. Si hay una mesa o una cursada disponible, indicá que se anote desde la sección Plan de estudios de la plataforma.
Si una herramienta no devuelve el dato, decí que no tenés esa información. No inventes nada.
${req.user.rol === "alumno" ? "No tenés acceso a datos de otros alumnos. Si te preguntan por compañeros, explicá que por privacidad solo podés ver su propia información." : ""}
Si te saludan o preguntan algo que no tiene que ver con la plataforma, respondé sin usar herramientas.`;

  const mensajes = [
    { role: "system", content: system },
    ...historial.slice(-8).filter((m) => m.role === "user" || m.role === "assistant"),
    { role: "user", content: mensaje },
  ];

  try {
    for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
      const msg = await llamarModelo(mensajes, definiciones);

      if (!msg.tool_calls?.length) {
        return res.json({ respuesta: msg.content || "No entendí la pregunta, ¿me la repetís?" });
      }

      mensajes.push({ role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls });

      for (const llamada of msg.tool_calls) {
        let args = llamada.function.arguments;
        if (typeof args === "string") {
          try { args = JSON.parse(args || "{}"); } catch { args = {}; }
        }
        const resultado = await ejecutar(llamada.function.name, args);
        console.log(`[tool] ${llamada.function.name}`, JSON.stringify(args));
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
