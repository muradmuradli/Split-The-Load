"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  adjustEffortPoints,
  EFFORT_COLORS,
  EFFORT_LABELS,
  EFFORT_RATING_LABELS,
  EFFORT_RATINGS,
  STATUS_COLORS,
  type Effort,
  type EffortRating,
  type TaskMember,
} from "@/lib/effort";
import { formatDueDate, getAvatarColor, getInitials, parseISODate, toISODateString } from "@/lib/utils";
import { completeTaskAction, deleteTaskAction, updateTaskAction } from "../actions";

type Task = {
  id: string;
  name: string;
  description: string | null;
  effort: Effort;
  effortPoints: number;
  status: "todo" | "done";
  isRecurring: boolean;
  recurrenceIntervalDays: number | null;
  dueDate: string | null;
  assignee: TaskMember | null;
};

const RATING_COLORS: Record<EffortRating, string> = {
  harder: "bg-red-400",
  easier: "bg-green-300",
  about_right: "bg-amber-300",
};

const selectClass =
  "border-2 border-border bg-white px-3 py-2 text-sm font-bold outline-none focus:bg-amber-300";

export function TaskDetail({
  flatName,
  task,
  members,
  autoSuggestName,
}: {
  flatName: string;
  task: Task;
  members: TaskMember[];
  autoSuggestName: string | null;
}) {
  const [done, setDone] = useState(task.status === "done");
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [assignee, setAssignee] = useState<TaskMember | null>(task.assignee);
  const [dueDate, setDueDate] = useState<string | null>(task.dueDate);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    router.push("/taskboard");
    deleteTaskAction(task.id).then((result) => {
      if ("error" in result) toast.error(result.error);
    });
  }

  function handleMarkDone() {
    if (task.isRecurring) {
      // Reveal the rating prompt — nothing is persisted until a rating is
      // chosen, since the adjustment + next occurrence need it.
      setShowRatingPrompt(true);
      return;
    }
    setDone(true);
    startTransition(async () => {
      const result = await completeTaskAction(task.id, null);
      if ("error" in result) {
        toast.error(result.error);
        setDone(false);
        return;
      }
      toast.success("Task completed.");
    });
  }

  function handleMarkNotDone() {
    setDone(false);
    setShowRatingPrompt(false);
    startTransition(async () => {
      const result = await updateTaskAction(task.id, { status: "todo" });
      if ("error" in result) {
        toast.error(result.error);
        setDone(true);
      }
    });
  }

  function handleRate(rating: EffortRating) {
    setDone(true);
    setShowRatingPrompt(false);
    startTransition(async () => {
      const result = await completeTaskAction(task.id, rating);
      if ("error" in result) {
        toast.error(result.error);
        setDone(false);
        setShowRatingPrompt(true);
        return;
      }
      const nextPoints = adjustEffortPoints(task.effortPoints, rating);
      toast.success(
        task.recurrenceIntervalDays
          ? `Next occurrence scheduled in ${task.recurrenceIntervalDays} days at ${nextPoints} pts.`
          : "Task completed.",
      );
    });
  }

  function changeAssignee(membershipId: string) {
    const previous = assignee;
    const next = membershipId === "unassigned" ? null : (members.find((m) => m.id === membershipId) ?? null);
    setAssignee(next);
    startTransition(async () => {
      const result = await updateTaskAction(task.id, {
        assigneeMembershipId: membershipId === "unassigned" ? "unassigned" : membershipId,
      });
      if ("error" in result) {
        toast.error(result.error);
        setAssignee(previous);
      }
    });
  }

  function changeDueDate(date: Date | undefined) {
    const previous = dueDate;
    const next = date ? toISODateString(date) : null;
    setDueDate(next);
    setCalendarOpen(false);
    startTransition(async () => {
      const result = await updateTaskAction(task.id, { dueDate: next });
      if ("error" in result) {
        toast.error(result.error);
        setDueDate(previous);
      }
    });
  }

  const due = formatDueDate(dueDate, { long: true });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/taskboard"
            className="w-fit border-2 border-border bg-white px-3 py-2 text-sm font-extrabold uppercase shadow-shadow hover:bg-amber-300"
          >
            ← Task board
          </Link>
          <span className="text-sm font-bold uppercase text-foreground/70">For {flatName}</span>
        </div>
        <Button
          type="button"
          size="icon"
          onClick={handleDelete}
          aria-label={`Delete ${task.name}`}
          className="bg-red-400 hover:bg-red-400"
        >
          <Trash2 />
        </Button>
      </div>

      <div className="border-2 border-border bg-amber-300 p-6 shadow-shadow">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`${EFFORT_COLORS[task.effort]} text-foreground`}>
            {EFFORT_LABELS[task.effort]}
          </Badge>
          <Badge className="bg-white text-foreground">{task.effortPoints} effort pts</Badge>
          <Badge className={`${STATUS_COLORS[done ? "done" : "todo"]} text-foreground`}>
            {done ? "Done" : "To Do"}
          </Badge>
          {task.isRecurring && (
            <Badge variant="neutral">Repeats every {task.recurrenceIntervalDays} days</Badge>
          )}
        </div>
        <h1 className="mt-4 text-4xl md:text-5xl">{task.name}</h1>
        {task.description && <p className="mt-4 text-lg font-semibold">{task.description}</p>}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs font-extrabold uppercase">Assigned to</p>
            {assignee ? (
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  {assignee.image && (
                    <AvatarImage src={assignee.image} alt={assignee.name ?? assignee.email} />
                  )}
                  <AvatarFallback className={`${getAvatarColor(assignee.id)} text-foreground`}>
                    {assignee.name ? getInitials(assignee.name) : assignee.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xl font-extrabold">{assignee.name ?? assignee.email}</p>
              </div>
            ) : (
              autoSuggestName && (
                <p className="text-sm font-bold">
                  Auto-suggest would hand this to {autoSuggestName} (lowest load).
                </p>
              )
            )}
            <Select value={assignee?.id ?? "unassigned"} onValueChange={changeAssignee}>
              <SelectTrigger className="bg-white text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name ?? member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="bg-blue-400">
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs font-extrabold uppercase">Effort estimate</p>
            <p className="text-4xl uppercase">{EFFORT_LABELS[task.effort]}</p>
            <p className="text-sm font-bold">
              Counts as {task.effortPoints} of the week&apos;s points.
              {due ? ` Due ${due}.` : ""}
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-extrabold uppercase">Due date</p>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button type="button" className={`${selectClass} w-fit`}>
                    {due ?? "Set a due date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="border-0 bg-transparent p-0 shadow-none">
                  <Calendar
                    mode="single"
                    selected={dueDate ? parseISODate(dueDate) : undefined}
                    onSelect={changeDueDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          {!done && !showRatingPrompt && (
            <button
              type="button"
              onClick={handleMarkDone}
              className="w-full border-2 border-border bg-green-300 p-4 text-center text-lg font-extrabold uppercase shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
            >
              Mark done
            </button>
          )}

          {done && (
            <button
              type="button"
              onClick={handleMarkNotDone}
              className="w-full border-2 border-border bg-secondary-background p-4 text-center text-lg font-extrabold uppercase shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
            >
              Mark as not done
            </button>
          )}

          {showRatingPrompt && (
            <div className="border-2 border-border bg-secondary-background p-4">
              <p className="text-sm font-extrabold uppercase">How was the effort?</p>
              <p className="mt-1 text-sm font-semibold text-foreground/70">
                This only adjusts the score for the next occurrence — this one stays exactly as it
                was.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {EFFORT_RATINGS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRate(r)}
                    className={`border-2 border-border px-4 py-2 font-extrabold uppercase ${RATING_COLORS[r]} hover:shadow-shadow`}
                  >
                    {EFFORT_RATING_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
