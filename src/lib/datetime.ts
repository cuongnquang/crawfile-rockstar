/** Date helpers for the `DD/MM/YYYY HH:mm:ss` format used by the source CSV. */

export const DATE_TIME_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/
export const DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

export interface ParsedDateTime {
  day: string
  month: string
  year: string
  hour: string
  minute: string
  second: string
  /** Sortable local key: YYYYMMDDHHmmss */
  sortKey: string
  /** Date portion only: DD/MM/YYYY */
  date: string
  /** Time portion only: HH:mm:ss */
  time: string
  timestamp: number
}

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * Parses `DD/MM/YYYY HH:mm:ss` (or `DD/MM/YYYY HH:mm`, or a bare `DD/MM/YYYY`).
 * Returns `null` for anything invalid — including impossible dates such as 31/02.
 */
export function parseDateTime(input: string | null | undefined): ParsedDateTime | null {
  if (input == null) return null
  const value = input.trim()
  if (value === '') return null

  const match = DATE_TIME_PATTERN.exec(value) ?? null
  if (match) {
    const [, d, m, y, hh, mm, ss] = match
    return build(d, m, y, hh, mm, ss ?? '0')
  }

  const dateOnly = DATE_PATTERN.exec(value)
  if (dateOnly) {
    const [, d, m, y] = dateOnly
    return build(d, m, y, '0', '0', '0')
  }

  return null
}

function build(
  d: string,
  m: string,
  y: string,
  hh: string,
  mm: string,
  ss: string,
): ParsedDateTime | null {
  const day = Number(d)
  const month = Number(m)
  const year = Number(y)
  const hour = Number(hh)
  const minute = Number(mm)
  const second = Number(ss)

  if (month < 1 || month > 12) return null
  if (day < 1 || day > daysInMonth(year, month)) return null
  if (hour > 23 || minute > 59 || second > 59) return null

  const day2 = pad(day)
  const month2 = pad(month)
  const time = `${pad(hour)}:${pad(minute)}:${pad(second)}`

  return {
    day: day2,
    month: month2,
    year: String(year),
    hour: pad(hour),
    minute: pad(minute),
    second: pad(second),
    sortKey: `${year}${month2}${day2}${pad(hour)}${pad(minute)}${pad(second)}`,
    date: `${day2}/${month2}/${year}`,
    time,
    timestamp: new Date(year, month - 1, day, hour, minute, second).getTime(),
  }
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** Extracts the `DD/MM/YYYY` part of a timestamp string, or `null`. */
export function extractDate(input: string | null | undefined): string | null {
  return parseDateTime(input)?.date ?? null
}

/** Today's date formatted as `DD/MM/YYYY` using local time. */
export function todayAsDisplayDate(now: Date = new Date()): string {
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`
}
