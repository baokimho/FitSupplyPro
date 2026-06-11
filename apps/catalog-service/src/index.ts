import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { requireGatewaySecret } from "@shared/utils";
import categoryRoutes from "./routes/categories.route.js";
import productRoutes from "./routes/products.route.js";
import { connectDb } from "./config/connect-db.js";

dotenv.config();

if (!process.env.GATEWAY_SECRET) {
  throw new Error("GATEWAY_SECRET is not set");
}

const app = express();
await connectDb()
app.use(cors());
app.use(express.json());
app.use(requireGatewaySecret);
app.use(categoryRoutes);
app.use(productRoutes);

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Catalog service running on port ${PORT}`);
});
