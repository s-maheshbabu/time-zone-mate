import TimeZoneSearch from './TimeZoneSearch'

export default function AddClockPanel({ onSelect, onTogglePeripherals, peripheralsEnabled, onClose }) {
  return (
    <div className="container mx-auto px-4 mb-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-2">
          <label className="font-medium text-gray-700">Add Clock</label>
          <button
            type="button"
            onClick={onClose}
            className="text-[#00c6ff] hover:text-[#00a8d8] text-xl leading-none"
            title="Minimize"
          >
            &minus;
          </button>
        </div>
        <TimeZoneSearch
          onSelect={onSelect}
          onTogglePeripherals={onTogglePeripherals}
          peripheralsEnabled={peripheralsEnabled}
        />
      </div>
    </div>
  )
}
