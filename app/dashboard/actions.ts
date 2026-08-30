"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { inviteMemberToFlat, removeMembershipFromFlat } from "@/lib/flats";

type ActionResult = { error: string } | { success: true };

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not signed in.");
  return session;
}

async function currentOrigin() {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "https";
  return host ? `${protocol}://${host}` : undefined;
}

export async function sendInviteAction(flatId: string, email: string): Promise<ActionResult> {
  const session = await requireSession();
  const origin = await currentOrigin();

  try {
    await inviteMemberToFlat({ flatId, email, inviterUserId: session.user.id, origin });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeMemberAction(membershipId: string): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await removeMembershipFromFlat({ membershipId, actorUserId: session.user.id });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
