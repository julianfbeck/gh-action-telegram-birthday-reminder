import {
  currentDateTimezoneToUtc,
  isToday,
  isCurrentDateXDaysBeforeBirthdayDate
} from '../src/time'

import {expect, test} from '@jest/globals'
import dayjs from 'dayjs'

test('converts to current date', () => {
  const timeZone = 'Europe/Berlin'
  const output = currentDateTimezoneToUtc(timeZone, new Date())
  //check if output is current date
  expect(output.toDateString()).toBe(new Date().toDateString())
})

test('date is today', () => {
  const date = new Date()
  expect(isToday(date)).toBe(true)

  const date2 = dayjs().add(1, 'day').toDate()
  expect(isToday(date2)).toBe(false)
})

test('date is x days before birthday', () => {
  const date = dayjs().add(1, 'day').toDate()
  expect(isCurrentDateXDaysBeforeBirthdayDate(1, date)).toBe(true)

  const date2 = dayjs().add(2, 'day').toDate()
  expect(isCurrentDateXDaysBeforeBirthdayDate(1, date2)).toBe(false)

  const date3 = dayjs().toDate()
  expect(isCurrentDateXDaysBeforeBirthdayDate(1, date3)).toBe(false)
})
