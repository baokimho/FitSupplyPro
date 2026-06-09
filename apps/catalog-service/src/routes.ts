import { Router } from "express";

import { validateRequest, wrapAsync } from "@shared/utils";
import { createCategorySchema } from "./validations/category.schema.js";
import { createCatalog } from "./controllers/catalog.controller.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    service: "catalog-service",
    status: "ok",
  });
});

router.post("/", validateRequest(createCategorySchema), wrapAsync(createCatalog))

export default router;
