"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { completeTask, deleteTask, updateTask } from "@/lib/tasks";
import type { EffortRating } from "@/lib/effort";

type ActionResult = { error: string } | { success: true };

export async function updateTaskAction(
  taskId: string,
  patch: {
    status?: "todo" | "done";
    assigneeMembershipId?: string | "unassigned";
    dueDate?: string | null;
  },
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not signed in." };

  try {
    await updateTask({ taskId, actorUserId: session.user.id, ...patch });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }

  revalidatePath("/taskboard");
  revalidatePath(`/taskboard/${taskId}`);
  return { success: true };
}

export async function completeTaskAction(
  taskId: string,
  effortRating: EffortRating | null,
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not signed in." };

  try {
    await completeTask({ taskId, actorUserId: session.user.id, effortRating });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }

  revalidatePath("/taskboard");
  revalidatePath(`/taskboard/${taskId}`);
  return { success: true };
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not signed in." };

  try {
    await deleteTask({ taskId, actorUserId: session.user.id });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }

  revalidatePath("/taskboard");
  return { success: true };
}
