import { Request, Response } from "express"
import { createCategorySchema} from "../validations/category.schema.js";
import type { CategoryInput } from "../validations/category.schema.js";
import prisma from "../config/db.js";

export const createCatalog = async (req: Request, res: Response) => {
    const body = req.body as CategoryInput;
    const category = await prisma.category.create({
      data: body,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
}