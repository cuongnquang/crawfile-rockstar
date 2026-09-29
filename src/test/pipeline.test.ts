import { describe, expect, it } from 'vitest'
import {
  aggregateByDate,
  aggregateGifts,
  applyFilters,
  listDates,
  listGifts,
  sumCounts,
} from '../lib/analytics'
import { buildExportCsv, buildExportFileName } from '../lib/export'
import { normalizeRecords } from '../lib/records'
import { GIFT_A, GIFT_B, csvOf, row } from './fixtures'

/** A deliberately messy document: BOM, CRLF, blank line, quoted comma, padding. */
const MESSY_CSV =
  '﻿' +
  [
    'Đổi lúc, Mã khách, Tên khách, Số điện thoại, Phần quà, Điểm đã trừ, Đã phát, PG phát, Phát lúc, Có ảnh, Đường dẫn ảnh',
    '',
    row({
      exchangedAt: '22/09/2026 08:33:55',
      code: 'KH001',
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      gift: GIFT_A,
      points: '10',
      delivered: 'x',
      pg: 'PG 06',
      deliveredAt: '22/09/2026 08:33:55',
    }),
    row({
      exchangedAt: '22/09/2026 09:10:00',
      code: 'KH002',
      name: 'Trần Thị B',
      phone: '0901234567',
      gift: GIFT_A,
      points: '10',
      delivered: 'X',
      pg: 'PG 01',
      deliveredAt: '22/09/2026 09:10:00',
    }),
    row({
      exchangedAt: '22/09/2026 10:00:00',
      code: 'KH003',
      name: 'Lê Văn C',
      phone: '0901234567',
      gift: GIFT_B,
      points: '20',
      delivered: '',
      pg: 'PG 02',
      deliveredAt: '22/09/2026 10:00:00',
    }),
    row({
      exchangedAt: '23/09/2026 08:00:00',
      code: 'KH004',
      name: 'Hoàng Văn E',
      phone: '0901234567',
      gift: GIFT_B,
      points: '20',
      delivered: '1',
      pg: 'PG 01',
      deliveredAt: '23/09/2026 08:00:00',
    }),
    row({
      exchangedAt: '24/09/2026 08:00:00',
      code: 'KH005',
      name: 'Phạm, Thị D',
      phone: '0901234567',
      gift: 'NÓN BẢO HIỂM, THÙNG ROCKSTAR',
      points: '20',
      delivered: 'true',
      pg: 'PG 02',
      deliveredAt: '24/09/2026 08:00:00',
    }),
    ',,,,,,,,,,',
    row({
      exchangedAt: '24/09/2026 09:00:00',
      code: 'KH006',
      name: 'Vũ Thị F',
      phone: '0901234567',
      gift: GIFT_A,
      points: '10',
      delivered: 'x',
      pg: 'PG 06',
      deliveredAt: '31/02/2026 09:00:00',
    }),
  ].join('\r\n')

describe('end to end: upload → filter → aggregate → export', () => {
  const records = normalizeRecords(MESSY_CSV)

  it('normalises every row, skipping blanks and unparsable fields', () => {
    expect(records).toHaveLength(6)
  })

  it('falls back to Đổi lúc when Phát lúc is impossible', () => {
    const fallback = records.find((record) => record.customerCode === 'KH006')
    expect(fallback?.usedFallback).toBe(true)
    expect(fallback?.date).toBe('24/09/2026')
  })

  it('exposes the dynamic filter options', () => {
    expect(listDates(records)).toEqual(['24/09/2026', '23/09/2026', '22/09/2026'])
    expect([...listGifts(records)].sort()).toEqual(
      [GIFT_A, 'NÓN BẢO HIỂM, THÙNG ROCKSTAR', GIFT_B].sort(),
    )
  })

  it('totals the whole file per day', () => {
    expect(aggregateByDate(records).map((item) => item.total)).toEqual([2, 1, 3])
  })

  it('answers "how many gifts on 22/09/2026"', () => {
    const filtered = applyFilters(records, { date: '22/09/2026', gift: null, onlyDelivered: true })
    const stats = aggregateGifts(filtered)
    expect(stats).toEqual([{ gift: GIFT_A, count: 2, percentage: 100 }])
    expect(sumCounts(stats)).toBe(2)
  })

  it('narrows down to a single gift', () => {
    const filtered = applyFilters(records, { date: null, gift: GIFT_B, onlyDelivered: true })
    const stats = aggregateGifts(filtered)
    expect(stats).toEqual([{ gift: GIFT_B, count: 1, percentage: 100 }])
  })

  it('exports exactly the filtered rows and can be parsed back', () => {
    const filtered = applyFilters(records, {
      date: '24/09/2026',
      gift: 'NÓN BẢO HIỂM, THÙNG ROCKSTAR',
      onlyDelivered: true,
    })
    const csv = buildExportCsv(filtered)
    expect(csv.split('\r\n')).toHaveLength(2)
    expect(csv).toContain('"Phạm, Thị D"')
    expect(csv).toContain('"NÓN BẢO HIỂM, THÙNG ROCKSTAR"')

    const reparsed = normalizeRecords(csv)
    expect(reparsed).toHaveLength(1)
    expect(reparsed[0].customerName).toBe('Phạm, Thị D')
    expect(reparsed[0].gift).toBe('NÓN BẢO HIỂM, THÙNG ROCKSTAR')
    expect(reparsed[0].date).toBe('24/09/2026')
  })

  it('suggests a descriptive export file name', () => {
    expect(buildExportFileName('qua-da-doi-20260929-1228.csv', '22/09/2026', null)).toBe(
      'qua-da-doi-20260929-1228_22-09-2026.csv',
    )
  })

  it('keeps the gift containing a comma intact through a re-export', () => {
    const filtered = applyFilters(records, { date: '24/09/2026', gift: null, onlyDelivered: true })
    const reExported = normalizeRecords(buildExportCsv(filtered))
    expect([...reExported.map((item) => item.gift)].sort()).toEqual(
      [GIFT_A, 'NÓN BẢO HIỂM, THÙNG ROCKSTAR'].sort(),
    )
  })

  it('produces an empty export when nothing matches', () => {
    const filtered = applyFilters(records, { date: '01/01/2020', gift: null, onlyDelivered: true })
    expect(aggregateGifts(filtered)).toEqual([])
    expect(sumCounts(aggregateGifts(filtered))).toBe(0)
    expect(buildExportCsv(filtered).split('\r\n')).toHaveLength(1)
  })

  it('still parses a clean export of the standard fixture', () => {
    const clean = normalizeRecords(csvOf(row({ deliveredAt: '22/09/2026 08:00:00', gift: GIFT_A })))
    expect(clean).toHaveLength(1)
  })
})
