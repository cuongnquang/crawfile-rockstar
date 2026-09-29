interface SummaryCardsProps {
  date: string | null
  giftCount: number
  total: number
}

export function SummaryCards({ date, giftCount, total }: SummaryCardsProps) {
  return (
    <section className="cards" aria-label="Tổng quan">
      <article className="card">
        <p className="card__label">Ngày đang xem</p>
        <p className="card__value">{date ?? 'Tất cả'}</p>
      </article>
      <article className="card">
        <p className="card__label">Số loại quà</p>
        <p className="card__value">{giftCount} loại quà</p>
      </article>
      <article className="card">
        <p className="card__label">Tổng quà đã phát</p>
        <p className="card__value">{total} phần</p>
      </article>
    </section>
  )
}
