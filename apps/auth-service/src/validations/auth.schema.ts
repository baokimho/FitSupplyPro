import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Please enter your password")
})

export const registerSchema = z.object({
    name: z.string().min(3, "Please enter your name"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Please enter your password")    
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
