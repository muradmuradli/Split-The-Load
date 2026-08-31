import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getUserFlatsWithMembers } from "@/lib/flats";
import { getFlatCompletions } from "@/lib/tasks";
import { HistoryList, type HistoryEntry } from "./history-list";

export const metadata: Metadata = {
  title: "History — Split the Load",
  description: "Every completed chore, who did it, and when.",
};

export default async function HistoryPage({
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

  const completions = await getFlatCompletions(activeFlat.id);

  const entries: HistoryEntry[] = completions.map((c) => ({
    id: c.id,
    taskId: c.taskId,
    taskName: c.task.name,
    effort: c.task.effort,
    effortPointsAtCompletion: c.effortPointsAtCompletion,
    effortRating: c.effortRating,
    createdAt: c.task.createdAt,
    completedAt: c.completedAt,
    completedBy: {
      id: c.completedByUser.id,
      name: c.completedByUser.name,
      email: c.completedByUser.email,
      image: c.completedByUser.image,
    },
  }));

  return <HistoryList flatName={activeFlat.name} entries={entries} />;
}
