export const HEADER =
  'Đổi lúc,Mã khách,Tên khách,Số điện thoại,Phần quà,Điểm đã trừ,Đã phát,PG phát,Phát lúc,Có ảnh,Đường dẫn ảnh'

export const GIFT_A = 'BÌNH NƯỚC + LỐC ROCKSTAR'
export const GIFT_B = 'NÓN BẢO HIỂM + THÙNG ROCKSTAR'

export interface RecordInput {
  exchangedAt?: string
  code?: string
  name?: string
  phone?: string
  gift?: string
  points?: string
  delivered?: string
  pg?: string
  deliveredAt?: string
  hasPhoto?: string
  photoUrl?: string
}

/** Builds one properly escaped CSV data row in the real column order. */
export function row(input: RecordInput): string {
  return [
    input.exchangedAt ?? '',
    input.code ?? '',
    input.name ?? '',
    input.phone ?? '',
    input.gift ?? '',
    input.points ?? '',
    input.delivered ?? '',
    input.pg ?? '',
    input.deliveredAt ?? '',
    input.hasPhoto ?? '',
    input.photoUrl ?? '',
  ]
    .map((cell) => (/[",\r\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell))
    .join(',')
}

/** Full document with the standard 11 column header. */
export function csvOf(...rows: string[]): string {
  return [HEADER, ...rows].join('\r\n')
}

/** 22/09: 3 delivered A + 1 undelivered B. 23/09: 2 delivered B. */
export const SAMPLE_CSV = csvOf(
  row({
    exchangedAt: '22/09/2026 08:33:55',
    code: 'KH001',
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    gift: GIFT_A,
    points: '10',
    delivered: 'x',
    pg: 'PG 06',
    deliveredAt: '22/09/2026 08:33:55',
  }),
  row({
    exchangedAt: '22/09/2026 09:10:00',
    code: 'KH002',
    name: 'Trần Thị B',
    phone: '0901234567',
    gift: GIFT_A,
    points: '10',
    delivered: 'X',
    pg: 'PG 01',
    deliveredAt: '22/09/2026 09:10:00',
  }),
  row({
    exchangedAt: '22/09/2026 10:00:00',
    code: 'KH003',
    name: 'Lê Văn C',
    phone: '0901234567',
    gift: GIFT_A,
    points: '10',
    delivered: 'yes',
    pg: 'PG 06',
    deliveredAt: '22/09/2026 10:00:00',
  }),
  row({
    exchangedAt: '22/09/2026 11:00:00',
    code: 'KH004',
    name: 'Phạm Thị D',
    phone: '0901234567',
    gift: GIFT_B,
    points: '20',
    delivered: '',
    pg: 'PG 02',
    deliveredAt: '22/09/2026 11:00:00',
  }),
  row({
    exchangedAt: '23/09/2026 08:00:00',
    code: 'KH005',
    name: 'Hoàng Văn E',
    phone: '0901234567',
    gift: GIFT_B,
    points: '20',
    delivered: '1',
    pg: 'PG 01',
    deliveredAt: '23/09/2026 08:00:00',
  }),
  row({
    exchangedAt: '23/09/2026 09:00:00',
    code: 'KH006',
    name: 'Vũ Thị F',
    phone: '0901234567',
    gift: GIFT_B,
    points: '20',
    delivered: 'true',
    pg: 'PG 02',
    deliveredAt: '23/09/2026 09:00:00',
  }),
)
