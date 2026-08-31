import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getUserFlatsWithMembers } from "@/lib/flats";
import { getFlatTasks } from "@/lib/tasks";
import { Card, CardContent } from "@/components/ui/card";
import { MemberDetail } from "./member-detail";

export const metadata: Metadata = {
  title: "Flatmate profile — Split the Load",
  description: "See a flatmate's effort load and every chore currently assigned to them.",
};

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/auth");
  }

  const { membershipId } = await params;
  const flats = await getUserFlatsWithMembers(session.user.id);
  const activeFlat = flats.find((f) => f.members.some((m) => m.id === membershipId));
  const targetMember = activeFlat?.members.find((m) => m.id === membershipId);

  if (!activeFlat || !targetMember || targetMember.status !== "verified") {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4">
        <Card className="bg-red-400">
          <CardContent>
            <h1 className="text-3xl text-foreground">No such flatmate</h1>
            <p className="mt-2 font-bold text-foreground">
              They may have been removed from the flat, or never joined.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block w-fit border-2 border-border bg-white px-4 py-2 text-sm font-extrabold uppercase shadow-shadow hover:bg-amber-300"
            >
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const myMembership = activeFlat.members.find((m) => m.userId === session.user.id);
  const isAdmin = myMembership?.role === "admin";
  const canDelete = isAdmin && targetMember.userId !== session.user.id;

  const flatTasks = await getFlatTasks(activeFlat.id);
  const assignedTasks = flatTasks
    .filter((t) => t.assigneeMembershipId === membershipId)
    .map((t) => ({
      id: t.id,
      name: t.name,
      effort: t.effort,
      effortPoints: t.effortPoints,
      status: t.status,
      dueDate: t.dueDate,
    }));

  return (
    <MemberDetail
      flatName={activeFlat.name}
      member={targetMember}
      assignedTasks={assignedTasks}
      canDelete={canDelete}
    />
  );
}
