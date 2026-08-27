import { Scale } from "lucide-react";

import { cn } from "@/lib/utils";

function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 transition shrink-0 items-center justify-center rounded-base border-2 border-border bg-red-400 text-main-foreground shadow-shadow",
        className,
      )}
    >
      <Scale className="size-5" strokeWidth={2} />
    </span>
  );
}

export { Logo };
