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
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(50, "Full name must be under 50 characters")
      .regex(
        /^[a-zA-Z'-]+(?:\s[a-zA-Z'-]+)*$/,
        "Only letters, spaces, hyphens, and apostrophes allowed",
      ),
    password: baseFields.password
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: baseFields.email,
});

export const resetPasswordSchema = z
  .object({
    password: baseFields.password
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const inviteSignupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(50, "Full name must be under 50 characters")
      .regex(
        /^[a-zA-Z'-]+(?:\s[a-zA-Z'-]+)*$/,
        "Only letters, spaces, hyphens, and apostrophes allowed",
      ),
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
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type InviteSignupFormValues = z.infer<typeof inviteSignupSchema>;
