const express = require("express");
const cors = require("cors");
require("dotenv").config();
const inscripcionesRoutes = require("./routes/inscripciones");

const materiasRoutes = require("./routes/materias");
const profesorRoutes = require("./routes/profesor");
const adminRoutes = require("./routes/admin");

const app = express();
app.disable('etag');

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Academic service funcionando ");
});
app.use("/inscripciones", inscripcionesRoutes);
app.use("/profesores", profesorRoutes);

app.use("/admin", adminRoutes);

app.use("/materias", materiasRoutes);

module.exports = app;