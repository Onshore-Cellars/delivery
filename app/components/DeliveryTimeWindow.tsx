'use client'

interface DeliveryTimeWindowProps {
  value: string
  onChange: (value: string) => void
}

const windows = [
  { value: 'morning', label: 'Morning', time: '08:00 – 12:00', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon', time: '12:00 – 17:00', icon: '☀️' },
  { value: 'evening', label: 'Evening', time: '17:00 – 21:00', icon: '🌆' },
  { value: 'any', label: 'Any Time', time: 'Flexible', icon: '🕐' },
]

export default function DeliveryTimeWindow({ value, onChange }: DeliveryTimeWindowProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">Preferred Delivery Window</label>
      <div className="grid grid-cols-2 gap-2">
        {windows.map(w => (
          <button
            key={w.value}
            type="button"
            onClick={() => onChange(w.value)}
            className={`flex items-center gap-2.5 p-3 rounded-lg border-2 transition-all text-left ${
              value === w.value
                ? 'border-[#FF6A2A] bg-[#FF6A2A]/5'
                : 'border-[#e8e4de] hover:border-[#FF6A2A]/40'
            }`}
          >
            <span className="text-lg">{w.icon}</span>
            <div>
              <span className="text-sm font-semibold text-[#1a1a1a] block">{w.label}</span>
              <span className="text-xs text-[#6B7C86]">{w.time}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
