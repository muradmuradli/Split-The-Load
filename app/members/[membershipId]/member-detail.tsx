"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { removeMemberAction } from "@/app/dashboard/actions";
import { EFFORT_COLORS, EFFORT_LABELS, STATUS_COLORS } from "@/lib/effort";
import { formatDueDate, getAvatarColor, getInitials } from "@/lib/utils";

type Member = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "admin" | "member";
};

type AssignedTask = {
  id: string;
  name: string;
  effort: "quick" | "medium" | "heavy";
  effortPoints: number;
  status: "todo" | "done";
  dueDate: string | null;
};

export function MemberDetail({
  flatName,
  member,
  assignedTasks,
  canDelete,
}: {
  flatName: string;
  member: Member;
  assignedTasks: AssignedTask[];
  canDelete: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const router = useRouter();

  const open = assignedTasks.filter((t) => t.status === "todo");
  const done = assignedTasks.filter((t) => t.status === "done");
  const openPoints = open.reduce((sum, t) => sum + t.effortPoints, 0);

  function confirmRemove() {
    setConfirmingDelete(false);
    router.push("/dashboard");
    removeMemberAction(member.id).then((result) => {
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`${member.name ?? member.email} removed from the flat.`);
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="w-fit border-2 border-border bg-white px-3 py-2 text-sm font-extrabold uppercase shadow-shadow hover:bg-amber-300"
        >
          ← Dashboard
        </Link>
        {canDelete && (
          <Button
            type="button"
            variant="noShadow"
            className="bg-red-400 font-bold uppercase hover:bg-red-400"
            onClick={() => setConfirmingDelete(true)}
          >
            Remove from flat
          </Button>
        )}
      </div>

      <section className="border-2 border-border bg-amber-300 p-6 shadow-shadow md:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar className="size-16">
            {member.image && <AvatarImage src={member.image} alt={member.name ?? member.email} />}
            <AvatarFallback className={`${getAvatarColor(member.id)} text-xl text-foreground`}>
              {member.name ? getInitials(member.name) : member.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <Badge className="w-fit bg-white text-xs font-bold uppercase">{flatName}</Badge>
            <h1 className="mt-2 text-4xl md:text-5xl">{member.name ?? member.email}</h1>
            <p className="mt-2 text-sm font-extrabold uppercase">
              {openPoints} pts open · {open.length} open · {done.length} done
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <Card className="bg-lime-300">
          <CardContent>
            <p className="text-xs font-extrabold uppercase">Effort load</p>
            <h2 className="mt-2 text-3xl">{openPoints} pts</h2>
            <p className="mt-2 text-sm font-bold">Across their open chores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-extrabold uppercase">Open chores</p>
            <h2 className="mt-2 text-3xl">{open.length}</h2>
            <p className="mt-2 text-sm font-bold">{openPoints} pts still to do</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-400">
          <CardContent>
            <p className="text-xs font-extrabold uppercase">Completed</p>
            <h2 className="mt-2 text-3xl">{done.length}</h2>
            <p className="mt-2 text-sm font-bold">Logged so far</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl md:text-3xl">Assigned tasks</h2>
        {assignedTasks.length === 0 ? (
          <Card className="mt-4">
            <CardContent>
              <p className="font-bold">Nothing assigned yet — they are due a heavy job.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {assignedTasks.map((t) => {
              const due = formatDueDate(t.dueDate);
              return (
                <Link
                  key={t.id}
                  href={`/taskboard/${t.id}`}
                  className="block border-2 border-border bg-white p-4 shadow-shadow hover:bg-amber-300"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`${EFFORT_COLORS[t.effort]} text-foreground`}>
                      {EFFORT_LABELS[t.effort]} · {t.effortPoints} pts
                    </Badge>
                    <Badge className={`${STATUS_COLORS[t.status]} text-foreground`}>
                      {t.status === "done" ? "Done" : "To Do"}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xl font-extrabold">{t.name}</p>
                  {due && <p className="mt-1 text-sm font-semibold text-foreground/70">Due {due}</p>}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from flat?</DialogTitle>
            <DialogDescription>
              <span className="font-bold">{member.name ?? member.email}</span> will lose access to{" "}
              {flatName}. They can be invited again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="noShadow" className="bg-white font-bold uppercase">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={confirmRemove}
              className="bg-red-400 font-bold uppercase"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
