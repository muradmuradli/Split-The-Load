// Client-safe: no server-only imports (db, auth). Shared between the
// server-side task service (lib/tasks.ts) and client task/board UI.

export const EFFORT_LEVELS = ["quick", "medium", "heavy"] as const;
export type Effort = (typeof EFFORT_LEVELS)[number];

/** Starting effortPoints seeded onto a task at creation time. */
export const STARTING_EFFORT_POINTS: Record<Effort, number> = {
  quick: 10,
  medium: 20,
  heavy: 40,
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

export const EFFORT_RATINGS = ["easier", "about_right", "harder"] as const;
export type EffortRating = (typeof EFFORT_RATINGS)[number];

export const EFFORT_RATING_LABELS: Record<EffortRating, string> = {
  easier: "Easier than expected",
  about_right: "About right",
  harder: "Harder than expected",
};

/**
 * Drifts a recurring task's effort score by a fixed 10% nudge per rating
 * (an EMA-style adjustment) rather than resetting it outright, so one
 * outlier completion doesn't swing the score — it converges gradually
 * across several completions instead. Floored at 1 so it never hits zero.
 */
export function adjustEffortPoints(currentPoints: number, rating: EffortRating | null): number {
  if (rating === "harder") return Math.round(currentPoints * 1.1);
  if (rating === "easier") return Math.max(1, Math.round(currentPoints * 0.9));
  return currentPoints;
}

export type RecurrencePreset = "daily" | "weekly" | "biweekly" | "custom";

export const RECURRENCE_PRESETS: { value: RecurrencePreset; label: string; days: number | null }[] = [
  { value: "daily", label: "Daily", days: 1 },
  { value: "weekly", label: "Weekly", days: 7 },
  { value: "biweekly", label: "Every 2 weeks", days: 14 },
  { value: "custom", label: "Custom", days: null },
];
