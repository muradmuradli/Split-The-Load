"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { createTask, EFFORT_LEVELS, type Effort } from "@/lib/tasks";

function isEffort(value: string): value is Effort {
  return (EFFORT_LEVELS as readonly string[]).includes(value);
}

export async function createTaskAction(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/auth");
  }

  const flatId = String(formData.get("flatId") ?? "");
  const name = String(formData.get("name") ?? "");
  const description = String(formData.get("description") ?? "");
  const effort = String(formData.get("effort") ?? "");
  const dueDate = String(formData.get("dueDate") ?? "");
  const assignee = String(formData.get("assignee") ?? "auto");

  if (!flatId) throw new Error("Missing flat.");
  if (!isEffort(effort)) throw new Error("Invalid effort level.");

  await createTask({
    flatId,
    name,
    description,
    effort,
    dueDate,
    assigneeMembershipId: assignee === "auto" ? "auto" : assignee,
    creatorUserId: session.user.id,
  });

  redirect("/dashboard");
}
