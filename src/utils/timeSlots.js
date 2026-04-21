export const DEFAULT_TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00'
]

export const toMinutesFromTime = (time) => {
  if (!time || !String(time).includes(':')) return -1

  const [hours, minutes] = String(time)
    .split(':')
    .map((item) => Number.parseInt(item, 10))

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return -1

  return hours * 60 + minutes
}

export const getAvailableSlots = ({
  selectedDate,
  todayDate,
  currentTime,
  occupiedHours = [],
  allSlots = DEFAULT_TIME_SLOTS,
  excludedHour = ''
}) => {
  const occupiedSet = new Set(occupiedHours)
  const nowMinutes = toMinutesFromTime(currentTime)

  return allSlots.filter((slot) => {
    if (slot === excludedHour) return true
    if (occupiedSet.has(slot)) return false

    if (selectedDate && todayDate && selectedDate === todayDate) {
      return toMinutesFromTime(slot) > nowMinutes
    }

    return true
  })
}
