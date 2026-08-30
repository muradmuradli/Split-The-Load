import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** First letter of the first and last word only — "Jane Q. Public" -> "JP". */
export function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ""
  if (words.length === 1) return words[0]!.charAt(0).toUpperCase()
  return (words[0]!.charAt(0) + words[words.length - 1]!.charAt(0)).toUpperCase()
}

const AVATAR_COLORS = [
  "bg-blue-400",
  "bg-red-400",
  "bg-amber-300",
  "bg-lime-300",
  "bg-green-300",
  "bg-pink-400",
  "bg-purple-400",
  "bg-cyan-400",
  "bg-orange-400",
]

/** Deterministic, arbitrary background color for an avatar — same id always gets the same color. */
export function getAvatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!
}

/** Parses an ISO date string ("YYYY-MM-DD") as a local-timezone Date (avoids UTC day-shift). */
export function parseISODate(value: string) {
  return new Date(`${value}T00:00:00`)
}

/** Formats a Date as "YYYY-MM-DD" using its local date fields (not toISOString, which is UTC). */
export function toISODateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Human-readable due date, e.g. "Mar 5" or, with `long: true`, "March 5". */
export function formatDueDate(dueDate: string | null, options?: { long?: boolean }) {
  if (!dueDate) return null
  return parseISODate(dueDate).toLocaleDateString(undefined, {
    month: options?.long ? "long" : "short",
    day: "numeric",
  })
}
