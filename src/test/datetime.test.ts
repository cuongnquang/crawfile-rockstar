import { describe, expect, it } from 'vitest'
import { extractDate, parseDateTime } from '../lib/datetime'

describe('parseDateTime', () => {
  it('parses DD/MM/YYYY HH:mm:ss', () => {
    const parsed = parseDateTime('22/09/2026 08:33:55')
    expect(parsed).not.toBeNull()
    expect(parsed?.day).toBe('22')
    expect(parsed?.month).toBe('09')
    expect(parsed?.year).toBe('2026')
    expect(parsed?.hour).toBe('08')
    expect(parsed?.minute).toBe('33')
    expect(parsed?.second).toBe('55')
  })

  it('exposes the date, time and a sortable key', () => {
    const parsed = parseDateTime('22/09/2026 08:33:55')
    expect(parsed?.date).toBe('22/09/2026')
    expect(parsed?.time).toBe('08:33:55')
    expect(parsed?.sortKey).toBe('20260922083355')
  })

  it('zero-pads single digit days and months', () => {
    expect(parseDateTime('1/2/2026 3:04:05')?.date).toBe('01/02/2026')
  })

  it('accepts a date without a time part', () => {
    expect(parseDateTime('24/09/2026')?.sortKey).toBe('20260924000000')
  })

  it('accepts a missing seconds segment', () => {
    expect(parseDateTime('22/09/2026 08:33')?.second).toBe('00')
  })

  it('tolerates surrounding whitespace', () => {
    expect(parseDateTime('  22/09/2026 08:33:55  ')?.date).toBe('22/09/2026')
  })

  it('rejects an impossible day', () => {
    expect(parseDateTime('31/02/2026 08:00:00')).toBeNull()
  })

  it('rejects an out-of-range month', () => {
    expect(parseDateTime('22/13/2026 08:00:00')).toBeNull()
  })

  it('rejects an out-of-range time', () => {
    expect(parseDateTime('22/09/2026 25:00:00')).toBeNull()
  })

  it('rejects unparsable and empty values', () => {
    expect(parseDateTime('abc')).toBeNull()
    expect(parseDateTime('')).toBeNull()
    expect(parseDateTime('   ')).toBeNull()
    expect(parseDateTime(null)).toBeNull()
    expect(parseDateTime(undefined)).toBeNull()
  })
})

describe('extractDate', () => {
  it('returns the DD/MM/YYYY portion', () => {
    expect(extractDate('22/09/2026 08:33:55')).toBe('22/09/2026')
  })

  it('returns null for invalid input', () => {
    expect(extractDate('not a date')).toBeNull()
  })
})
