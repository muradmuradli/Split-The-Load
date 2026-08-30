"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { createFlat } from "@/lib/flats";

export async function createFlatAction(formData: FormData) {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  if (!session) {
    redirect("/auth");
  }

  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const invitedEmails = formData
    .getAll("email")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!name || !city) {
    throw new Error("Flat name and city are required.");
  }

  // Match the host that actually served this request (same signal
  // better-auth's own trustedProxyHeaders baseURL resolution uses) so
  // invite links don't drift to a stale BETTER_AUTH_URL on preview deploys.
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${protocol}://${host}` : undefined;

  await createFlat({
    name,
    city,
    creatorUserId: session.user.id,
    invitedEmails,
    origin,
  });

  redirect("/dashboard");
}
