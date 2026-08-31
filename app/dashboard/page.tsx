import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getUserFlatsWithMembers } from "@/lib/flats";
import { getOpenTaskStats, getRecentCompletions } from "@/lib/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth");
  }

  const flats = await getUserFlatsWithMembers(session.user.id);

  if (flats.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <div>
          <h1 className="text-3xl font-heading uppercase">Dashboard</h1>
          <p className="mt-1 text-foreground/80">Welcome back, {session.user.name}.</p>
        </div>

        <Card className="bg-amber-300">
          <CardHeader className="gap-2">
            <Badge className="w-fit bg-white text-xs font-bold uppercase">No flats</Badge>
            <CardTitle className="text-2xl sm:text-3xl">You&apos;re not in a flat yet</CardTitle>
            <CardDescription className="text-foreground/80">
              Join a flat using an invite link from a housemate, or create your own flat and
              invite people.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-blue-400 font-bold uppercase">
              <Link href="/flats/new">+ Add flat</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recentCompletionsByFlatId = Object.fromEntries(
    await Promise.all(
      flats.map(async (f) => [f.id, await getRecentCompletions(f.id)] as const),
    ),
  );

  const openTaskStatsByFlatId = Object.fromEntries(
    await Promise.all(flats.map(async (f) => [f.id, await getOpenTaskStats(f.id)] as const)),
  );

  return (
    <Suspense>
      <DashboardContent
        flats={flats}
        currentUserId={session.user.id}
        recentCompletionsByFlatId={recentCompletionsByFlatId}
        openTaskStatsByFlatId={openTaskStatsByFlatId}
      />
    </Suspense>
  );
}
