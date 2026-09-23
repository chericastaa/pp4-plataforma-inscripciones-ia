const express = require("express");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const { login } = require("./controllers/userController");

const app = express();
app.disable('etag');

app.use(cors());
app.use(express.json());

app.post("/acceso", login);
app.use("/usuarios", userRoutes);

app.get("/", (req, res) => res.send("API funcionando"));

module.exports = app;