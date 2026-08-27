import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth");
  }

  return (
    <div className="flex w-full flex-col items-center gap-2 px-4 py-10">
      <h1 className="text-3xl font-heading uppercase">Dashboard</h1>
      <p className="text-foreground/80">Welcome back, {session.user.name}.</p>
    </div>
  );
}
