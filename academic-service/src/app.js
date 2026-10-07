const express = require("express");
const cors = require("cors");
require("dotenv").config();
const inscripcionesRoutes = require("./routes/inscripciones");

const materiasRoutes = require("./routes/materias");
const profesorRoutes = require("./routes/profesor");
const adminRoutes = require("./routes/admin");
const motorRoutes = require("./routes/motor");
const finalesRoutes = require("./routes/finales");

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
app.use("/motor", motorRoutes);
app.use("/finales", finalesRoutes);

module.exports = app;