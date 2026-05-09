import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "catalog-service",
    status: "ok",
  });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Catalog service running on port ${PORT}`);
});