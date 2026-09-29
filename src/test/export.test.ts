import { describe, expect, it } from 'vitest'
import { applyFilters } from '../lib/analytics'
import { buildExportCsv, buildExportFileName, escapeCsvCell, toCsv } from '../lib/export'
import { normalizeRecords } from '../lib/records'
import { GIFT_A, GIFT_B, SAMPLE_CSV } from './fixtures'

const records = normalizeRecords(SAMPLE_CSV)

describe('escapeCsvCell', () => {
  it('leaves plain values untouched', () => {
    expect(escapeCsvCell('BÌNH NƯỚC')).toBe('BÌNH NƯỚC')
  })

  it('quotes values containing a delimiter', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"')
  })

  it('escapes double quotes', () => {
    expect(escapeCsvCell('he said "hi"')).toBe('"he said ""hi"""')
  })

  it('quotes values containing newlines', () => {
    expect(escapeCsvCell('a\nb')).toBe('"a\nb"')
  })
})

describe('toCsv', () => {
  it('joins rows with CRLF', () => {
    expect(
      toCsv([
        ['a', 'b'],
        ['1', '2'],
      ]),
    ).toBe('a,b\r\n1,2')
  })
})

describe('buildExportCsv', () => {
  it('exports only the filtered records, header first', () => {
    const filtered = applyFilters(records, {
      date: '22/09/2026',
      gift: GIFT_A,
      onlyDelivered: true,
    })
    const lines = buildExportCsv(filtered).split('\r\n')

    expect(lines).toHaveLength(4)
    expect(lines[0]).toBe(
      'Đổi lúc,Mã khách,Tên khách,Số điện thoại,Phần quà,Điểm đã trừ,Đã phát,PG phát,Phát lúc,Đường dẫn ảnh',
    )
    expect(lines.slice(1).every((line) => line.includes(GIFT_A))).toBe(true)
  })

  it('round-trips through the parser without losing Vietnamese text', () => {
    const csv = buildExportCsv(records)
    const [first] = normalizeRecords(csv)
    expect(first.gift).toBe(GIFT_A)
    expect(first.customerName).toBe('Nguyễn Văn A')
  })

  it('produces just the header when there is nothing to export', () => {
    expect(buildExportCsv([]).split('\r\n')).toEqual([
      'Đổi lúc,Mã khách,Tên khách,Số điện thoại,Phần quà,Điểm đã trừ,Đã phát,PG phát,Phát lúc,Đường dẫn ảnh',
    ])
  })

  it('quotes a gift name that contains a comma', () => {
    const csv =
      'Đổi lúc,Phần quà,Phát lúc\r\n22/09/2026 08:00:00,"BÌNH NƯỚC, LỐC",22/09/2026 08:00:00'
    const [record] = normalizeRecords(csv)
    expect(record.gift).toBe('BÌNH NƯỚC, LỐC')
    expect(buildExportCsv([record])).toContain('"BÌNH NƯỚC, LỐC"')
  })

  it('exports the un-delivered rows when the flag is off', () => {
    const filtered = applyFilters(records, {
      date: '22/09/2026',
      gift: GIFT_B,
      onlyDelivered: false,
    })
    expect(buildExportCsv(filtered).split('\r\n')).toHaveLength(2)
  })
})

describe('buildExportFileName', () => {
  it('appends the selected date and gift', () => {
    expect(buildExportFileName('qua.csv', '22/09/2026', GIFT_B)).toBe(
      'qua_22-09-2026_NÓN BẢO HIỂM + THÙNG ROCKSTAR.csv',
    )
  })

  it('falls back to the base name when nothing is filtered', () => {
    expect(buildExportFileName('qua.csv', null, null)).toBe('qua.csv')
  })

  it('sanitises characters that are illegal in file names', () => {
    expect(buildExportFileName('qua.csv', null, 'A/B:C')).toBe('qua_ABC.csv')
  })
})
