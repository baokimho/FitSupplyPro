import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, requireGatewaySecret } from "@shared/utils";
import categoryRoutes from "./routes/categories.route.js";
import brandRoutes from "./routes/brands.route.js";
import productRoutes from "./routes/products.route.js";
import { connectDb } from "./config/connect-db.js";

dotenv.config();

if (!process.env.GATEWAY_SECRET) {
  throw new Error("GATEWAY_SECRET is not set");
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(requireGatewaySecret);
app.use(categoryRoutes);
app.use(brandRoutes);
app.use(productRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3002;

async function bootstrap() {
  try {
    await connectDb();

    app.listen(PORT, () => {
      console.log(`Catalog service running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start catalog service:", err);
    process.exitCode = 1;
  }
}

void bootstrap();
