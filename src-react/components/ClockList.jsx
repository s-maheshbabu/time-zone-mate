import ClockRow from './ClockRow'

export default function ClockList({ clocks, onTimeChange, onDateChange, onCalendarClick, onRemove }) {
  if (clocks.length === 0) return null

  // Display added clocks in a 2-column grid on medium+ screens.
  return (
    <ol className="list-none p-0">
      {chunk(clocks, 2).map((pair, rowIndex) => (
        <li key={rowIndex} className="border-t border-gray-100 py-4">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pair.map((clock, colIndex) => {
                const index = rowIndex * 2 + colIndex + 1 // +1 because local clock is at index 0
                return (
                  <ClockRow
                    key={clock.id}
                    clock={clock}
                    onTimeChange={value => onTimeChange(index, value)}
                    onDateChange={value => onDateChange(index, value)}
                    onCalendarClick={() => onCalendarClick(index)}
                  >
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      className="text-red-500 hover:text-red-700 text-xl leading-none"
                      title="Remove clock"
                    >
                      &times;
                    </button>
                  </ClockRow>
                )
              })}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

function chunk(array, size) {
  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}
