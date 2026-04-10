import { useRef } from 'react'

// Displays a single clock: time input, calendar button, full datetime label.
// Used for both the local clock and added clocks.
export default function ClockRow({ clock, onTimeChange, onDateChange, onCalendarClick, children }) {
  const dateInputRef = useRef(null)

  const timeValue = clock.invalidTime ? '' : clock.dt.toFormat('HH:mm:ss')
  const dateValue = clock.dt.toISODate()
  const fullDisplay = clock.dt.toFormat("EEE MMM dd yyyy HH:mm:ss 'GMT'ZZ")

  function handleCalendarClick() {
    onCalendarClick?.()
    // Open the native date picker via showPicker().
    try { dateInputRef.current?.showPicker() } catch (_) {}
  }

  function handleTimeChange(e) {
    const value = e.target.value
    if (!value) {
      // Empty means the user cleared or entered an invalid time.
      onTimeChange(null)
    } else {
      onTimeChange(value)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="font-medium text-gray-700">{clock.title}</label>
        {children}
      </div>

      <div className="flex items-center gap-1">
        <input
          type="time"
          step="1"
          value={timeValue}
          onChange={handleTimeChange}
          className={`flex-1 px-3 py-2 font-bold border rounded-md focus:outline-none focus:ring-2 focus:ring-[#00c6ff] ${
            clock.invalidTime ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <button
          type="button"
          onClick={handleCalendarClick}
          className="px-3 py-2 rounded-md text-white text-sm"
          style={{ backgroundColor: '#46d633' }}
          title="Pick date"
        >
          &#128197;
        </button>
        {/* Hidden date input — triggered programmatically via showPicker(). */}
        <input
          ref={dateInputRef}
          type="date"
          value={dateValue}
          onChange={e => onDateChange(e.target.value)}
          className="absolute opacity-0 w-px h-px pointer-events-none"
          tabIndex={-1}
        />
      </div>

      <div className="mt-1 min-h-[1.25rem]">
        {clock.invalidTime ? (
          <span className="text-xs text-white bg-red-500 px-2 py-0.5 rounded">Invalid Time</span>
        ) : (
          <span className="text-sm text-gray-500">{fullDisplay}</span>
        )}
      </div>
    </div>
  )
}
