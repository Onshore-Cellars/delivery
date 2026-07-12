import { describe, it, expect } from 'vitest'
import { nextRunFrom, advanceRun } from '@/lib/recurring'

const iso = (d: Date) => d.toISOString().slice(0, 10)

describe('nextRunFrom', () => {
  it('weekly: finds the next matching weekday strictly after `from`', () => {
    // Wed 2026-07-01. Next Monday (dow=1) is 2026-07-06.
    const d = nextRunFrom({ frequency: 'weekly', dayOfWeek: 1 }, new Date('2026-07-01T12:00:00Z'))
    expect(d.getDay()).toBe(1)
    expect(iso(d)).toBe('2026-07-06')
  })
  it('monthly: clamps day and rolls to next month when past', () => {
    const d = nextRunFrom({ frequency: 'monthly', dayOfMonth: 5 }, new Date('2026-07-10T00:00:00Z'))
    expect(d.getDate()).toBe(5)
    expect(d.getMonth()).toBe(7) // August (0-indexed)
  })
  it('monthly: clamps dayOfMonth > 28 to 28', () => {
    const d = nextRunFrom({ frequency: 'monthly', dayOfMonth: 31 }, new Date('2026-02-01T00:00:00Z'))
    expect(d.getDate()).toBe(28)
  })
})

describe('advanceRun', () => {
  it('weekly advances 7 days to the same weekday', () => {
    const first = nextRunFrom({ frequency: 'weekly', dayOfWeek: 1 }, new Date('2026-07-01T12:00:00Z'))
    const next = advanceRun({ frequency: 'weekly', dayOfWeek: 1 }, first)
    expect(next.getDay()).toBe(1)
    expect(Math.round((next.getTime() - first.getTime()) / 86400000)).toBe(7)
  })
  it('biweekly advances 14 days', () => {
    const first = nextRunFrom({ frequency: 'biweekly', dayOfWeek: 3 }, new Date('2026-07-01T12:00:00Z'))
    const next = advanceRun({ frequency: 'biweekly', dayOfWeek: 3 }, first)
    expect(Math.round((next.getTime() - first.getTime()) / 86400000)).toBe(14)
  })
  it('monthly advances to the next month, same day', () => {
    const first = nextRunFrom({ frequency: 'monthly', dayOfMonth: 15 }, new Date('2026-07-01T00:00:00Z'))
    const next = advanceRun({ frequency: 'monthly', dayOfMonth: 15 }, first)
    expect(next.getDate()).toBe(15)
    expect(next.getMonth()).toBe((first.getMonth() + 1) % 12)
  })
})
