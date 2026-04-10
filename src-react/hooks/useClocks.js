import { useState, useEffect, useCallback } from 'react'
import { DateTime, FixedOffsetZone } from 'luxon'

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone

// --- Clock factory functions ---

function makeNamedClock(timeZoneName, title) {
  const tz = timeZoneName || LOCAL_TZ
  return {
    id: crypto.randomUUID(),
    title: title || timeZoneName || 'Local Time',
    type: 'named',
    timeZoneName: tz,
    offsetMinutes: null,
    dt: DateTime.now().setZone(tz),
    invalidTime: false,
    editMode: false,
  }
}

function makeOffsetClock(offsetMinutes, title) {
  const offset = offsetMinutes ?? 0
  return {
    id: crypto.randomUUID(),
    title: title || 'UTC+0',
    type: 'offset',
    timeZoneName: null,
    offsetMinutes: offset,
    dt: DateTime.now().setZone(FixedOffsetZone.instance(offset)),
    invalidTime: false,
    editMode: false,
  }
}

// --- Helpers ---

function getCurrentDt(clock) {
  if (clock.type === 'named') {
    return DateTime.now().setZone(clock.timeZoneName)
  }
  return DateTime.now().setZone(FixedOffsetZone.instance(clock.offsetMinutes))
}

function getUTC(clock) {
  return clock.dt.toUTC()
}

function setFromUTC(clock, utcDt) {
  if (clock.type === 'named') {
    return { ...clock, dt: utcDt.setZone(clock.timeZoneName) }
  }
  return { ...clock, dt: utcDt.setZone(FixedOffsetZone.instance(clock.offsetMinutes)) }
}

// --- Hook ---

export function useClocks() {
  const [clocks, setClocks] = useState(() => [
    makeNamedClock(null, 'Local Time'),
    makeOffsetClock(0, 'UTC'),
  ])
  const [clocksRunning, setClocksRunning] = useState(true)

  // Tick every second while running.
  useEffect(() => {
    if (!clocksRunning) return
    const id = setInterval(() => {
      setClocks(prev => prev.map(clock => ({ ...clock, dt: getCurrentDt(clock) })))
    }, 1000)
    return () => clearInterval(id)
  }, [clocksRunning])

  const stopClocks = useCallback(() => {
    setClocksRunning(false)
  }, [])

  const resetClocks = useCallback(() => {
    setClocks(prev => prev.map(clock => ({
      ...clock,
      dt: getCurrentDt(clock),
      invalidTime: false,
    })))
    setClocksRunning(true)
  }, [])

  // Use the clock at pivotIndex as the source of truth and sync all others to the same instant.
  const adjustAllClocks = useCallback((pivotIndex) => {
    setClocksRunning(false)
    setClocks(prev => {
      const pivot = prev[pivotIndex]
      if (pivot.invalidTime) return prev
      const utc = getUTC(pivot)
      return prev.map((clock, i) =>
        i === pivotIndex ? clock : { ...setFromUTC(clock, utc), invalidTime: false }
      )
    })
  }, [])

  // Called when user edits the time input (HH:mm:ss string from <input type="time" step="1">).
  const updateClockTime = useCallback((index, timeString) => {
    setClocks(prev => {
      const clock = prev[index]
      const [h, m, s = 0] = timeString.split(':').map(Number)
      const newDt = clock.dt.set({ hour: h, minute: m, second: s })
      return prev.map((c, i) => i === index ? { ...c, dt: newDt, invalidTime: false } : c)
    })
  }, [])

  // Called when user picks a date (YYYY-MM-DD string from <input type="date">).
  const updateClockDate = useCallback((index, dateString) => {
    setClocks(prev => {
      const clock = prev[index]
      const [year, month, day] = dateString.split('-').map(Number)
      const newDt = clock.dt.set({ year, month, day })
      return prev.map((c, i) => i === index ? { ...c, dt: newDt, invalidTime: false } : c)
    })
  }, [])

  const markClockInvalid = useCallback((index) => {
    setClocks(prev => prev.map((c, i) => i === index ? { ...c, invalidTime: true } : c))
  }, [])

  // Open the datepicker for one clock, close all others, and stop ticking.
  const setEditMode = useCallback((index) => {
    setClocksRunning(false)
    setClocks(prev => prev.map((c, i) => ({ ...c, editMode: i === index })))
  }, [])

  const addNamedClock = useCallback((timeZoneName, title) => {
    setClocks(prev => {
      // If this title already exists among added clocks, bubble it to the top.
      const existingIndex = prev.findIndex((c, i) => i > 0 && c.title === title)
      if (existingIndex > 0) {
        const existing = prev[existingIndex]
        const rest = prev.filter((_, i) => i !== existingIndex)
        return [rest[0], existing, ...rest.slice(1)]
      }
      let newClock = makeNamedClock(timeZoneName, title)
      // If clocks are paused, sync the new clock to the current moment of a valid existing clock.
      const validClock = prev.find(c => !c.invalidTime)
      if (validClock) newClock = setFromUTC(newClock, getUTC(validClock))
      return [...prev, newClock]
    })
  }, [])

  const addOffsetClock = useCallback((offsetMinutes, title) => {
    setClocks(prev => {
      const existingIndex = prev.findIndex((c, i) => i > 0 && c.title === title)
      if (existingIndex > 0) {
        const existing = prev[existingIndex]
        const rest = prev.filter((_, i) => i !== existingIndex)
        return [rest[0], existing, ...rest.slice(1)]
      }
      let newClock = makeOffsetClock(offsetMinutes, title)
      const validClock = prev.find(c => !c.invalidTime)
      if (validClock) newClock = setFromUTC(newClock, getUTC(validClock))
      return [...prev, newClock]
    })
  }, [])

  const removeClock = useCallback((index) => {
    setClocks(prev => prev.filter((_, i) => i !== index))
  }, [])

  return {
    clocks,
    clocksRunning,
    localClock: clocks[0],
    addedClocks: clocks.slice(1),
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
  }
}
