const express = require("express");
const cors = require("cors");
const verificarToken = require("./auth");
const armarContexto = require("./contexto");

const AI_BASE_URL = process.env.AI_BASE_URL || "http://ollama:11434/v1";
const AI_MODEL = process.env.AI_MODEL || "qwen2.5:1.5b";
const AI_API_KEY = process.env.AI_API_KEY || "ollama";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI service funcionando");
});

app.post("/chat", verificarToken, async (req, res) => {
  const { mensaje, historial = [] } = req.body;

  if (!mensaje || !mensaje.trim()) {
    return res.status(400).json({ message: "Falta el mensaje" });
  }

  try {
    const contexto = await armarContexto(req.user);

    const system = `Sos el asistente virtual de la Plataforma de Inscripciones del instituto.
Respondés en español rioplatense (usás "vos"), de forma corta, clara y amable.
Estás hablando con ${req.user.nombre}, que tiene rol de ${req.user.rol}.
Usá SOLO los datos de abajo para responder sobre materias, horarios, profesores, correlativas, inscripciones y notas.
Si algo no está en los datos, decí que no tenés esa información. No inventes nada.
Para contar aprobados, desaprobados o alumnos, copiá los números del RESUMEN YA CALCULADO, no hagas cuentas vos.
Si te preguntan cosas que no tienen que ver con la plataforma o el estudio, decí amablemente que solo podés ayudar con temas de la plataforma.

${contexto}`;

    const mensajes = [
      { role: "system", content: system },
      ...historial.slice(-8).filter((m) => m.role === "user" || m.role === "assistant"),
      { role: "user", content: mensaje },
    ];

    const respuesta = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({ model: AI_MODEL, messages: mensajes, temperature: 0.1 }),
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      console.error("Error de la IA:", respuesta.status, detalle);
      const msg = respuesta.status === 404
        ? "La IA todavía se está descargando, probá de nuevo en unos minutos."
        : "La IA no pudo responder, probá de nuevo.";
      return res.status(503).json({ message: msg });
    }

    const data = await respuesta.json();
    res.json({ respuesta: data.choices[0].message.content });
  } catch (err) {
    console.error("Error en /chat:", err);
    res.status(500).json({ message: "No me pude conectar con la IA, probá de nuevo en un rato." });
  }
});

module.exports = app;
