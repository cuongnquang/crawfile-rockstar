import { COLUMN_LABELS, type GiftRecord } from './records'

/** Escapes a single CSV cell (quotes, commas, newlines, leading/trailing space). */
export function escapeCsvCell(value: string, delimiter = ','): string {
  const needsQuotes =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r') ||
    value !== value.trim()
  if (!needsQuotes) return value
  return `"${value.replace(/"/g, '""')}"`
}

export function toCsv(rows: string[][], delimiter = ','): string {
  return rows
    .map((row) => row.map((cell) => escapeCsvCell(cell, delimiter)).join(delimiter))
    .join('\r\n')
}

const DETAIL_COLUMNS = [
  COLUMN_LABELS['Đổi lúc'],
  COLUMN_LABELS['Mã khách'],
  COLUMN_LABELS['Tên khách'],
  COLUMN_LABELS['Số điện thoại'],
  COLUMN_LABELS['Phần quà'],
  COLUMN_LABELS['Điểm đã trừ'],
  COLUMN_LABELS['Đã phát'],
  COLUMN_LABELS['PG phát'],
  COLUMN_LABELS['Phát lúc'],
  COLUMN_LABELS['Đường dẫn ảnh'],
] as const

function recordToCells(record: GiftRecord): string[] {
  return [
    record.exchangedAt,
    record.customerCode,
    record.customerName,
    record.phone,
    record.gift,
    record.points,
    record.delivered,
    record.deliveredBy,
    record.deliveredAt,
    record.photoUrl,
  ]
}

/** Serialises the currently filtered records, header row included. */
export function buildExportCsv(records: GiftRecord[]): string {
  const rows: string[][] = [[...DETAIL_COLUMNS], ...records.map(recordToCells)]
  return toCsv(rows)
}

/** Triggers a browser download of the given CSV text. */
export function downloadCsv(csv: string, fileName: string): void {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function buildExportFileName(
  baseName: string,
  date: string | null,
  gift: string | null,
): string {
  const parts = [baseName.replace(/\.csv$/i, ''), date?.replaceAll('/', '-'), gift]
    .filter((part): part is string => Boolean(part))
    .map((part) => part.replace(/[\\/:*?"<>|]/g, '').trim())
    .filter((part) => part !== '')
  const suffix = parts.slice(1).join('_')
  return suffix ? `${parts[0]}_${suffix}.csv` : `${parts[0] || 'export'}.csv`
}
