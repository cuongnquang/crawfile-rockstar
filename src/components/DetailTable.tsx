import { useMemo, useState } from 'react'
import type { GiftRecord } from '../lib/records'

type SortKey = 'deliveredAt' | 'gift' | 'deliveredBy'
type SortDirection = 'asc' | 'desc'

const PAGE_SIZE = 50

interface DetailTableProps {
  records: GiftRecord[]
}

export function DetailTable({ records }: DetailTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('deliveredAt')
  const [direction, setDirection] = useState<SortDirection>('asc')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const sorted = useMemo(() => {
    const factor = direction === 'asc' ? 1 : -1
    return [...records].sort((a, b) => {
      if (sortKey === 'deliveredAt') {
        return a.sortKey.localeCompare(b.sortKey) * factor
      }
      return a[sortKey].localeCompare(b[sortKey], 'vi') * factor
    })
  }, [records, sortKey, direction])

  const visible = sorted.slice(0, visibleCount)

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setDirection(key === 'deliveredAt' ? 'asc' : 'asc')
  }

  if (records.length === 0) {
    return <p className="empty">Không có bản ghi nào.</p>
  }

  const arrow = (key: SortKey) => (sortKey === key ? (direction === 'asc' ? ' ▲' : ' ▼') : '')

  return (
    <div>
      <table className="table">
        <caption className="table__caption">Bảng chi tiết ({records.length} bản ghi)</caption>
        <thead>
          <tr>
            <th scope="col">
              <button type="button" className="sort" onClick={() => toggleSort('deliveredAt')}>
                Phát lúc{arrow('deliveredAt')}
              </button>
            </th>
            <th scope="col">Mã khách</th>
            <th scope="col">Tên khách</th>
            <th scope="col">
              <button type="button" className="sort" onClick={() => toggleSort('gift')}>
                Phần quà{arrow('gift')}
              </button>
            </th>
            <th scope="col" className="table__num">
              Điểm đã trừ
            </th>
            <th scope="col">
              <button type="button" className="sort" onClick={() => toggleSort('deliveredBy')}>
                PG phát{arrow('deliveredBy')}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((record) => (
            <tr key={record.id}>
              <td className="nowrap">{record.deliveredAt || record.exchangedAt}</td>
              <td className="nowrap">{record.customerCode}</td>
              <td>{record.customerName}</td>
              <td>{record.gift}</td>
              <td className="table__num">{record.points}</td>
              <td className="nowrap">{record.deliveredBy}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {visibleCount < sorted.length ? (
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          Xem thêm ({sorted.length - visibleCount} bản ghi)
        </button>
      ) : null}
    </div>
  )
}
