export const getTodayDateString = () => {
  const now = new Date()
  const offsetNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return offsetNow.toISOString().slice(0, 10)
}

export const getCurrentTimeString = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export const isDateBeforeToday = (dateString) => {
  if (!dateString) return false
  return dateString < getTodayDateString()
}

export const isTimeInPastForDate = (dateString, timeString) => {
  if (!dateString || !timeString) return false

  const today = getTodayDateString()

  if (dateString !== today) {
    return false
  }

  return timeString < getCurrentTimeString()
}
