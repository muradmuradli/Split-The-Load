// Client-safe: no server-only imports (db, auth). Shared between the
// server-side task service (lib/tasks.ts) and client task-form UI.

export const EFFORT_LEVELS = ["quick", "medium", "heavy"] as const;
export type Effort = (typeof EFFORT_LEVELS)[number];

export const EFFORT_POINTS: Record<Effort, number> = {
  quick: 2,
  medium: 5,
  heavy: 9,
};

export const EFFORT_LABELS: Record<Effort, string> = {
  quick: "Quick",
  medium: "Medium",
  heavy: "Heavy",
};

export const EFFORT_COLORS: Record<Effort, string> = {
  quick: "bg-green-300",
  medium: "bg-amber-300",
  heavy: "bg-red-400",
};

export const STATUS_COLORS: Record<"todo" | "done", string> = {
  todo: "bg-white",
  done: "bg-green-300",
};

/** A flat member as shown in task assignee UI (board + detail page). */
export type TaskMember = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export const ACTUAL_EFFORT_RATINGS = ["easier", "as_expected", "harder"] as const;
export type ActualEffort = (typeof ACTUAL_EFFORT_RATINGS)[number];

export const ACTUAL_EFFORT_LABELS: Record<ActualEffort, string> = {
  easier: "Easier",
  as_expected: "As expected",
  harder: "Harder",
};

/** Adjusts a task's base effort points by how it was actually rated once done. */
export function computeAdjustedPoints(basePoints: number, actualEffort: ActualEffort | null) {
  if (actualEffort === "harder") return basePoints + 2;
  if (actualEffort === "easier") return Math.max(1, basePoints - 1);
  return basePoints;
}
