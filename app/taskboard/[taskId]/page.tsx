import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getUserFlatsWithMembers } from "@/lib/flats";
import { getTaskById, pickAutoAssignee } from "@/lib/tasks";
import { TaskDetail } from "./task-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ taskId: string }>;
}): Promise<Metadata> {
  const { taskId } = await params;
  const task = await getTaskById(taskId);
  return {
    title: task ? `${task.name} — Split the Load` : "Task — Split the Load",
  };
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/auth");
  }

  const { taskId } = await params;
  const task = await getTaskById(taskId);
  if (!task) {
    notFound();
  }

  const flats = await getUserFlatsWithMembers(session.user.id);
  const activeFlat = flats.find((f) => f.id === task.flatId);
  if (!activeFlat) {
    // Not a member of this task's flat.
    redirect("/dashboard");
  }

  let autoSuggestName: string | null = null;
  if (!task.assigneeMembershipId) {
    const suggestedId = await pickAutoAssignee(task.flatId, task.id);
    const suggested = activeFlat.members.find((m) => m.id === suggestedId);
    autoSuggestName = suggested ? (suggested.name ?? suggested.email) : null;
  }

  const members = activeFlat.members
    .filter((m) => m.status === "verified")
    .map((m) => ({ id: m.id, name: m.name, email: m.email, image: m.image }));

  return (
    <TaskDetail
      flatName={activeFlat.name}
      autoSuggestName={autoSuggestName}
      members={members}
      task={{
        id: task.id,
        name: task.name,
        description: task.description,
        effort: task.effort,
        effortPoints: task.effortPoints,
        status: task.status,
        isRecurring: task.isRecurring,
        recurrenceIntervalDays: task.recurrenceIntervalDays,
        dueDate: task.dueDate,
        assignee: task.assignee
          ? {
              id: task.assignee.id,
              name: task.assignee.user?.name ?? null,
              email: task.assignee.email,
              image: task.assignee.user?.image ?? null,
            }
          : null,
      }}
    />
  );
}
