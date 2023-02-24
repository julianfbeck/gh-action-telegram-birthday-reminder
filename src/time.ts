import dayjs from 'dayjs'
export function isCurrentDateXDaysBeforeBirthdayDate(
  days: number,
  birthdayDate: Date
): boolean {
  // get current date
  const currentDate = new Date()
  const addDays = dayjs(birthdayDate).subtract(days, 'day').toDate()

  return currentDate.toDateString() === addDays.toDateString()
}

export function isToday(birthdayDate: Date): boolean {
  // get current date
  const currentDate = new Date()
  // compare current date to birthday date
  return currentDate.toDateString() === birthdayDate.toDateString()
}

export function currentDateTimezoneToUtc(
  timeZoneString: string,
  inputDate: Date
): Date {
  // convert input date to utc using timezone
  const utcDate = new Date(
    inputDate.toLocaleString('en-US', {
      timeZone: timeZoneString
    })
  )
  return utcDate
}
