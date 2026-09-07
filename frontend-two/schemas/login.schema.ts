import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
