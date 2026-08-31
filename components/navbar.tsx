import { Menu } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { Logo } from "./logo";
import MobileSidebar from "./mobile-sidebar";
import { NavbarLinks } from "./navbar-links";
import { Button } from "./ui/button";
import { auth } from "@/lib/auth";

const Navbar = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  const isSignedIn = !!session;

  return (
    <div className="sticky top-0 z-50 border-b-4 border-b-slate-900 bg-background py-5 flex justify-center">
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
        <NavbarLinks isSignedIn={isSignedIn} />
        <MobileSidebar isSignedIn={isSignedIn}>
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
