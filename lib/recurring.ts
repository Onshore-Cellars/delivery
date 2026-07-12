// Helpers for recurring bookings — computing the next occurrence date.

export type Frequency = 'weekly' | 'biweekly' | 'monthly'

/**
 * The next occurrence at/after `from` for the given schedule.
 * - weekly/biweekly: next matching dayOfWeek (biweekly adds a week when the
 *   candidate is within the current week window).
 * - monthly: next dayOfMonth (clamped to 1..28).
 */
export function nextRunFrom(
  schedule: { frequency: Frequency; dayOfWeek?: number | null; dayOfMonth?: number | null },
  from: Date,
): Date {
  const d = new Date(from)
  d.setHours(9, 0, 0, 0) // occurrences land at 09:00

  if (schedule.frequency === 'monthly') {
    const dom = Math.min(Math.max(schedule.dayOfMonth ?? 1, 1), 28)
    const candidate = new Date(d.getFullYear(), d.getMonth(), dom, 9, 0, 0, 0)
    if (candidate <= from) candidate.setMonth(candidate.getMonth() + 1)
    return candidate
  }

  // weekly / biweekly
  const targetDow = schedule.dayOfWeek ?? 1 // default Monday
  const candidate = new Date(d)
  const delta = (targetDow - candidate.getDay() + 7) % 7
  candidate.setDate(candidate.getDate() + delta)
  if (candidate <= from) candidate.setDate(candidate.getDate() + 7)
  if (schedule.frequency === 'biweekly') {
    // Advance to keep a fortnightly cadence relative to `from`.
    const days = Math.round((candidate.getTime() - from.getTime()) / 86400000)
    if (days < 7) candidate.setDate(candidate.getDate() + 7)
  }
  return candidate
}

/** Advance from the last run to the next, respecting the cadence. */
export function advanceRun(
  schedule: { frequency: Frequency; dayOfWeek?: number | null; dayOfMonth?: number | null },
  lastRun: Date,
): Date {
  const base = new Date(lastRun)
  base.setHours(9, 0, 0, 0)
  if (schedule.frequency === 'weekly') {
    base.setDate(base.getDate() + 7)          // same weekday, next week
  } else if (schedule.frequency === 'biweekly') {
    base.setDate(base.getDate() + 14)         // same weekday, in a fortnight
  } else {
    // Monthly: next month on the clamped day-of-month.
    const dom = Math.min(Math.max(schedule.dayOfMonth ?? base.getDate(), 1), 28)
    base.setDate(1)                            // avoid month-length overflow
    base.setMonth(base.getMonth() + 1)
    base.setDate(dom)
  }
  return base
}
