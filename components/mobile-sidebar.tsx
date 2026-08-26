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
import { ReactNode } from "react";
import { Logo } from "./logo";
import { Separator } from "./ui/separator";
import { navItems } from "@/lib/navigation";

export default function MobileSidebar({ children }: { children: ReactNode }) {
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
          <DrawerClose asChild>
            <Link href="/" className="text-xl uppercase">
              Home
            </Link>
          </DrawerClose>

          <Separator />

          {navItems.map((item) => (
            <div key={item.href} className="flex flex-col gap-5">
              <DrawerClose asChild>
                <Link className="text-xl uppercase" href={item.href}>
                  {item.label}
                </Link>
              </DrawerClose>

              <Separator />
            </div>
          ))}

          <DrawerClose asChild>
            <Link
              className="flex items-center gap-2 text-xl uppercase"
              href="/auth"
            >
              Sign In
              <LogIn />
            </Link>
          </DrawerClose>
        </div>

        <DrawerFooter />
      </DrawerContent>
    </Drawer>
  );
}
