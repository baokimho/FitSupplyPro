import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "order-service",
    status: "ok",
  });
});

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});