import { parseCSV, type RawRow } from './csv'
import { extractDate, parseDateTime, type ParsedDateTime } from './datetime'

/** Canonical column names of the source export. */
export const COLUMN = {
  exchangedAt: 'Đổi lúc',
  customerCode: 'Mã khách',
  customerName: 'Tên khách',
  phone: 'Số điện thoại',
  gift: 'Phần quà',
  points: 'Điểm đã trừ',
  delivered: 'Đã phát',
  deliveredBy: 'PG phát',
  deliveredAt: 'Phát lúc',
  hasPhoto: 'Có ảnh',
  photoUrl: 'Đường dẫn ảnh',
} as const

export const COLUMN_LABELS: Record<string, string> = {
  [COLUMN.exchangedAt]: 'Đổi lúc',
  [COLUMN.customerCode]: 'Mã khách',
  [COLUMN.customerName]: 'Tên khách',
  [COLUMN.phone]: 'Số điện thoại',
  [COLUMN.gift]: 'Phần quà',
  [COLUMN.points]: 'Điểm đã trừ',
  [COLUMN.delivered]: 'Đã phát',
  [COLUMN.deliveredBy]: 'PG phát',
  [COLUMN.deliveredAt]: 'Phát lúc',
  [COLUMN.hasPhoto]: 'Có ảnh',
  [COLUMN.photoUrl]: 'Đường dẫn ảnh',
}

/** Values that are truthy, lowercase, for the `Đã phát` column. */
export const DELIVERED_TRUTHY_VALUES = new Set(['x', 'yes', 'true', '1'])

export interface GiftRecord {
  id: number
  exchangedAt: string
  customerCode: string
  customerName: string
  phone: string
  gift: string
  points: string
  delivered: string
  deliveredBy: string
  deliveredAt: string
  hasPhoto: string
  photoUrl: string
  /** Raw `Phát lúc` value. */
  rawDeliveredAt: string
  /** Raw `Đổi lúc` value. */
  rawExchangedAt: string
  /** `Phát lúc` parsed, else `Đổi lúc` parsed. */
  effectiveAt: ParsedDateTime | null
  /** Which column produced `effectiveAt`. */
  dateSource: 'deliveredAt' | 'exchangedAt' | null
  /** `DD/MM/YYYY` of `effectiveAt`. */
  date: string | null
  /** Sortable `YYYYMMDD` of `effectiveAt`, empty when there is no date. */
  dayKey: string
  /** Sortable `YYYYMMDDHHmmss` of `effectiveAt`. */
  sortKey: string
  /** True when `Phát lúc` had no usable value. */
  usedFallback: boolean
}

export class CsvValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CsvValidationError'
  }
}

const NULLISH = new Set(['', 'null', 'n/a', 'na', '-', 'undefined', 'nil'])

function clean(value: string | undefined): string {
  const trimmed = (value ?? '').trim()
  return NULLISH.has(trimmed.toLowerCase()) ? '' : trimmed
}

/** Finds a column by exact match, then by accent/case insensitive match. */
export function findColumn(headers: string[], target: string): string | null {
  if (headers.includes(target)) return target
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[\s_]+/g, '')
      .toLowerCase()
  const needle = normalize(target)
  return headers.find((header) => normalize(header) === needle) ?? null
}

/**
 * The single place that decides whether a row counts as "delivered".
 * Kept isolated so the business rule can change without touching the pipeline.
 */
export function isDelivered(value: string | null | undefined): boolean {
  return DELIVERED_TRUTHY_VALUES.has((value ?? '').trim().toLowerCase())
}

/** Text -> validated, normalised records. Throws `CsvValidationError`. */
export function normalizeRecords(text: string): GiftRecord[] {
  const raw = parseCSV(text)
  if (raw.length === 0) throw new CsvValidationError('File CSV không có dữ liệu.')

  const headers = Object.keys(raw[0])
  const giftColumn = findColumn(headers, COLUMN.gift)
  if (!giftColumn) {
    throw new CsvValidationError(`File CSV không đúng định dạng: thiếu cột "${COLUMN.gift}".`)
  }

  const deliveredAtColumn = findColumn(headers, COLUMN.deliveredAt)
  const exchangedAtColumn = findColumn(headers, COLUMN.exchangedAt)
  if (!deliveredAtColumn && !exchangedAtColumn) {
    throw new CsvValidationError('Không tìm thấy cột thời gian.')
  }

  const value = (row: RawRow, column: string | null): string => (column ? clean(row[column]) : '')

  const records: GiftRecord[] = []
  raw.forEach((row, index) => {
    const rawDeliveredAt = value(row, deliveredAtColumn)
    const rawExchangedAt = value(row, exchangedAtColumn)
    const fromDelivered = parseDateTime(rawDeliveredAt)
    const fromExchanged = fromDelivered ? null : parseDateTime(rawExchangedAt)
    const effectiveAt = fromDelivered ?? fromExchanged
    if (!effectiveAt) return

    records.push({
      id: index,
      exchangedAt: rawExchangedAt,
      customerCode: value(row, findColumn(headers, COLUMN.customerCode)),
      customerName: value(row, findColumn(headers, COLUMN.customerName)),
      phone: value(row, findColumn(headers, COLUMN.phone)),
      gift: value(row, giftColumn) || '(Không xác định)',
      points: value(row, findColumn(headers, COLUMN.points)),
      delivered: value(row, findColumn(headers, COLUMN.delivered)),
      deliveredBy: value(row, findColumn(headers, COLUMN.deliveredBy)),
      deliveredAt: rawDeliveredAt,
      hasPhoto: value(row, findColumn(headers, COLUMN.hasPhoto)),
      photoUrl: value(row, findColumn(headers, COLUMN.photoUrl)),
      rawDeliveredAt,
      rawExchangedAt,
      effectiveAt,
      dateSource: fromDelivered ? 'deliveredAt' : 'exchangedAt',
      date: effectiveAt.date,
      dayKey: `${effectiveAt.year}${effectiveAt.month}${effectiveAt.day}`,
      sortKey: effectiveAt.sortKey,
      usedFallback: !fromDelivered,
    })
  })

  if (records.length === 0) throw new CsvValidationError('File CSV không có dữ liệu.')
  return records
}

export { extractDate }
