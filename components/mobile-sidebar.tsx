"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Logo } from "./logo";
import { SignOutButton } from "./sign-out-button";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/navigation";

function useIsActivePath(href: string) {
  const pathname = usePathname();
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MobileNavLink({ href, children }: { href: string; children: ReactNode }) {
  const isActive = useIsActivePath(href);

  return (
    <DrawerClose asChild>
      <Link
        href={href}
        className={cn(
          "w-fit border-2 px-3 py-2 text-xl font-bold uppercase",
          isActive ? "border-border bg-blue-400" : "border-transparent",
        )}
      >
        {children}
      </Link>
    </DrawerClose>
  );
}

export default function MobileSidebar({
  children,
  isSignedIn,
}: {
  children: ReactNode;
  isSignedIn: boolean;
}) {
  return (
    <Drawer direction="right" autoFocus>
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent>
        <DrawerHeader className="flex justify-between">
          <DrawerTitle>
            <Logo />
          </DrawerTitle>

          <DrawerClose className="absolute right-5" asChild>
            <Button variant="neutral">X</Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="mt-5 flex flex-col gap-5 overflow-y-auto px-4 text-sm">
          <MobileNavLink href="/">Home</MobileNavLink>

          <Separator />

          {isSignedIn &&
            navItems.map((item) => (
              <div key={item.href} className="flex flex-col gap-5">
                <MobileNavLink href={item.href}>{item.label}</MobileNavLink>

                <Separator />
              </div>
            ))}

          {isSignedIn ? (
            <DrawerClose asChild>
              <SignOutButton className="w-full" />
            </DrawerClose>
          ) : (
            <DrawerClose asChild>
              <Link
                className="flex items-center gap-2 text-xl uppercase"
                href="/auth"
              >
                Sign In
                <LogIn />
              </Link>
            </DrawerClose>
          )}
        </div>

        <DrawerFooter />
      </DrawerContent>
    </Drawer>
  );
}
