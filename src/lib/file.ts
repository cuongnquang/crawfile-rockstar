import { CsvValidationError } from './records'

/** Guards the "please choose a CSV file" case before any parsing happens. */
export function assertCsvFile(file: File): void {
  const isCsvName = /\.csv$/i.test(file.name)
  const isCsvMime = [
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'text/plain',
    '',
  ].includes(file.type)
  if (!isCsvName && !isCsvMime) {
    throw new CsvValidationError('Vui lòng chọn file CSV.')
  }
  if (!isCsvName) {
    throw new CsvValidationError('Vui lòng chọn file CSV.')
  }
  if (file.size === 0) {
    throw new CsvValidationError('File CSV không có dữ liệu.')
  }
}

const textDecoder = (encoding: string) => new TextDecoder(encoding)

/**
 * Decodes the file in the browser, preferring UTF-8 and falling back to
 * Windows-1252 (a very common source of mojibake in Vietnamese exports).
 */
export async function readFileAsText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return textDecoder('utf-16le').decode(bytes.subarray(2))
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return textDecoder('utf-16be').decode(bytes.subarray(2))
  }

  const utf8 = textDecoder('utf-8').decode(bytes)
  if (!utf8.includes('\uFFFD')) return utf8

  const fallback = textDecoder('windows-1252').decode(bytes)
  return fallback.includes('\uFFFD') ? utf8 : fallback
}
