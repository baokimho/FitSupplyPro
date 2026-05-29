import { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { wrapAsync } from "@shared/utils"

export const validateRequest = (schema: z.ZodTypeAny) => {
    return wrapAsync( async (req: Request, res: Response, next: NextFunction) => {
        await schema.parseAsync(req.body)
        next()
    })
}