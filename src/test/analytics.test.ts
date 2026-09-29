import { describe, expect, it } from 'vitest'
import {
  aggregateByDate,
  aggregateGifts,
  applyFilters,
  filterByDate,
  filterByDelivered,
  filterByGift,
  listDates,
  listGifts,
  sumCounts,
  summarize,
} from '../lib/analytics'
import { CsvValidationError, isDelivered, normalizeRecords } from '../lib/records'
import { GIFT_A, GIFT_B, HEADER, SAMPLE_CSV, csvOf, row } from './fixtures'

const records = normalizeRecords(SAMPLE_CSV)

describe('isDelivered', () => {
  it('accepts every configured truthy value, case-insensitively', () => {
    for (const value of ['x', 'X', ' yes ', 'TRUE', '1']) {
      expect(isDelivered(value)).toBe(true)
    }
  })

  it('rejects empty and other values', () => {
    for (const value of ['', '   ', '0', 'không', null, undefined]) {
      expect(isDelivered(value)).toBe(false)
    }
  })
})

describe('normalizeRecords', () => {
  it('parses a valid CSV into normalised records', () => {
    expect(records).toHaveLength(6)
    expect(records[0].gift).toBe(GIFT_A)
    expect(records[0].customerName).toBe('Nguyễn Văn A')
    expect(records[0].date).toBe('22/09/2026')
    expect(records[0].dateSource).toBe('deliveredAt')
  })

  it('keeps Vietnamese diacritics intact', () => {
    expect(new Set(records.map((record) => record.gift))).toEqual(new Set([GIFT_A, GIFT_B]))
  })

  it('falls back to Đổi lúc when Phát lúc is missing or invalid', () => {
    const csv = csvOf(
      row({
        exchangedAt: '22/09/2026 08:00:00',
        code: 'KH001',
        name: 'Nguyễn Văn A',
        gift: GIFT_A,
        points: '10',
        delivered: 'x',
        pg: 'PG 01',
      }),
    )
    const [record] = normalizeRecords(csv)
    expect(record.dateSource).toBe('exchangedAt')
    expect(record.usedFallback).toBe(true)
    expect(record.date).toBe('22/09/2026')
  })

  it('strips a UTF-8 BOM from the header', () => {
    const [record] = normalizeRecords(`\uFEFF${SAMPLE_CSV}`)
    expect(record.gift).toBe(GIFT_A)
  })

  it('drops rows with an unusable date', () => {
    const csv = csvOf(
      row({}),
      row({ code: 'KH002' }),
      row({
        exchangedAt: '22/09/2026 08:00:00',
        code: 'KH003',
        gift: GIFT_A,
        delivered: 'x',
        deliveredAt: '22/09/2026 08:00:00',
      }),
    )
    expect(normalizeRecords(csv)).toHaveLength(1)
  })

  it('rejects an unparsable date instead of guessing', () => {
    const csv = csvOf(
      row({
        exchangedAt: '22/31/2026 08:00:00',
        code: 'KH001',
        gift: GIFT_A,
        deliveredAt: 'không xác định',
      }),
    )
    expect(() => normalizeRecords(csv)).toThrowError('File CSV không có dữ liệu.')
  })

  it('accepts a missing Phần quà column value via a placeholder', () => {
    const csv = csvOf(
      row({
        exchangedAt: '22/09/2026 08:00:00',
        code: 'KH001',
        delivered: 'x',
        deliveredAt: '22/09/2026 08:00:00',
      }),
    )
    expect(normalizeRecords(csv)[0].gift).toBe('(Không xác định)')
  })

  it('tolerates padding, blank cells and null-ish values', () => {
    const csv = `${HEADER}\r\n 22/09/2026 08:00:00 , KH001 , Nguyễn Văn A ,  , ${GIFT_A} , 10 , x , PG 01 , 22/09/2026 08:00:00 ,  ,  `
    const [record] = normalizeRecords(csv)
    expect(record.gift).toBe(GIFT_A)
    expect(record.customerCode).toBe('KH001')
    expect(record.phone).toBe('')
  })

  it('throws when the Phần quà column is missing', () => {
    const csv = 'Đổi lúc,Mã khách\n22/09/2026 08:00:00,K1'
    expect(() => normalizeRecords(csv)).toThrowError(
      new CsvValidationError('File CSV không đúng định dạng: thiếu cột "Phần quà".'),
    )
  })

  it('throws when no time column exists', () => {
    expect(() => normalizeRecords('Mã khách,Phần quà\nK1,BÌNH NƯỚC')).toThrowError(
      'Không tìm thấy cột thời gian.',
    )
  })

  it('throws when the file is empty', () => {
    expect(() => normalizeRecords('')).toThrowError('File CSV không có dữ liệu.')
  })

  it('throws when the file has a header but no usable rows', () => {
    expect(() => normalizeRecords(`${HEADER}\n,,\n,,\n`)).toThrowError('File CSV không có dữ liệu.')
  })
})

describe('filterByDate', () => {
  it('keeps only the selected day', () => {
    expect(filterByDate(records, '22/09/2026')).toHaveLength(4)
    expect(filterByDate(records, '23/09/2026')).toHaveLength(2)
  })

  it('returns everything when no date is selected', () => {
    expect(filterByDate(records, null)).toHaveLength(6)
  })

  it('returns nothing for a day that is not in the data', () => {
    expect(filterByDate(records, '01/01/2020')).toHaveLength(0)
  })
})

describe('filterByDelivered', () => {
  it('keeps only rows flagged as delivered', () => {
    expect(filterByDelivered(records, true)).toHaveLength(5)
  })

  it('returns everything when the flag is off', () => {
    expect(filterByDelivered(records, false)).toHaveLength(6)
  })
})

describe('filterByGift', () => {
  it('keeps only the selected gift', () => {
    expect(filterByGift(records, GIFT_B).every((record) => record.gift === GIFT_B)).toBe(true)
  })

  it('returns everything when no gift is selected', () => {
    expect(filterByGift(records, null)).toHaveLength(6)
  })
})

describe('aggregateGifts', () => {
  it('groups and counts by gift, sorted by count desc', () => {
    expect(aggregateGifts(records)).toEqual([
      { gift: GIFT_A, count: 3, percentage: 50 },
      { gift: GIFT_B, count: 3, percentage: 50 },
    ])
  })

  it('computes the percentage share of the total', () => {
    const rows = aggregateGifts(filterByDate(records, '22/09/2026'))
    expect(rows).toEqual([
      { gift: GIFT_A, count: 3, percentage: 75 },
      { gift: GIFT_B, count: 1, percentage: 25 },
    ])
  })

  it('returns an empty list for no records', () => {
    expect(aggregateGifts([])).toEqual([])
  })
})

describe('sumCounts', () => {
  it('adds the counts', () => {
    expect(sumCounts(aggregateGifts(records))).toBe(6)
  })
})

describe('aggregateByDate', () => {
  it('totals per day, newest first', () => {
    expect(aggregateByDate(records)).toEqual([
      { date: '23/09/2026', total: 2, sortKey: '20260923' },
      { date: '22/09/2026', total: 4, sortKey: '20260922' },
    ])
  })
})

describe('listGifts / listDates', () => {
  it('lists distinct gifts', () => {
    expect(listGifts(records)).toEqual([GIFT_A, GIFT_B])
  })

  it('lists distinct dates newest first', () => {
    expect(listDates(records)).toEqual(['23/09/2026', '22/09/2026'])
  })
})

describe('applyFilters + summarize', () => {
  it('combines date, gift and delivered filters', () => {
    const filtered = applyFilters(records, {
      date: '22/09/2026',
      gift: GIFT_A,
      onlyDelivered: true,
    })
    expect(filtered).toHaveLength(3)
  })

  it('produces the summary for the default filter set', () => {
    const filtered = applyFilters(records, { date: '22/09/2026', gift: null, onlyDelivered: true })
    const stats = aggregateGifts(filtered)
    expect(summarize(filtered, stats)).toEqual({
      date: '22/09/2026',
      giftCount: 1,
      total: 3,
    })
  })

  it('counts un-delivered rows too when the flag is off', () => {
    const filtered = applyFilters(records, { date: '22/09/2026', gift: null, onlyDelivered: false })
    const stats = aggregateGifts(filtered)
    expect(summarize(filtered, stats)).toEqual({
      date: '22/09/2026',
      giftCount: 2,
      total: 4,
    })
  })

  it('reports a null date when nothing is selected', () => {
    const filtered = applyFilters(records, { date: null, gift: GIFT_A, onlyDelivered: true })
    const stats = aggregateGifts(filtered)
    expect(summarize(filtered, stats)).toEqual({ date: '22/09/2026', giftCount: 1, total: 3 })
  })
})
