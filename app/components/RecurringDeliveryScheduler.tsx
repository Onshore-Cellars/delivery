'use client'

import { useState } from 'react'

interface RecurringDeliverySchedulerProps {
  listingId: string
  onSchedule: (schedule: RecurringSchedule) => void
  onClose: () => void
}

interface RecurringSchedule {
  frequency: 'weekly' | 'biweekly' | 'monthly'
  dayOfWeek?: number  // 0=Sun, 1=Mon, etc.
  dayOfMonth?: number
  startDate: string
  endDate?: string
  count?: number
  timeWindow: string
  notes?: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function RecurringDeliveryScheduler({ onSchedule, onClose }: RecurringDeliverySchedulerProps) {
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly')
  const [dayOfWeek, setDayOfWeek] = useState(1) // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [count, setCount] = useState<number | undefined>(undefined)
  const [endType, setEndType] = useState<'date' | 'count' | 'never'>('count')
  const [timeWindow, setTimeWindow] = useState('morning')
  const [notes, setNotes] = useState('')

  const handleSchedule = () => {
    if (!startDate) return
    onSchedule({
      frequency,
      dayOfWeek: frequency !== 'monthly' ? dayOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      startDate,
      endDate: endType === 'date' ? endDate : undefined,
      count: endType === 'count' ? count : undefined,
      timeWindow,
      notes: notes || undefined,
    })
  }

  // Preview upcoming dates
  const getPreviewDates = () => {
    if (!startDate) return []
    const dates: Date[] = []
    const start = new Date(startDate)
    const d = new Date(start)
    const maxDates = 5

    for (let i = 0; i < maxDates && dates.length < maxDates; i++) {
      if (frequency === 'weekly') {
        const next = new Date(d)
        next.setDate(d.getDate() + (i * 7))
        // Adjust to correct day of week
        const diff = dayOfWeek - next.getDay()
        next.setDate(next.getDate() + diff)
        if (next >= start) dates.push(next)
      } else if (frequency === 'biweekly') {
        const next = new Date(d)
        next.setDate(d.getDate() + (i * 14))
        const diff = dayOfWeek - next.getDay()
        next.setDate(next.getDate() + diff)
        if (next >= start) dates.push(next)
      } else {
        const next = new Date(start.getFullYear(), start.getMonth() + i, dayOfMonth)
        if (next >= start) dates.push(next)
      }
    }
    return dates.slice(0, 5)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#162E3D] w-full sm:max-w-md sm:rounded-lg rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#162E3D] border-b border-white/10 px-5 py-4 z-10 rounded-t-2xl sm:rounded-t-lg flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#F7F9FB]" style={{ fontFamily: 'var(--font-display)' }}>Recurring Schedule</h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-[#162E3D] text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Frequency */}
          <div>
            <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {(['weekly', 'biweekly', 'monthly'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold border-2 transition-all ${
                    frequency === f ? 'border-[#FF6A2A] bg-[#FF6A2A]/5 text-[#F7F9FB]' : 'border-white/10 text-[#9AADB8]'
                  }`}
                >
                  {f === 'weekly' ? 'Weekly' : f === 'biweekly' ? 'Bi-weekly' : 'Monthly'}
                </button>
              ))}
            </div>
          </div>

          {/* Day selection */}
          {frequency !== 'monthly' ? (
            <div>
              <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Day of Week</label>
              <div className="flex gap-1.5">
                {DAYS.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => setDayOfWeek(i)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      dayOfWeek === i ? 'bg-[#FF6A2A] text-white' : 'bg-[#162E3D] text-[#9AADB8] hover:bg-[#1E3A4D]'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Day of Month</label>
              <select
                value={dayOfMonth}
                onChange={e => setDayOfMonth(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded border border-white/10 text-sm focus:border-[#FF6A2A] outline-none"
              >
                {Array.from({ length: 28 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}{['st', 'nd', 'rd'][(i % 10) - 1] || 'th'}</option>
                ))}
              </select>
            </div>
          )}

          {/* Time window */}
          <div>
            <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Time Window</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: 'morning', l: 'Morning', t: '08–12' },
                { v: 'afternoon', l: 'Afternoon', t: '12–17' },
                { v: 'evening', l: 'Evening', t: '17–21' },
                { v: 'any', l: 'Any', t: 'Flexible' },
              ].map(w => (
                <button
                  key={w.v}
                  onClick={() => setTimeWindow(w.v)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-all ${
                    timeWindow === w.v ? 'border-[#FF6A2A] bg-[#FF6A2A]/5' : 'border-white/10'
                  }`}
                >
                  {w.l} <span className="text-slate-400 font-normal">({w.t})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Start date */}
          <div>
            <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded border border-white/10 text-sm focus:border-[#FF6A2A] outline-none" />
          </div>

          {/* End condition */}
          <div>
            <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Ends</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="endType" checked={endType === 'count'} onChange={() => setEndType('count')} />
                <span>After</span>
                <input type="number" min={2} max={52} value={count || 4} onChange={e => setCount(Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded border border-white/10 text-sm text-center focus:border-[#FF6A2A] outline-none" />
                <span>deliveries</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="endType" checked={endType === 'date'} onChange={() => setEndType('date')} />
                <span>On date</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="flex-1 px-2 py-1 rounded border border-white/10 text-sm focus:border-[#FF6A2A] outline-none" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="endType" checked={endType === 'never'} onChange={() => setEndType('never')} />
                <span>No end date (manual)</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-[#F7F9FB] mb-2">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Weekly provisions run"
              className="w-full px-3 py-2.5 rounded border border-white/10 text-sm focus:border-[#FF6A2A] outline-none min-h-[50px] resize-none" />
          </div>

          {/* Preview */}
          {startDate && (
            <div className="bg-[#0B1F2A] rounded-lg p-4">
              <p className="text-xs font-semibold text-[#FF6A2A] uppercase tracking-wider mb-2">Preview — next deliveries</p>
              <div className="space-y-1.5">
                {getPreviewDates().map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#FF6A2A]/10 text-[#FF6A2A] flex items-center justify-center font-semibold text-[10px]">{i + 1}</span>
                    <span className="text-[#F7F9FB] font-medium">
                      {d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleSchedule} disabled={!startDate} className="btn-primary w-full disabled:opacity-50">
            Set Recurring Schedule
          </button>
        </div>
      </div>
    </div>
  )
}
