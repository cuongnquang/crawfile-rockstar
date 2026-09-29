import { describe, expect, it } from 'vitest'
import { assertCsvFile } from '../lib/file'

const makeFile = (name: string, size = 10, type = 'text/csv') =>
  new File([new Uint8Array(size)], name, { type })

describe('assertCsvFile', () => {
  it('accepts a .csv file', () => {
    expect(() => assertCsvFile(makeFile('qua.csv'))).not.toThrow()
  })

  it('accepts an upper-case extension', () => {
    expect(() => assertCsvFile(makeFile('QUA.CSV'))).not.toThrow()
  })

  it('rejects a non-CSV file', () => {
    expect(() => assertCsvFile(makeFile('anh.png', 10, 'image/png'))).toThrowError(
      'Vui lòng chọn file CSV.',
    )
  })

  it('rejects a file with no csv extension', () => {
    expect(() => assertCsvFile(makeFile('qua.txt'))).toThrowError('Vui lòng chọn file CSV.')
  })

  it('rejects an empty file', () => {
    expect(() => assertCsvFile(makeFile('qua.csv', 0))).toThrowError('File CSV không có dữ liệu.')
  })
})
