"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant="noShadow"
      className={cn("bg-white font-bold hover:bg-amber-300", className)}
      onClick={handleSignOut}
    >
      <LogOut />
      Sign Out
    </Button>
  );
}
