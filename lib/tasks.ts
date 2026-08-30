import { and, eq } from "drizzle-orm";

import { db } from "./db";
import { completion, flat, membership, task, user } from "./db/schema";
import { adjustEffortPoints, STARTING_EFFORT_POINTS, type EffortRating, type Effort } from "./effort";

export { EFFORT_LEVELS, STARTING_EFFORT_POINTS, type Effort } from "./effort";

export type TaskWithAssignee = typeof task.$inferSelect & {
  assignee: (typeof membership.$inferSelect & { user: typeof user.$inferSelect | null }) | null;
};

export type TaskWithAssigneeAndFlat = TaskWithAssignee & {
  flat: typeof flat.$inferSelect;
};

/** Every task on a flat's board, newest first, with the assignee's user record joined in. */
export async function getFlatTasks(flatId: string): Promise<TaskWithAssignee[]> {
  return db.query.task.findMany({
    where: eq(task.flatId, flatId),
    with: { assignee: { with: { user: true } } },
    orderBy: (fields, { desc }) => [desc(fields.createdAt)],
  });
}

/** A single task with its assignee (and their user record) and flat joined in. */
export async function getTaskById(taskId: string): Promise<TaskWithAssigneeAndFlat | undefined> {
  return db.query.task.findFirst({
    where: eq(task.id, taskId),
    with: { assignee: { with: { user: true } }, flat: true },
  });
}

/**
 * The verified member with the lowest total effort points across open (todo)
 * tasks. Pass `excludeTaskId` when re-suggesting for a task that's already
 * assigned, so its own points don't skew its current assignee's load.
 */
export async function pickAutoAssignee(
  flatId: string,
  excludeTaskId?: string,
): Promise<string | null> {
  const members = await db.query.membership.findMany({
    where: and(eq(membership.flatId, flatId), eq(membership.status, "verified")),
  });
  if (members.length === 0) return null;

  const openTasks = await db.query.task.findMany({
    where: and(eq(task.flatId, flatId), eq(task.status, "todo")),
  });

  const loadByMembershipId = new Map<string, number>(members.map((m) => [m.id, 0]));
  for (const openTask of openTasks) {
    if (openTask.id === excludeTaskId) continue;
    if (!openTask.assigneeMembershipId) continue;
    const current = loadByMembershipId.get(openTask.assigneeMembershipId);
    if (current === undefined) continue;
    loadByMembershipId.set(openTask.assigneeMembershipId, current + openTask.effortPoints);
  }

  let lowest = members[0]!;
  let lowestLoad = loadByMembershipId.get(lowest.id) ?? 0;
  for (const member of members) {
    const load = loadByMembershipId.get(member.id) ?? 0;
    if (load < lowestLoad) {
      lowest = member;
      lowestLoad = load;
    }
  }
  return lowest.id;
}

/**
 * Creates a task on a flat's board. `assigneeMembershipId` can be an
 * explicit membership id, or "auto" to assign it to whoever currently has
 * the lowest total effort load among open tasks. `effortPoints` is seeded
 * from the chosen effort level (STARTING_EFFORT_POINTS) — for recurring
 * tasks it then drifts over future occurrences as completions get rated.
 */
export async function createTask({
  flatId,
  name,
  description,
  effort,
  dueDate,
  isRecurring,
  recurrenceIntervalDays,
  assigneeMembershipId,
  creatorUserId,
}: {
  flatId: string;
  name: string;
  description: string;
  effort: Effort;
  /** ISO date string ("YYYY-MM-DD"). */
  dueDate: string;
  isRecurring: boolean;
  /** Required when isRecurring is true; ignored otherwise. */
  recurrenceIntervalDays?: number | null;
  assigneeMembershipId: string | "auto";
  creatorUserId: string;
}) {
  const creatorMembership = await db.query.membership.findFirst({
    where: and(
      eq(membership.flatId, flatId),
      eq(membership.userId, creatorUserId),
      eq(membership.status, "verified"),
    ),
  });
  if (!creatorMembership) throw new Error("You're not a member of this flat.");

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Task name is required.");
  if (!dueDate) throw new Error("Due date is required.");
  if (isRecurring && (!recurrenceIntervalDays || recurrenceIntervalDays < 1)) {
    throw new Error("Choose how often this task repeats.");
  }

  let resolvedAssigneeId: string | null;
  if (assigneeMembershipId === "auto") {
    resolvedAssigneeId = await pickAutoAssignee(flatId);
  } else {
    const assigneeMembership = await db.query.membership.findFirst({
      where: and(
        eq(membership.id, assigneeMembershipId),
        eq(membership.flatId, flatId),
        eq(membership.status, "verified"),
      ),
    });
    if (!assigneeMembership) throw new Error("That person isn't a member of this flat.");
    resolvedAssigneeId = assigneeMembership.id;
  }

  const [newTask] = await db
    .insert(task)
    .values({
      flatId,
      name: trimmedName,
      description: description.trim() || null,
      effort,
      effortPoints: STARTING_EFFORT_POINTS[effort],
      dueDate,
      isRecurring,
      recurrenceIntervalDays: isRecurring ? recurrenceIntervalDays : null,
      assigneeMembershipId: resolvedAssigneeId,
      createdBy: creatorUserId,
    })
    .returning();

  return newTask;
}

/**
 * Updates a task's assignee and/or due date, or reverts its status back to
 * "todo" (undoing a completion — this intentionally doesn't try to unwind
 * any completion row or spawned next-occurrence, kept simple on purpose).
 * Marking a task *done* goes through completeTask instead, not this.
 */
export async function updateTask({
  taskId,
  actorUserId,
  status,
  assigneeMembershipId,
  dueDate,
}: {
  taskId: string;
  actorUserId: string;
  status?: "todo" | "done";
  assigneeMembershipId?: string | "unassigned";
  /** ISO date string ("YYYY-MM-DD"), or null to clear it. */
  dueDate?: string | null;
}) {
  const existingTask = await db.query.task.findFirst({ where: eq(task.id, taskId) });
  if (!existingTask) throw new Error("Task not found.");

  const actorMembership = await db.query.membership.findFirst({
    where: and(
      eq(membership.flatId, existingTask.flatId),
      eq(membership.userId, actorUserId),
      eq(membership.status, "verified"),
    ),
  });
  if (!actorMembership) throw new Error("You're not a member of this flat.");

  const updates: Partial<typeof task.$inferInsert> = {};
  if (status) updates.status = status;
  if (dueDate !== undefined) updates.dueDate = dueDate;

  if (assigneeMembershipId !== undefined) {
    if (assigneeMembershipId === "unassigned") {
      updates.assigneeMembershipId = null;
    } else {
      const assigneeMembership = await db.query.membership.findFirst({
        where: and(
          eq(membership.id, assigneeMembershipId),
          eq(membership.flatId, existingTask.flatId),
          eq(membership.status, "verified"),
        ),
      });
      if (!assigneeMembership) throw new Error("That person isn't a member of this flat.");
      updates.assigneeMembershipId = assigneeMembership.id;
    }
  }

  if (Object.keys(updates).length === 0) return existingTask;

  const [updated] = await db.update(task).set(updates).where(eq(task.id, taskId)).returning();
  return updated;
}

/**
 * Marks a task done and records a completion row. One-off tasks stop there.
 * Recurring tasks additionally drift effortPoints by the given rating (a
 * fixed 10% nudge, floored at 1 — see adjustEffortPoints) and spawn the next
 * occurrence due recurrenceIntervalDays out, carrying the adjusted score
 * forward. The just-completed row is never touched retroactively — its own
 * effortPoints (snapshotted onto the completion row) stays exactly what it
 * was, so historical instances keep an accurate record of what they were
 * worth at the time.
 */
export async function completeTask({
  taskId,
  actorUserId,
  effortRating,
}: {
  taskId: string;
  actorUserId: string;
  /** Ignored for one-off tasks — there's no future occurrence for it to inform. */
  effortRating: EffortRating | null;
}) {
  const existingTask = await db.query.task.findFirst({ where: eq(task.id, taskId) });
  if (!existingTask) throw new Error("Task not found.");

  const actorMembership = await db.query.membership.findFirst({
    where: and(
      eq(membership.flatId, existingTask.flatId),
      eq(membership.userId, actorUserId),
      eq(membership.status, "verified"),
    ),
  });
  if (!actorMembership) throw new Error("You're not a member of this flat.");

  await db.transaction(async (tx) => {
    await tx.update(task).set({ status: "done" }).where(eq(task.id, taskId));

    await tx.insert(completion).values({
      taskId,
      completedBy: actorUserId,
      effortPointsAtCompletion: existingTask.effortPoints,
      effortRating: existingTask.isRecurring ? effortRating : null,
    });

    if (existingTask.isRecurring && existingTask.recurrenceIntervalDays) {
      const nextEffortPoints = adjustEffortPoints(existingTask.effortPoints, effortRating);
      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + existingTask.recurrenceIntervalDays);

      await tx.insert(task).values({
        flatId: existingTask.flatId,
        name: existingTask.name,
        description: existingTask.description,
        effort: existingTask.effort,
        effortPoints: nextEffortPoints,
        status: "todo",
        isRecurring: true,
        recurrenceIntervalDays: existingTask.recurrenceIntervalDays,
        dueDate: nextDueDate.toISOString().slice(0, 10),
        assigneeMembershipId: existingTask.assigneeMembershipId,
        createdBy: existingTask.createdBy,
      });
    }
  });
}

/** Deletes a task. Any verified member of its flat may delete it. */
export async function deleteTask({
  taskId,
  actorUserId,
}: {
  taskId: string;
  actorUserId: string;
}) {
  const existingTask = await db.query.task.findFirst({ where: eq(task.id, taskId) });
  if (!existingTask) throw new Error("Task not found.");

  const actorMembership = await db.query.membership.findFirst({
    where: and(
      eq(membership.flatId, existingTask.flatId),
      eq(membership.userId, actorUserId),
      eq(membership.status, "verified"),
    ),
  });
  if (!actorMembership) throw new Error("You're not a member of this flat.");

  await db.delete(task).where(eq(task.id, taskId));
}
