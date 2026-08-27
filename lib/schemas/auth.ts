import { z } from "zod";

const baseFields = {
  email: z
    .email("Please enter a valid email address")
    .min(5, "Email must be at least 5 characters")
    .max(254, "Email is too long"),
  password: z.string().min(8, "Password must be at least 8 characters"),
};

export const signinSchema = z.object(baseFields);

export const signupSchema = z
  .object({
    ...baseFields,
    fullName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(25, "First name must be under 25 characters")
      .regex(/^[a-zA-Z'-]+$/, "Only letters, hyphens, and apostrophes allowed"),
    password: baseFields.password
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SigninFormValues = z.infer<typeof signinSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
