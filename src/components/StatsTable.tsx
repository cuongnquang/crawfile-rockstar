import { sumCounts, type GiftAggregate } from '../lib/analytics'

interface StatsTableProps {
  rows: GiftAggregate[]
}

export function StatsTable({ rows }: StatsTableProps) {
  const total = sumCounts(rows)

  if (rows.length === 0) {
    return <p className="empty">Không có dữ liệu phù hợp với bộ lọc hiện tại.</p>
  }

  return (
    <table className="table">
      <caption className="table__caption">Thống kê theo phần quà</caption>
      <thead>
        <tr>
          <th scope="col">Phần quà</th>
          <th scope="col" className="table__num">
            Số lượng
          </th>
          <th scope="col" className="table__num">
            Tỷ lệ
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.gift}>
            <td>{row.gift}</td>
            <td className="table__num">{row.count}</td>
            <td className="table__num">{row.percentage.toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="table__total">
          <td>TỔNG</td>
          <td className="table__num">{total}</td>
          <td className="table__num">{total === 0 ? '0.0%' : '100.0%'}</td>
        </tr>
      </tfoot>
    </table>
  )
}
