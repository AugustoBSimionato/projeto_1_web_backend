require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const { logError } = require("./utils/logger");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5500",
    credentials: true,
  })
);
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log("Body:", req.body);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/nuvy")
  .then(() => console.log("Conectado ao MongoDB"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

const postRoutes = require("./routes/posts");
app.use("/api/posts", postRoutes);

const userRoutes = require("./routes/users");
app.use("/api/users", userRoutes);

const commentRoutes = require('./routes/comments');
app.use('/api/comments', commentRoutes);

app.get("/api/test", (req, res) => {
  res.json({ message: "API funcionando!" });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  logError(err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
