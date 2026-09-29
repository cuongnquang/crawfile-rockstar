interface FiltersProps {
  dates: string[]
  gifts: string[]
  date: string | null
  gift: string | null
  onlyDelivered: boolean
  onDateChange: (date: string | null) => void
  onGiftChange: (gift: string | null) => void
  onOnlyDeliveredChange: (value: boolean) => void
}

export function Filters({
  dates,
  gifts,
  date,
  gift,
  onlyDelivered,
  onDateChange,
  onGiftChange,
  onOnlyDeliveredChange,
}: FiltersProps) {
  return (
    <section className="filters" aria-label="Bộ lọc">
      <div className="filters__field">
        <label className="filters__label" htmlFor="filter-date">
          Ngày
        </label>
        <select
          id="filter-date"
          className="select"
          value={date ?? ''}
          onChange={(event) => onDateChange(event.target.value || null)}
        >
          <option value="">Tất cả ngày</option>
          {dates.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="filters__field">
        <label className="filters__label" htmlFor="filter-gift">
          Phần quà
        </label>
        <select
          id="filter-gift"
          className="select"
          value={gift ?? ''}
          onChange={(event) => onGiftChange(event.target.value || null)}
        >
          <option value="">Tất cả phần quà</option>
          {gifts.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <label className="filters__check">
        <input
          type="checkbox"
          checked={onlyDelivered}
          onChange={(event) => onOnlyDeliveredChange(event.target.checked)}
        />
        <span>Chỉ tính đã phát</span>
      </label>
    </section>
  )
}
