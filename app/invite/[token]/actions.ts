"use server";

import { redirect } from "next/navigation";

import { inviteSignupSchema } from "@/lib/schemas/auth";
import { completeInviteSignup } from "@/lib/flats";

export async function completeInviteSignupAction(
  token: string,
  values: { fullName: string; password: string; confirmPassword: string },
) {
  const parsed = inviteSignupSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  const result = await completeInviteSignup({
    token,
    name: parsed.data.fullName,
    password: parsed.data.password,
  });

  if (result.status !== "success") {
    return { error: "This invite link is no longer valid." };
  }

  redirect("/auth?joined=true");
}
