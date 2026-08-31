import Link from "next/link";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isSignedIn = !!session;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-6">
      <section className="border-2 border-border bg-blue-400 p-8 shadow-shadow md:p-12">
        <Badge className="w-fit bg-white text-xs font-bold uppercase">Fair chores, finally</Badge>
        <h1 className="mt-4 text-5xl md:text-7xl">Split the Load</h1>
        <p className="mt-4 max-w-2xl text-lg font-semibold md:text-xl">
          Chores aren&apos;t equal — scrubbing the bathroom isn&apos;t the same as taking out the
          trash. Split the Load scores every task by effort, not headcount, so your flat can
          actually agree on who&apos;s pulling their weight.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Button asChild className="bg-red-400 text-lg font-bold uppercase">
            <Link href={isSignedIn ? "/dashboard" : "/auth"}>
              {isSignedIn ? "Go to dashboard" : "Get started free"}
            </Link>
          </Button>
          {!isSignedIn && (
            <Button asChild variant="noShadow" className="bg-white text-lg font-bold uppercase">
              <Link href="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <Card className="bg-lime-300">
          <CardContent>
            <p className="text-xs font-extrabold uppercase">Create a flat</p>
            <h2 className="mt-2 text-2xl">Invite your housemates</h2>
            <p className="mt-2 text-sm font-bold">
              Set up your flat and invite everyone by email. They join with one click — no
              spreadsheets, no group chat chaos.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-amber-300">
          <CardContent>
            <p className="text-xs font-extrabold uppercase">Assign by effort</p>
            <h2 className="mt-2 text-2xl">Quick, Medium, or Heavy</h2>
            <p className="mt-2 text-sm font-bold">
              Every chore gets tagged by how much work it actually takes, assigned to a person —
              or auto-assigned to whoever&apos;s carrying the least.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-red-400">
          <CardContent>
            <p className="text-xs font-extrabold uppercase">Self-correcting scores</p>
            <h2 className="mt-2 text-2xl">Recurring tasks that learn</h2>
            <p className="mt-2 text-sm font-bold">
              Rate a repeating chore &quot;harder&quot; or &quot;easier&quot; than expected and its
              score quietly drifts toward reality over time — no manual tuning required.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="border-2 border-border bg-secondary-background p-8 text-center shadow-shadow">
        <h2 className="text-3xl md:text-4xl">Stop guessing who does more.</h2>
        <p className="mt-3 text-base font-semibold text-foreground/70">
          It takes two minutes to set up a flat and start tracking effort fairly.
        </p>
        <Button asChild className="mt-6 bg-blue-400 text-lg font-bold uppercase">
          <Link href={isSignedIn ? "/dashboard" : "/auth"}>
            {isSignedIn ? "Go to dashboard" : "Create your flat"}
          </Link>
        </Button>
      </section>
    </div>
  );
}
