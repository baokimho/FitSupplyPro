import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { errorHandler, createGatewaySecretMiddleware } from "@shared/utils";
import categoryRoutes from "./routes/categories.route.js";
import brandRoutes from "./routes/brands.route.js";
import productRoutes from "./routes/products.route.js";
import { connectDb } from "./config/connect-db.js";



const app = express();

app.use(cors());
app.use(express.json());
app.use(createGatewaySecretMiddleware(config.gatewaySecret));
app.use(categoryRoutes);
app.use(brandRoutes);
app.use(productRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use(errorHandler);

const PORT = config.port;

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
