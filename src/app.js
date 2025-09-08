import express from "express";
import cors from "cors";

const app = express();

//? BASIC CONFIGURATION
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

//? CORES CONFIGURATION
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "https://localhost:5173",
    credentials:true,
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTION"],
    allowedHeaders:["Authorization","Content-Type"],
  }),
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

export default app;
