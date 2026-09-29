import { describe, expect, it } from 'vitest'
import { buildHeaders, detectDelimiter, parseCSV, parseDelimited, stripBom } from '../lib/csv'
import { csvOf, row } from './fixtures'

const HEADER =
  'Đổi lúc,Mã khách,Tên khách,Số điện thoại,Phần quà,Điểm đã trừ,Đã phát,PG phát,Phát lúc,Có ảnh,Đường dẫn ảnh'

describe('stripBom', () => {
  it('removes the UTF-8 BOM', () => {
    expect(stripBom('\uFEFFabc')).toBe('abc')
  })

  it('leaves text without BOM untouched', () => {
    expect(stripBom('abc')).toBe('abc')
  })
})

describe('detectDelimiter', () => {
  it('detects comma', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',')
  })

  it('detects semicolon', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';')
  })

  it('detects tab', () => {
    expect(detectDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t')
  })

  it('ignores delimiters inside quotes', () => {
    expect(detectDelimiter('"a,b",c\n1,2')).toBe(',')
  })
})

describe('parseDelimited', () => {
  it('handles quotes, commas inside fields and escaped quotes', () => {
    const matrix = parseDelimited('a,b\n"Nguyễn, An","he said ""hi"""', ',')
    expect(matrix).toEqual([
      ['a', 'b'],
      ['Nguyễn, An', 'he said "hi"'],
    ])
  })

  it('handles newlines inside quoted fields', () => {
    const matrix = parseDelimited('a,b\n"line1\nline2",x', ',')
    expect(matrix[1]).toEqual(['line1\nline2', 'x'])
  })

  it('normalises CRLF and lone CR line endings', () => {
    expect(parseDelimited('a,b\r\n1,2\r3,4', ',')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ])
  })

  it('skips blank lines and keeps short rows as-is', () => {
    expect(parseDelimited('a,b,c\n\n1,2\n\n', ',')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2'],
    ])
  })

  it('strips a leading BOM', () => {
    expect(parseDelimited('\uFEFFa,b\n1,2', ',')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })
})

describe('buildHeaders', () => {
  it('trims and collapses whitespace', () => {
    expect(buildHeaders(['  Phần   quà  '])).toEqual(['Phần quà'])
  })

  it('suffixes duplicate headers so no column is lost', () => {
    expect(buildHeaders(['Phần quà', 'Phần quà'])).toEqual(['Phần quà', 'Phần quà (2)'])
  })

  it('names empty headers positionally', () => {
    expect(buildHeaders(['a', '', 'b'])).toEqual(['a', 'Cột 2', 'b'])
  })
})

describe('parseCSV', () => {
  it('parses a valid Vietnamese CSV', () => {
    const csv = `${HEADER}\r\n22/09/2026 08:33:55,DH001,Nguyễn Văn A,0901234567,BÌNH NƯỚC + LỐC ROCKSTAR,10,x,PG 06,22/09/2026 08:33:55,,\r\n`
    const rows = parseCSV(csv)

    expect(rows).toHaveLength(1)
    expect(rows[0]['Phần quà']).toBe('BÌNH NƯỚC + LỐC ROCKSTAR')
    expect(rows[0]['Tên khách']).toBe('Nguyễn Văn A')
    expect(rows[0]['Phát lúc']).toBe('22/09/2026 08:33:55')
  })

  it('preserves Vietnamese diacritics exactly', () => {
    const csv = csvOf(
      row({
        exchangedAt: '22/09/2026 08:33:55',
        code: 'KH009',
        name: 'Nguyễn Thị Hoàng Ánh',
        gift: 'NÓN BẢO HIỂM + THÙNG ROCKSTAR',
        delivered: 'x',
        pg: 'PG 01',
        deliveredAt: '22/09/2026 08:33:55',
      }),
    )
    const parsed = parseCSV(csv)[0]
    expect(parsed['Phần quà']).toBe('NÓN BẢO HIỂM + THÙNG ROCKSTAR')
    expect(parsed['Tên khách']).toBe('Nguyễn Thị Hoàng Ánh')
  })

  it('returns an empty array for an empty document', () => {
    expect(parseCSV('')).toEqual([])
  })
})
