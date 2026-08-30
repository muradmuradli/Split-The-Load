import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveInvite } from "@/lib/flats";
import { InviteSignupForm } from "./invite-signup-form";

export const metadata: Metadata = {
  title: "Join a flat — Split the Load",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await resolveInvite(token);

  return (
    <div className="mx-auto flex w-full flex-col items-center gap-6 px-4 xl:py-5 sm:w-[80%] sm:gap-8 md:w-[60%] lg:w-[40%] xl:w-[27%]">
      <Card className="w-full bg-blue-400">
        <CardHeader className="gap-2">
          <Badge className="w-fit bg-white text-xs font-bold uppercase">Invite</Badge>
          <CardTitle className="text-3xl sm:text-4xl">Join the flat</CardTitle>
        </CardHeader>
      </Card>

      <Card className="w-full">
        <CardContent className="flex flex-col gap-4">
          {result.status === "not_found" ||
          result.status === "expired" ||
          result.status === "already_used" ? (
            <>
              <p className="text-center text-sm text-foreground/80">
                {result.status === "expired"
                  ? "This invite link has expired."
                  : result.status === "already_used"
                    ? "This invite has already been used."
                    : "This invite link is invalid."}
              </p>
              <Link
                href="/"
                className="text-center text-xs font-bold uppercase text-foreground/70 underline"
              >
                Back to home
              </Link>
            </>
          ) : result.status === "linked_existing_user" ? (
            <>
              <CardDescription className="text-center">
                You&apos;ve joined <span className="font-bold">{result.flat.name}</span>. Sign in
                to see your flat.
              </CardDescription>
              <Button asChild className="w-full bg-blue-400 font-bold uppercase">
                <Link href="/auth">Sign in</Link>
              </Button>
            </>
          ) : (
            <>
              <CardDescription>
                You&apos;ve been invited to join{" "}
                <span className="font-bold">{result.invite.flat.name}</span>. Set a password to
                finish joining.
              </CardDescription>
              <InviteSignupForm token={token} email={result.invite.email} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
