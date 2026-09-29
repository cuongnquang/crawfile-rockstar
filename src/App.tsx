import { useCallback, useMemo, useState } from 'react'
import './App.css'
import { DailyTable } from './components/DailyTable'
import { DetailTable } from './components/DetailTable'
import { Filters } from './components/Filters'
import { StatsTable } from './components/StatsTable'
import { SummaryCards } from './components/SummaryCards'
import { UploadZone } from './components/UploadZone'
import {
  aggregateByDate,
  aggregateGifts,
  filterByDate,
  filterByDelivered,
  filterByGift,
  listDates,
  listGifts,
  summarize,
  type FilterOptions,
} from './lib/analytics'
import { buildExportCsv, buildExportFileName, downloadCsv } from './lib/export'
import { assertCsvFile, readFileAsText } from './lib/file'
import { CsvValidationError, normalizeRecords, type GiftRecord } from './lib/records'

export default function App() {
  const [records, setRecords] = useState<GiftRecord[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterOptions>({
    date: null,
    gift: null,
    onlyDelivered: true,
  })

  const handleFile = useCallback(async (file: File) => {
    try {
      assertCsvFile(file)
      const text = await readFileAsText(file)
      const parsed = normalizeRecords(text)
      setRecords(parsed)
      setFileName(file.name)
      setError(null)
      setFilters({ date: null, gift: null, onlyDelivered: true })
    } catch (cause) {
      setRecords([])
      setFileName(null)
      setError(cause instanceof CsvValidationError ? cause.message : 'Không đọc được file CSV.')
    }
  }, [])

  const dates = useMemo(() => listDates(records), [records])
  const gifts = useMemo(() => listGifts(records), [records])
  const delivered = useMemo(
    () => filterByDelivered(records, filters.onlyDelivered),
    [records, filters.onlyDelivered],
  )
  const dailyTotals = useMemo(() => aggregateByDate(delivered), [delivered])
  const filtered = useMemo(
    () => filterByGift(filterByDate(delivered, filters.date), filters.gift),
    [delivered, filters.date, filters.gift],
  )
  const stats = useMemo(() => aggregateGifts(filtered), [filtered])
  const summary = useMemo(() => summarize(filtered, stats), [filtered, stats])

  const handleExport = useCallback(() => {
    const csv = buildExportCsv(filtered)
    downloadCsv(csv, buildExportFileName(fileName ?? 'export.csv', filters.date, filters.gift))
  }, [filtered, fileName, filters.date, filters.gift])

  return (
    <div className="page">
      <header className="header">
        <h1 className="header__title">Gift Distribution Analyzer</h1>
        <p className="header__subtitle">Thống kê số lượng quà đã phát theo ngày</p>
      </header>

      <main className="main">
        <UploadZone onFile={handleFile} fileName={fileName} recordCount={records.length} />

        {error ? (
          <p className="alert" role="alert">
            {error}
          </p>
        ) : null}

        {records.length > 0 ? (
          <>
            <Filters
              dates={dates}
              gifts={gifts}
              date={filters.date}
              gift={filters.gift}
              onlyDelivered={filters.onlyDelivered}
              onDateChange={(date) => setFilters((current) => ({ ...current, date }))}
              onGiftChange={(gift) => setFilters((current) => ({ ...current, gift }))}
              onOnlyDeliveredChange={(onlyDelivered) =>
                setFilters((current) => ({ ...current, onlyDelivered }))
              }
            />

            <SummaryCards date={summary.date} giftCount={summary.giftCount} total={summary.total} />

            <div className="grid">
              <section className="panel">
                <StatsTable rows={stats} />
              </section>
              <section className="panel panel--side">
                <DailyTable
                  rows={dailyTotals}
                  selectedDate={filters.date}
                  onSelect={(date) => setFilters((current) => ({ ...current, date }))}
                />
              </section>
            </div>

            <section className="panel">
              <DetailTable records={filtered} />
            </section>

            <div className="actions">
              <button type="button" className="button button--primary" onClick={handleExport}>
                Export CSV
              </button>
              <span className="actions__hint">
                Xuất {filtered.length} bản ghi theo bộ lọc hiện tại.
              </span>
            </div>
          </>
        ) : null}
      </main>

      <footer className="footer">
        Dữ liệu được xử lý hoàn toàn trên trình duyệt, không tải lên máy chủ.
      </footer>
    </div>
  )
}
