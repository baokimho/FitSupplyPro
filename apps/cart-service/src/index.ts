import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, requireGatewaySecret } from "@shared/utils";
import { connectDb } from "./config/connect-db.js";
import { attachCartUser } from "./middleware/user-context.middleware.js";
import cartRoutes from "./routes/cart.route.js";

dotenv.config();

if (!process.env.GATEWAY_SECRET) {
  throw new Error("GATEWAY_SECRET is not set");
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(requireGatewaySecret);
app.get("/health", (_req, res) => {
  res.json({
    service: "cart-service",
    status: "ok",
  });
});
app.use((req, _res, next) => {
  console.info("[CART SERVICE]", {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    hasUserIdHeader: Boolean(req.get("x-user-id")),
  });
  next();
});
app.use(attachCartUser);
app.use(cartRoutes);

app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3005;

async function bootstrap() {
  try {
    await connectDb();

    app.listen(PORT, () => {
      console.log(`Cart service running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start cart service:", err);
    process.exitCode = 1;
  }
}

void bootstrap();
