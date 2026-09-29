import { isDelivered, type GiftRecord } from './records'

export interface FilterOptions {
  /** `DD/MM/YYYY` or `null` for "all days". */
  date: string | null
  /** Gift name or `null` for "all gifts". */
  gift: string | null
  /** Only count rows flagged as delivered. */
  onlyDelivered: boolean
}

export const DEFAULT_FILTERS: FilterOptions = {
  date: null,
  gift: null,
  onlyDelivered: true,
}

export function filterByDate(records: GiftRecord[], date: string | null): GiftRecord[] {
  if (!date) return records
  return records.filter((record) => record.date === date)
}

export function filterByGift(records: GiftRecord[], gift: string | null): GiftRecord[] {
  if (!gift) return records
  return records.filter((record) => record.gift === gift)
}

export function filterByDelivered(records: GiftRecord[], onlyDelivered: boolean): GiftRecord[] {
  if (!onlyDelivered) return records
  return records.filter((record) => isDelivered(record.delivered))
}

export function applyFilters(records: GiftRecord[], options: FilterOptions): GiftRecord[] {
  return filterByGift(
    filterByDate(filterByDelivered(records, options.onlyDelivered), options.date),
    options.gift,
  )
}

export interface GiftAggregate {
  gift: string
  count: number
  /** Share of the filtered total, 0–100. */
  percentage: number
}

export interface DailyTotal {
  date: string
  total: number
  sortKey: string
}

/** Groups by `Phần quà`, sorted by count desc then name asc. */
export function aggregateGifts(records: GiftRecord[]): GiftAggregate[] {
  const counts = new Map<string, number>()
  for (const record of records) {
    counts.set(record.gift, (counts.get(record.gift) ?? 0) + 1)
  }

  const total = records.length
  return [...counts.entries()]
    .map(([gift, count]) => ({
      gift,
      count,
      percentage: total === 0 ? 0 : (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count || a.gift.localeCompare(b.gift, 'vi'))
}

export function sumCounts(rows: GiftAggregate[]): number {
  return rows.reduce((sum, row) => sum + row.count, 0)
}

/** Totals per day, sorted newest first. */
export function aggregateByDate(records: GiftRecord[]): DailyTotal[] {
  const buckets = new Map<string, { total: number; sortKey: string }>()

  for (const record of records) {
    if (!record.date) continue
    const current = buckets.get(record.date)
    if (current) {
      current.total += 1
    } else {
      buckets.set(record.date, { total: 1, sortKey: record.dayKey })
    }
  }

  return [...buckets.entries()]
    .map(([date, value]) => ({ date, total: value.total, sortKey: value.sortKey }))
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
}

/** Distinct gift names, sorted with `localeCompare('vi')`. */
export function listGifts(records: GiftRecord[]): string[] {
  const gifts = new Set<string>()
  for (const record of records) gifts.add(record.gift)
  return [...gifts].sort((a, b) => a.localeCompare(b, 'vi'))
}

/** Distinct `DD/MM/YYYY` values, newest first. */
export function listDates(records: GiftRecord[]): string[] {
  const buckets = new Map<string, string>()
  for (const record of records) {
    if (record.date) buckets.set(record.date, record.dayKey)
  }
  return [...buckets.entries()].sort((a, b) => b[1].localeCompare(a[1])).map(([date]) => date)
}

export interface Summary {
  date: string | null
  giftCount: number
  total: number
}

export function summarize(filtered: GiftRecord[], aggregates: GiftAggregate[]): Summary {
  return {
    date: filtered.length > 0 ? filtered[0].date : null,
    giftCount: aggregates.length,
    total: sumCounts(aggregates),
  }
}
