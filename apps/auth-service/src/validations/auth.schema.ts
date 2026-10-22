import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().max(254).email("Invalid email"),
    password: z.string().min(1).max(128).refine(value => value.trim().length > 0, "Password must not be blank")
})

export const registerSchema = z.object({
    name: z.string().trim().min(3, "Please enter your name").max(100),
    email: z.string().trim().toLowerCase().max(254).email("Invalid email"),
    password: z.string().min(12, "Password must contain at least 12 characters").max(128).refine(value => value.trim().length > 0, "Password must not be blank")
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

export const refreshSchema = z.object({ refreshToken: z.string().min(1).max(8192) });
export const logoutSchema = z.object({ refreshToken: z.string().min(1).max(8192).optional() });
