import { and, eq } from "drizzle-orm";

import { db } from "./db";
import { flat, membership, task, user } from "./db/schema";
import { EFFORT_POINTS, type ActualEffort, type Effort } from "./effort";

export { EFFORT_LEVELS, EFFORT_POINTS, type Effort } from "./effort";

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
    loadByMembershipId.set(openTask.assigneeMembershipId, current + EFFORT_POINTS[openTask.effort]);
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
 * the lowest total effort load among open tasks.
 */
export async function createTask({
  flatId,
  name,
  description,
  effort,
  dueDate,
  assigneeMembershipId,
  creatorUserId,
}: {
  flatId: string;
  name: string;
  description: string;
  effort: Effort;
  /** ISO date string ("YYYY-MM-DD"). */
  dueDate: string;
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
      dueDate,
      assigneeMembershipId: resolvedAssigneeId,
      createdBy: creatorUserId,
    })
    .returning();

  return newTask;
}

/**
 * Updates a task's status, actual-effort rating, assignee, and/or due date
 * from the task page's controls. Any verified member of the task's flat may
 * make the change; only the fields present in the patch are touched.
 */
export async function updateTask({
  taskId,
  actorUserId,
  status,
  actualEffort,
  assigneeMembershipId,
  dueDate,
}: {
  taskId: string;
  actorUserId: string;
  status?: "todo" | "done";
  actualEffort?: ActualEffort | null;
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
  if (actualEffort !== undefined) updates.actualEffort = actualEffort;
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
