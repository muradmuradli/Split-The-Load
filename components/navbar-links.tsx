"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { navItems } from "@/lib/navigation";
import { Button } from "./ui/button";
import { SignOutButton } from "./sign-out-button";

function useIsActivePath(href: string) {
  const pathname = usePathname();
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const NavbarButton = ({
  target,
  children,
  className,
  trackActive = true,
}: {
  target: string;
  children: ReactNode;
  className?: string;
  /** Sign In is an entry-point action, not a "current section" — like Sign Out, it never shows active. */
  trackActive?: boolean;
}) => {
  const isActive = useIsActivePath(target) && trackActive;

  return (
    <Button
      className={cn(
        "bg-white font-bold hover:bg-amber-300",
        className,
        isActive && "bg-blue-400 hover:bg-blue-400",
      )}
      variant="noShadow"
      asChild
    >
      <Link href={target}>{children}</Link>
    </Button>
  );
};

export function NavbarLinks({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <div className="hidden xl:flex items-center gap-2 uppercase text-lg">
      <NavbarButton target="/">Home</NavbarButton>
      {isSignedIn &&
        navItems.map((item) => (
          <NavbarButton key={item.href} target={item.href}>
            {item.label}
          </NavbarButton>
        ))}

      {isSignedIn ? (
        <SignOutButton className="bg-red-400 font-bold hover:bg-amber-300" />
      ) : (
        <NavbarButton
          target="/auth"
          trackActive={false}
          className="bg-red-400 font-bold hover:bg-amber-300"
        >
          <LogIn />
          Sign In
        </NavbarButton>
      )}
    </div>
  );
}
