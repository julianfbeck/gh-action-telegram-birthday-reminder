import * as core from '@actions/core'
import * as fs from 'node:fs/promises'
import {
  currentDateTimezoneToUtc,
  isCurrentDateXDaysBeforeBirthdayDate,
  isToday
} from './time'
import {Bot} from 'grammy'
import {parse} from 'yaml'
import path from 'path'
import dayjs from 'dayjs'
async function run(): Promise<void> {
  try {
    const botToken: string = core.getInput('bot_token')
    const chatId: string = core.getInput('chat_id')

    if (botToken === '' || chatId === '') {
      core.setFailed('bot_token or chat_id is empty')
      return
    }
    const birthdayFilePath: string = core.getInput('birthday_file')
    if (birthdayFilePath === '') {
      core.setFailed('birthday_file is empty')
      return
    }
    await sendMessage(botToken, chatId, 'Hello world!')
    //output the contents of the file
    if (process.env.GITHUB_WORKSPACE) {
      const birthdayFile = await fs.readFile(
        path.join(process.env.GITHUB_WORKSPACE, birthdayFilePath),
        'utf8'
      )
      const firstReminder: string | undefined = core.getInput('first_reminder')
      const secondReminder: string | undefined =
        core.getInput('second_reminder')
      if (firstReminder && isNaN(parseInt(firstReminder))) {
        core.setFailed('first_reminder is not a number')
        return
      }
      if (secondReminder && isNaN(parseInt(secondReminder))) {
        core.setFailed('second_reminder is not a number')
        return
      }
      const birthdayYaml = parse(birthdayFile) as BirthdayYAMLFile
      const reminders = remindersForPeople(
        birthdayYaml,
        firstReminder,
        secondReminder
      )
      for (const reminder of reminders) {
        //check if date is today
        if (isToday(dayjs(reminder.date).toDate())) {
          let message = `Today is ${reminder.name}'s birthday!\n`
          //calculate age if year is not missing
          if (reminder.originalYear) {
            //calculate age
            const age =
              new Date().getFullYear() - parseInt(reminder.originalYear)
            message += ` They are ${age} years old.\n`
          }
          //add date if it exists
          if (reminder.date) {
            message += ` ${reminder.date}\n`
          }
          if (reminder.info) {
            message += ` ${reminder.info}`
          }
          await sendMessage(botToken, chatId, message)
        } else {
          //reminder is in the future
          const daysUntilBirthday = dayjs(reminder.date).diff(dayjs(), 'day')
          let message = `Reminder: ${reminder.name}'s birthday is in ${daysUntilBirthday} days.\n`
          message += ` ${reminder.date}`

          if (reminder.info) {
            message += ` ${reminder.info}`
          }
          await sendMessage(botToken, chatId, message)
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

function remindersForPeople(
  yamlFile: BirthdayYAMLFile,
  firstReminder: string | undefined,
  secondReminder: string | undefined
): Birthday[] {
  const reminders: Birthday[] = []
  for (const birthday of yamlFile.birthdays) {
    let dateString = ''
    //because depending on the yaml parser, the date can be a string or a Date object
    if (typeof birthday.date === 'string') {
      dateString = birthday.date
    } else if (birthday.date instanceof Date) {
      dateString = birthday.date.toISOString()
    }
    core.debug(`dateString ${dateString}`)
    if (dateString.split('-').length === 2) {
      //get current year
      const yearString = new Date().getFullYear().toString()
      birthday.date = `${yearString}-${dateString}`
    } else if (dateString.split('-').length === 3) {
      //also replace the year with the current year
      const yearString = new Date().getFullYear().toString()
      birthday.date = `${yearString}-${dateString.split('-')[1]}-${
        dateString.split('-')[2]
      }`
      birthday.originalYear = dateString.split('-')[0]
      core.debug(`originalYear ${birthday.originalYear}`)
    } else {
      core.setFailed('date is not in the correct format')
    }
    core.debug(`dateString after ${birthday.date}`)

    const date = currentDateTimezoneToUtc(
      yamlFile.timezone,
      new Date(birthday.date)
    )
    core.debug(`date ${date}`)
    if (isToday(date)) {
      reminders.push(birthday)
    }

    if (firstReminder) {
      core.debug(`firstReminder ${firstReminder}`)
      isCurrentDateXDaysBeforeBirthdayDate(parseInt(firstReminder), date) &&
        reminders.push(birthday)
    }
    if (secondReminder) {
      isCurrentDateXDaysBeforeBirthdayDate(parseInt(secondReminder), date) &&
        reminders.push(birthday)
    }
  }
  return reminders
}

async function sendMessage(
  token: string,
  chatId: string,
  message: string
): Promise<void> {
  const bot = new Bot(token)
  await bot.api.sendMessage(chatId, message)
}
export interface BirthdayYAMLFile {
  timezone: string
  birthdays: Birthday[]
}

export interface Birthday {
  name: string
  date: string | Date
  originalYear?: string
  info?: string
}

run()
