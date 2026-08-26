import { LogIn, Menu } from "lucide-react";
import Link from "next/link";
import { Logo } from "./logo";
import MobileSidebar from "./mobile-sidebar";
import { Button } from "./ui/button";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/navigation";

const NavbarButton = ({
  target,
  children,
  className,
}: {
  target: string;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <Button
      className={cn("bg-white font-bold hover:bg-amber-300", className)}
      variant="noShadow"
      asChild
    >
      <Link href={target}>{children}</Link>
    </Button>
  );
};

const Navbar = () => {
  return (
    <div className="border-b-4 border-b-slate-900 py-5 flex justify-center">
      <div className="flex w-11/12 items-center justify-between md:w-10/12 xl:w-8/12">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2 whitespace-nowrap"
        >
          <Logo className="group-hover:translate-x-boxShadowX group-hover:translate-y-boxShadowY group-hover:shadow-none" />
          <span className="hidden sm:inline text-xl font-heading uppercase ml-1">
            Split the Load
          </span>
        </Link>
        <div className="hidden xl:flex items-center gap-2 uppercase text-lg">
          {navItems.map((item) => (
            <NavbarButton key={item.href} target={item.href}>
              {item.label}
            </NavbarButton>
          ))}

          <NavbarButton
            target={"/sign-in"}
            className="bg-red-400 font-bold hover:bg-amber-300"
          >
            <LogIn />
            Sign In
          </NavbarButton>
        </div>
        <MobileSidebar>
          <Button
            className="border-none bg-transparent xl:hidden"
            size="icon"
            variant="noShadow"
          >
            <Menu className="size-8" />
          </Button>
        </MobileSidebar>
      </div>
    </div>
  );
};

export default Navbar;
