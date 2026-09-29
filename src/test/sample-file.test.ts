import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { aggregateByDate, aggregateGifts, applyFilters, filterByDelivered } from '../lib/analytics'
import { normalizeRecords } from '../lib/records'

const records = normalizeRecords(readFileSync('public/mau-du-lieu.csv', 'utf8'))

describe('public/mau-du-lieu.csv', () => {
  it('loads every row of the sample file shipped with the app', () => {
    expect(records).toHaveLength(24)
    expect(records.every((record) => record.dateSource === 'deliveredAt')).toBe(true)
  })

  it('keeps the Vietnamese gift names intact', () => {
    const gifts = new Set(records.map((record) => record.gift))
    expect(gifts).toContain('BÌNH NƯỚC + LỐC ROCKSTAR')
    expect(gifts).toContain('NÓN BẢO HIỂM + THÙNG ROCKSTAR')
    expect(gifts).toContain('ÁO KHOAC PHẢN CHIẾU + MŨ BẢO HIỂM')
    expect(gifts).toContain('BALO GIẮT TAY + TÚI VẢI')
  })

  it('totals the delivered gifts per day, newest first', () => {
    const delivered = filterByDelivered(records, true)
    expect(aggregateByDate(delivered).map((item) => [item.date, item.total])).toEqual([
      ['24/09/2026', 5],
      ['23/09/2026', 7],
      ['22/09/2026', 11],
    ])
  })

  it('answers "how many gifts on 22/09/2026"', () => {
    const filtered = applyFilters(records, { date: '22/09/2026', gift: null, onlyDelivered: true })
    const stats = aggregateGifts(filtered)
    expect(stats.map((item) => [item.gift, item.count])).toEqual([
      ['BÌNH NƯỚC + LỐC ROCKSTAR', 4],
      ['NÓN BẢO HIỂM + THÙNG ROCKSTAR', 4],
      ['ÁO KHOAC PHẢN CHIẾU + MŨ BẢO HIỂM', 3],
    ])
    expect(stats.reduce((sum, item) => sum + item.count, 0)).toBe(11)
  })
})
