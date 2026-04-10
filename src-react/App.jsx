import { useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ClockRow from './components/ClockRow'
import ClockList from './components/ClockList'
import AddClockPanel from './components/AddClockPanel'
import { useClocks } from './hooks/useClocks'
import {
  getTimeZone,
  getOffset,
  loadPeripheralLocations,
  purgePeripheralLocations,
} from './data/timeZoneData'

export default function App() {
  const {
    localClock,
    addedClocks,
    clocksRunning,
    stopClocks,
    resetClocks,
    adjustAllClocks,
    updateClockTime,
    updateClockDate,
    markClockInvalid,
    setEditMode,
    addNamedClock,
    addOffsetClock,
    removeClock,
  } = useClocks()

  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false)
  const [peripheralsEnabled, setPeripheralsEnabled] = useState(false)

  function handleTimeChange(index, value) {
    if (!value) {
      markClockInvalid(index)
      stopClocks()
    } else {
      stopClocks()
      updateClockTime(index, value)
      adjustAllClocks(index)
    }
  }

  function handleDateChange(index, value) {
    if (!value) return
    stopClocks()
    updateClockDate(index, value)
    adjustAllClocks(index)
  }

  function handleCalendarClick(index) {
    setEditMode(index)
  }

  function handlePauseOrReset() {
    if (clocksRunning) {
      stopClocks()
    } else {
      resetClocks()
    }
  }

  function handleSelectLocation(location) {
    const tzName = getTimeZone(location)
    if (tzName !== undefined) {
      addNamedClock(tzName, location)
    } else {
      const offset = getOffset(location)
      if (offset !== undefined) {
        addOffsetClock(offset, location)
      }
    }
  }

  async function handleTogglePeripherals(enabled) {
    setPeripheralsEnabled(enabled)
    if (enabled) {
      await loadPeripheralLocations()
    } else {
      purgePeripheralLocations()
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Top padding to clear fixed navbar */}
      <div className="pt-20 pb-16">

        {/* Local clock */}
        <div className="container mx-auto px-4 mt-4">
          <div className="max-w-lg mx-auto">
            <ClockRow
              clock={localClock}
              onTimeChange={value => handleTimeChange(0, value)}
              onDateChange={value => handleDateChange(0, value)}
              onCalendarClick={() => handleCalendarClick(0)}
            />
          </div>
        </div>

        {/* Pause/Reset and Add Clock buttons */}
        <div className="container mx-auto px-4 mt-4">
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={handlePauseOrReset}
              onMouseUp={e => e.currentTarget.blur()}
              className="px-4 py-2 rounded-md text-white text-sm font-medium"
              style={{ backgroundColor: '#00c6ff' }}
            >
              {clocksRunning ? 'Pause' : 'Reset'}
            </button>
            <button
              type="button"
              onClick={() => setIsAddPanelOpen(open => !open)}
              onMouseUp={e => e.currentTarget.blur()}
              className="px-4 py-2 rounded-md text-white text-sm font-medium"
              style={{ backgroundColor: '#00c6ff' }}
            >
              Add Clock
            </button>
          </div>
        </div>

        {/* Collapsible add-clock panel */}
        <div className="mt-4">
          {isAddPanelOpen && (
            <AddClockPanel
              onSelect={handleSelectLocation}
              onTogglePeripherals={handleTogglePeripherals}
              peripheralsEnabled={peripheralsEnabled}
              onClose={() => setIsAddPanelOpen(false)}
            />
          )}
        </div>

        {/* Added clocks */}
        <div className="mt-2">
          <ClockList
            clocks={addedClocks}
            onTimeChange={handleTimeChange}
            onDateChange={handleDateChange}
            onCalendarClick={handleCalendarClick}
            onRemove={removeClock}
          />
        </div>

      </div>

      <Footer />
    </div>
  )
}
