"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FlatMember, FlatWithMembers } from "@/lib/flats";
import type { RecentCompletion } from "@/lib/tasks";
import { getAvatarColor, getInitials } from "@/lib/utils";
import { removeMemberAction, sendInviteAction } from "./actions";
import { FlatsBar } from "./flats-bar";

export function DashboardContent({
  flats,
  currentUserId,
  recentCompletionsByFlatId,
}: {
  flats: FlatWithMembers[];
  currentUserId: string;
  recentCompletionsByFlatId: Record<string, RecentCompletion[]>;
}) {
  const [activeFlatId, setActiveFlatId] = useState(flats[0]?.id);
  const activeFlat = flats.find((f) => f.id === activeFlatId) ?? flats[0];

  const router = useRouter();
  const searchParams = useSearchParams();
  const hasShownToast = useRef(false);
  useEffect(() => {
    if (hasShownToast.current) return;
    if (searchParams.get("flatCreated") === "1") {
      hasShownToast.current = true;
      toast.success("Flat created!");
      router.replace("/dashboard");
    } else if (searchParams.get("taskCreated") === "1") {
      hasShownToast.current = true;
      toast.success("Task added to the board.");
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  const [optimisticMembers, applyOptimisticMembers] = useOptimistic(
    activeFlat.members,
    (members: FlatMember[], action: { type: "add"; member: FlatMember } | { type: "remove"; membershipId: string }) =>
      action.type === "add"
        ? [...members, action.member]
        : members.filter((m) => m.id !== action.membershipId),
  );

  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, startInviteTransition] = useTransition();

  const [memberToRemove, setMemberToRemove] = useState<FlatMember | null>(null);
  const [isRemoving, startRemoveTransition] = useTransition();

  const myMembership = optimisticMembers.find((m) => m.userId === currentUserId);
  const isAdmin = myMembership?.role === "admin";
  const recentCompletions = recentCompletionsByFlatId[activeFlat.id] ?? [];

  const handleInvite = (e: FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email || !activeFlat) return;

    const optimisticMember: FlatMember = {
      id: `optimistic-${crypto.randomUUID()}`,
      userId: null,
      name: null,
      email,
      image: null,
      role: "member",
      status: "pending",
    };

    setInviteEmail("");

    startInviteTransition(async () => {
      applyOptimisticMembers({ type: "add", member: optimisticMember });
      const result = await sendInviteAction(activeFlat.id, email);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Invite sent to ${email}.`);
    });
  };

  const confirmRemove = () => {
    if (!memberToRemove) return;
    const removed = memberToRemove;
    setMemberToRemove(null);

    startRemoveTransition(async () => {
      applyOptimisticMembers({ type: "remove", membershipId: removed.id });
      const result = await removeMemberAction(removed.id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`${removed.name ?? removed.email} removed from the flat.`);
      }
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <FlatsBar
        flats={flats}
        activeFlatId={activeFlat.id}
        onSelect={(id) => setActiveFlatId(id)}
      />

      <section className="border-2 border-border bg-amber-300 p-6 shadow-shadow md:p-8">
        <Badge className="w-fit bg-white text-xs font-bold uppercase">{activeFlat.city}</Badge>
        <h1 className="mt-3 text-4xl md:text-6xl">{activeFlat.name}</h1>
        <p className="mt-3 max-w-2xl text-base font-semibold md:text-lg">
          {optimisticMembers.length} {optimisticMembers.length === 1 ? "person" : "people"} in
          this flat. Invite housemates below to start splitting the load.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <Card className="bg-lime-300">
          <CardContent>
            <p className="text-xs font-extrabold uppercase">Up next</p>
            <h2 className="mt-2 text-3xl">—</h2>
            <p className="mt-2 text-sm font-bold">Task tracking is coming soon.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-extrabold uppercase">Open tasks</p>
            <h2 className="mt-2 text-3xl">0</h2>
            <p className="mt-2 text-sm font-bold">No tasks yet.</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-400">
          <CardContent>
            <p className="text-xs font-extrabold uppercase">Load gap</p>
            <h2 className="mt-2 text-3xl">—</h2>
            <p className="mt-2 text-sm font-bold">Effort scoring is coming soon.</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl md:text-3xl">Members</h2>
          <span className="text-xs font-extrabold uppercase">
            {optimisticMembers.length} in {activeFlat.name}
          </span>
        </div>

        <form
          onSubmit={handleInvite}
          className="mt-4 flex flex-wrap items-center gap-3 border-2 border-border bg-lime-300 p-4 shadow-shadow"
        >
          <Label htmlFor="invite-email" className="text-xs uppercase">
            Invite a flatmate
          </Label>
          <Input
            id="invite-email"
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="housemate@example.com"
            className="min-w-[220px] flex-1 bg-white"
          />
          <Button
            type="submit"
            disabled={isInviting}
            className="bg-red-400 font-bold uppercase hover:bg-amber-300"
          >
            {isInviting ? "Sending..." : "Send invite"}
          </Button>
        </form>

        <div className="mt-4 flex flex-col gap-3">
          {optimisticMembers.map((member) => (
            <div
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 border-2 border-border bg-white p-4 shadow-shadow"
            >
              {member.status === "verified" ? (
                <Link
                  href={`/members/${member.id}`}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                >
                  <Avatar>
                    {member.image && (
                      <AvatarImage src={member.image} alt={member.name ?? member.email} />
                    )}
                    <AvatarFallback className={`${getAvatarColor(member.id)} text-foreground`}>
                      {member.name ? getInitials(member.name) : member.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-extrabold">{member.name ?? member.email}</p>
                    {member.name && (
                      <p className="truncate text-sm font-bold text-foreground/70">{member.email}</p>
                    )}
                  </div>
                </Link>
              ) : (
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar>
                    <AvatarFallback className={`${getAvatarColor(member.id)} text-foreground`}>
                      {member.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-extrabold">{member.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant={member.role === "admin" ? "default" : "neutral"}>
                  {member.role}
                </Badge>
                <Badge className={member.status === "pending" ? "bg-amber-300" : "bg-lime-300"}>
                  {member.status}
                </Badge>
                {isAdmin && member.userId !== currentUserId && (
                  <Button
                    type="button"
                    variant="noShadow"
                    size="sm"
                    className="bg-red-400 font-bold uppercase hover:bg-amber-300"
                    onClick={() => setMemberToRemove(member)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl md:text-3xl">Recently completed</h2>
          <Button
            asChild
            variant="noShadow"
            size="sm"
            className="bg-red-400 font-bold uppercase hover:bg-amber-300"
          >
            <Link href={`/add-task?flat=${activeFlat.id}`}>+ Add task</Link>
          </Button>
        </div>

        {recentCompletions.length === 0 ? (
          <Card className="mt-4 bg-secondary-background">
            <CardContent>
              <p className="font-bold">Nothing completed yet — finish a chore to see it here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {recentCompletions.map((c) => (
              <Link
                key={c.id}
                href={`/taskboard/${c.taskId}`}
                className="flex flex-wrap items-center justify-between gap-3 border-2 border-border bg-white p-4 shadow-shadow hover:bg-amber-300"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-8">
                    {c.completedByUser.image && (
                      <AvatarImage src={c.completedByUser.image} alt={c.completedByUser.name} />
                    )}
                    <AvatarFallback
                      className={`${getAvatarColor(c.completedBy)} text-sm font-bold text-foreground`}
                    >
                      {getInitials(c.completedByUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-extrabold">{c.task.name}</p>
                    <p className="truncate text-sm font-bold text-foreground/70">
                      {c.completedByUser.name} ·{" "}
                      {c.completedAt.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <Badge className="bg-lime-300 text-foreground">
                  {c.effortPointsAtCompletion} pts
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={memberToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setMemberToRemove(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from flat?</DialogTitle>
            <DialogDescription>
              {memberToRemove && (
                <>
                  <span className="font-bold">{memberToRemove.name ?? memberToRemove.email}</span>{" "}
                  will lose access to {activeFlat.name}. They can be invited again later.
                </>
              )}
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
              disabled={isRemoving}
              onClick={confirmRemove}
              className="bg-red-400 font-bold uppercase"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
