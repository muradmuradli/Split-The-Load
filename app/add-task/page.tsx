import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getUserFlatsWithMembers } from "@/lib/flats";
import { TaskForm } from "./task-form";

export const metadata: Metadata = {
  title: "Add a Task — Split the Load",
  description:
    "Create a new household chore with a name, description and effort level so the split stays fair.",
  openGraph: {
    title: "Add a Task — Split the Load",
    description: "Add a chore and tag how much effort it really takes.",
  },
};

export default async function AddTaskPage({
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

  return <TaskForm flat={activeFlat} />;
}
