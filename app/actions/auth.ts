"use server";

import { signinSchema, signupSchema } from "@/lib/schemas/auth";

export type AuthState = {
  success: boolean;
  errors?: {
    formError?: string[];
    [field: string]: string[] | undefined;
  };
  message?: string;
};

export async function signup(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const result = signupSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  const taken = await checkEmailExists(result.data.email);
  if (taken) {
    return {
      success: false,
      errors: { email: ["Email is already taken"] },
    };
  }

  // await createUser(result.data);
  return { success: true, message: "Account created!" };
}

export async function signin(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const result = signinSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  // const user = await verifyCredentials(result.data);
  // if (!user) return { success: false, errors: { formError: ["Invalid email or password"] } };

  return {
    success: false,
    errors: { formError: ["Invalid email or password"] },
  };
}

async function checkEmailExists(username: string) {
  return username === "admin@gmail.com";
}
