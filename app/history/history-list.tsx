import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EFFORT_COLORS, EFFORT_LABELS, EFFORT_RATING_LABELS, type Effort, type EffortRating } from "@/lib/effort";
import { getAvatarColor, getInitials } from "@/lib/utils";

export type HistoryEntry = {
  id: string;
  taskId: string;
  taskName: string;
  effort: Effort;
  effortPointsAtCompletion: number;
  effortRating: EffortRating | null;
  createdAt: Date;
  completedAt: Date;
  completedBy: { id: string; name: string; email: string; image: string | null };
};

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const RATING_COLORS: Record<EffortRating, string> = {
  harder: "bg-red-400",
  easier: "bg-green-300",
  about_right: "bg-amber-300",
};

export function HistoryList({ flatName, entries }: { flatName: string; entries: HistoryEntry[] }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
      <div>
        <h1 className="text-4xl md:text-5xl">History</h1>
        <p className="mt-2 text-base font-semibold text-foreground/70">
          {entries.length} completed {entries.length === 1 ? "chore" : "chores"} for {flatName}
        </p>
      </div>

      <Table className="bg-white">
        <TableHeader>
          <TableRow className="bg-secondary-background text-foreground hover:bg-secondary-background">
            <TableHead className="uppercase">Task</TableHead>
            <TableHead className="uppercase">Completed by</TableHead>
            <TableHead className="uppercase">Created</TableHead>
            <TableHead className="uppercase">Completed</TableHead>
            <TableHead className="uppercase">Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="relative bg-white text-foreground hover:bg-amber-300">
              <TableCell>
                <Link
                  href={`/taskboard/${entry.taskId}`}
                  className="absolute inset-0 z-10"
                  aria-label={entry.taskName}
                />
                <p className="text-lg font-extrabold">{entry.taskName}</p>
                <Badge className={`mt-1 ${EFFORT_COLORS[entry.effort]} text-sm font-bold text-foreground`}>
                  {EFFORT_LABELS[entry.effort]} · {entry.effortPointsAtCompletion} pts
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="size-8">
                    {entry.completedBy.image && (
                      <AvatarImage src={entry.completedBy.image} alt={entry.completedBy.name} />
                    )}
                    <AvatarFallback
                      className={`${getAvatarColor(entry.completedBy.id)} text-sm font-bold text-foreground`}
                    >
                      {getInitials(entry.completedBy.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-bold">{entry.completedBy.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm font-semibold">{formatDate(entry.createdAt)}</TableCell>
              <TableCell className="text-sm font-semibold">{formatDate(entry.completedAt)}</TableCell>
              <TableCell>
                {entry.effortRating ? (
                  <Badge className={`${RATING_COLORS[entry.effortRating]} text-foreground`}>
                    {EFFORT_RATING_LABELS[entry.effortRating]}
                  </Badge>
                ) : (
                  <Badge variant="neutral">—</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {entries.length === 0 && (
        <p className="px-4 py-6 font-bold">
          Nothing completed yet — it&apos;ll show up here once you check something off.
        </p>
      )}
    </div>
  );
}
