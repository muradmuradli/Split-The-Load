"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Flat = { id: string; name: string };

export function FlatsBar({
  flats,
  activeFlatId,
  onSelect,
}: {
  flats: Flat[];
  activeFlatId: string | undefined;
  onSelect: (flatId: string) => void;
}) {
  return (
    <section className="flex flex-col gap-2 border-2 border-border bg-secondary-background p-4 shadow-shadow">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-extrabold uppercase">Your flats</span>
        {flats.map((flat) => (
          <button
            key={flat.id}
            type="button"
            onClick={() => onSelect(flat.id)}
            className={cn(
              "border-2 border-border px-3 py-2 text-sm font-extrabold uppercase",
              flat.id === activeFlatId ? "bg-blue-400" : "bg-white hover:bg-amber-300",
            )}
          >
            {flat.name}
          </button>
        ))}
        <Button asChild variant="noShadow" size="sm" className="bg-red-400 font-bold uppercase">
          <Link href="/flats/new">+ New flat</Link>
        </Button>
      </div>
    </section>
  );
}
