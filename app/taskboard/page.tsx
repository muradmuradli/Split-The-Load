import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getUserFlatsWithMembers } from "@/lib/flats";
import { getFlatTasks } from "@/lib/tasks";
import { TaskBoard, type TaskBoardItem } from "./task-board";

export const metadata: Metadata = {
  title: "Task Board — Split the Load",
  description:
    "Every household chore tagged Quick, Medium or Heavy, with who owns it and what's left to do.",
  openGraph: {
    title: "Task Board — Split the Load",
    description: "Chores tagged by effort level, assignee and status.",
  },
};

export default async function TaskBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ flat?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/auth");
  }

  const flats = await getUserFlatsWithMembers(session.user.id);
  if (flats.length === 0) {
    redirect("/dashboard");
  }

  const { flat: requestedFlatId } = await searchParams;
  const activeFlat = flats.find((f) => f.id === requestedFlatId) ?? flats[0]!;

  const tasks = await getFlatTasks(activeFlat.id);

  const items: TaskBoardItem[] = tasks.map((t) => ({
    id: t.id,
    name: t.name,
    effort: t.effort,
    effortPoints: t.effortPoints,
    status: t.status,
    dueDate: t.dueDate,
    isRecurring: t.isRecurring,
    assignee: t.assignee
      ? {
          id: t.assignee.id,
          name: t.assignee.user?.name ?? null,
          email: t.assignee.email,
          image: t.assignee.user?.image ?? null,
        }
      : null,
  }));

  return <TaskBoard flatName={activeFlat.name} tasks={items} />;
}
