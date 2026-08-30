"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EFFORT_COLORS, EFFORT_LABELS, EFFORT_LEVELS, EFFORT_POINTS, type Effort } from "@/lib/effort";
import type { FlatWithMembers } from "@/lib/flats";
import {
  formatDueDate,
  getAvatarColor,
  getInitials,
  parseISODate,
  toISODateString,
} from "@/lib/utils";
import { createTaskAction } from "./actions";

const EFFORT_BLURBS: Record<Effort, string> = {
  quick: "Under 10 minutes. Barely a dent.",
  medium: "20–40 minutes of real work.",
  heavy: "An hour or more, or genuinely unpleasant.",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-red-400 text-lg font-bold uppercase"
    >
      {pending ? "Creating task..." : "Add to board"}
    </Button>
  );
}

export function TaskForm({ flat }: { flat: FlatWithMembers }) {
  const [effort, setEffort] = useState<Effort>("medium");
  const [assignee, setAssignee] = useState<string>("auto");
  const [dueDate, setDueDate] = useState<string>(() => toISODateString(new Date()));
  const [calendarOpen, setCalendarOpen] = useState(false);

  const verifiedMembers = flat.members.filter((m) => m.status === "verified");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4">
      <Link
        href="/dashboard"
        className="w-fit border-2 border-border bg-white px-3 py-2 text-sm font-extrabold uppercase shadow-shadow hover:bg-amber-300"
      >
        ← Dashboard
      </Link>

      <div>
        <h1 className="text-4xl md:text-5xl">Add a task</h1>
        <p className="mt-1 text-sm font-bold uppercase text-foreground/70">For {flat.name}</p>
      </div>

      <form action={createTaskAction} className="flex flex-col gap-6">
        <input type="hidden" name="flatId" value={flat.id} />
        <input type="hidden" name="effort" value={effort} />
        <input type="hidden" name="assignee" value={assignee} />
        <input type="hidden" name="dueDate" value={dueDate} />

        <Card>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-name" className="text-xs uppercase">
                Task name
              </Label>
              <Input id="task-name" name="name" placeholder="Deep clean kitchen" required />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase">Due date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-fit border-2 border-border bg-white px-3 py-2 text-sm font-bold outline-none focus:bg-amber-300"
                  >
                    {formatDueDate(dueDate, { long: true })}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="border-0 bg-transparent p-0 shadow-none">
                  <Calendar
                    mode="single"
                    selected={parseISODate(dueDate)}
                    onSelect={(date) => {
                      if (date) setDueDate(toISODateString(date));
                      setCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2">
            <Label htmlFor="task-desc" className="text-xs uppercase">
              Description
            </Label>
            <textarea
              id="task-desc"
              name="description"
              rows={4}
              placeholder="What exactly counts as done?"
              className="border-2 border-border bg-secondary-background px-3 py-3 font-base text-foreground outline-none placeholder:text-foreground/50 focus:bg-amber-300"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs font-extrabold uppercase">Effort level</p>
            <div className="grid gap-4 md:grid-cols-3">
              {EFFORT_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEffort(level)}
                  className={`border-2 border-border p-4 text-left ${
                    effort === level
                      ? `${EFFORT_COLORS[level]} shadow-shadow`
                      : "bg-secondary-background hover:bg-amber-300"
                  }`}
                >
                  <span className="block text-2xl uppercase">{EFFORT_LABELS[level]}</span>
                  <span className="mt-1 block text-xs font-extrabold uppercase">
                    {EFFORT_POINTS[level]} pts
                  </span>
                  <span className="mt-2 block text-sm font-semibold">{EFFORT_BLURBS[level]}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs font-extrabold uppercase">Assign to</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setAssignee("auto")}
                className={`border-2 border-border px-4 py-2 font-extrabold uppercase ${
                  assignee === "auto"
                    ? "bg-blue-400 shadow-shadow"
                    : "bg-secondary-background hover:bg-amber-300"
                }`}
              >
                Auto — lowest load
              </button>
              {verifiedMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setAssignee(member.id)}
                  className={`flex items-center gap-2 border-2 border-border px-3 py-2 font-extrabold ${
                    assignee === member.id
                      ? "bg-amber-300 shadow-shadow"
                      : "bg-secondary-background hover:bg-amber-300"
                  }`}
                >
                  <Avatar className="size-8">
                    {member.image && (
                      <AvatarImage src={member.image} alt={member.name ?? member.email} />
                    )}
                    <AvatarFallback className={`${getAvatarColor(member.id)} text-xs text-foreground`}>
                      {member.name ? getInitials(member.name) : member.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {(member.name ?? member.email).split(" ")[0]}
                </button>
              ))}
              {verifiedMembers.length === 0 && (
                <p className="text-sm font-bold text-foreground/70">
                  No other verified members yet — this will stay unassigned.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton />
          <Badge className="bg-secondary-background text-xs font-bold uppercase">
            Adds {EFFORT_POINTS[effort]} pts to the week
          </Badge>
        </div>
      </form>
    </div>
  );
}
