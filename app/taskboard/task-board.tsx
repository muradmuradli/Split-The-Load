"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EFFORT_COLORS,
  EFFORT_LABELS,
  EFFORT_POINTS,
  STATUS_COLORS,
  type Effort,
  type TaskMember,
} from "@/lib/effort";
import { getAvatarColor, getInitials } from "@/lib/utils";
import { deleteTaskAction } from "./actions";

const FILTERS = ["All", "To Do", "Done", "Unassigned"] as const;
type Filter = (typeof FILTERS)[number];

export type TaskBoardItem = {
  id: string;
  name: string;
  effort: Effort;
  status: "todo" | "done";
  dueDate: string | null;
  assignee: TaskMember | null;
};

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return null;
  return new Date(`${dueDate}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function TaskBoard({ flatName, tasks }: { flatName: string; tasks: TaskBoardItem[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [optimisticTasks, removeOptimisticTask] = useOptimistic(
    tasks,
    (state: TaskBoardItem[], taskId: string) => state.filter((t) => t.id !== taskId),
  );
  const [, startTransition] = useTransition();

  function handleDelete(taskId: string) {
    startTransition(async () => {
      removeOptimisticTask(taskId);
      const result = await deleteTaskAction(taskId);
      if ("error" in result) toast.error(result.error);
    });
  }

  const visible = optimisticTasks.filter((t) => {
    if (filter === "All") return true;
    if (filter === "Unassigned") return !t.assignee;
    if (filter === "To Do") return t.status === "todo";
    return t.status === "done";
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl">Task board</h1>
          <p className="mt-2 text-base font-semibold text-foreground/70">
            {optimisticTasks.length} {optimisticTasks.length === 1 ? "chore" : "chores"} for{" "}
            {flatName} · effort points shown per task
          </p>
        </div>
        <Button asChild className="bg-lime-300 font-bold uppercase text-foreground">
          <Link href="/add-task">+ Add task</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        {FILTERS.map((f) => (
          <Button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "bg-red-400 font-bold uppercase"
                : "bg-white font-bold uppercase text-foreground hover:bg-amber-300"
            }
          >
            {f}
          </Button>
        ))}
      </div>

      <Table className="bg-white">
        <TableHeader>
          <TableRow className="bg-secondary-background text-foreground hover:bg-secondary-background">
            <TableHead className="uppercase">Task</TableHead>
            <TableHead className="uppercase">Effort</TableHead>
            <TableHead className="uppercase">Assigned</TableHead>
            <TableHead className="uppercase">Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((t) => {
            const due = formatDueDate(t.dueDate);
            return (
              <TableRow
                key={t.id}
                className="relative bg-white text-foreground hover:bg-amber-300"
              >
                <TableCell>
                  <Link
                    href={`/taskboard/${t.id}`}
                    className="absolute inset-0 z-10"
                    aria-label={t.name}
                  />
                  <p className="text-lg font-extrabold">{t.name}</p>
                  {due && <p className="text-sm font-semibold text-foreground/70">Due {due}</p>}
                </TableCell>
                <TableCell>
                  <Badge className={`${EFFORT_COLORS[t.effort]} text-sm font-bold text-foreground`}>
                    {EFFORT_LABELS[t.effort]} · {EFFORT_POINTS[t.effort]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {t.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
                        {t.assignee.image && (
                          <AvatarImage
                            src={t.assignee.image}
                            alt={t.assignee.name ?? t.assignee.email}
                          />
                        )}
                        <AvatarFallback
                          className={`${getAvatarColor(t.assignee.id)} text-sm font-bold text-foreground`}
                        >
                          {t.assignee.name
                            ? getInitials(t.assignee.name)
                            : t.assignee.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-bold">
                        {(t.assignee.name ?? t.assignee.email).split(" ")[0]}
                      </span>
                    </div>
                  ) : (
                    <Badge variant="neutral" className="text-sm font-bold">
                      Unassigned
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={`${STATUS_COLORS[t.status]} text-sm font-bold text-foreground`}>
                    {t.status === "done" ? "Done" : "To Do"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    size="icon"
                    onClick={() => handleDelete(t.id)}
                    aria-label={`Delete ${t.name}`}
                    className="relative z-20 bg-red-400 hover:bg-red-500"
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {visible.length === 0 && <p className="px-4 py-6 font-bold">Nothing here. Suspiciously clean.</p>}
    </div>
  );
}
