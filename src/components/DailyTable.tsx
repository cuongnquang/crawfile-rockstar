import type { DailyTotal } from '../lib/analytics'

interface DailyTableProps {
  rows: DailyTotal[]
  selectedDate: string | null
  onSelect: (date: string) => void
}

export function DailyTable({ rows, selectedDate, onSelect }: DailyTableProps) {
  return (
    <table className="table table--compact">
      <caption className="table__caption">Tổng quan theo ngày</caption>
      <thead>
        <tr>
          <th scope="col">Ngày</th>
          <th scope="col" className="table__num">
            Tổng quà
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.date} className={row.date === selectedDate ? 'row--active' : undefined}>
            <td>
              <button type="button" className="link" onClick={() => onSelect(row.date)}>
                {row.date}
              </button>
            </td>
            <td className="table__num">{row.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
