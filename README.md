# Gift Distribution Analyzer

Công cụ nội bộ: import file CSV phát quà, chọn ngày và phần quà, xem ngay mỗi phần quà
đã phát bao nhiêu phần trong ngày.

**Toàn bộ CSV được xử lý trên trình duyệt.** Không có backend, không database,
không gửi dữ liệu khách hàng ra ngoài.

## Chạy project

```bash
npm install
npm run dev      # http://localhost:5173
```

Có sẵn file mẫu tại `public/mau-du-lieu.csv` để thử nhanh.

## Scripts

| Script              | Mô tả                        |
| ------------------- | ---------------------------- |
| `npm run dev`       | Dev server                   |
| `npm run build`     | Typecheck + build production |
| `npm run preview`   | Xem bản build                |
| `npm run typecheck` | `tsc -b`                     |
| `npm run lint`      | `oxlint`                     |
| `npm run test`      | `vitest run`                 |
| `npm run format`    | `prettier --write .`         |
| `npm run check`     | format → lint → test → build |

## Format CSV

Cột kỳ vọng (tên tiếng Việt có dấu, không phân biệt hoa thường / dấu cách):

`Đổi lúc`, `Mã khách`, `Tên khách`, `Số điện thoại`, `Phần quà`, `Điểm đã trừ`,
`Đã phát`, `PG phát`, `Phát lúc`, `Có ảnh`, `Đường dẫn ảnh`

- Bắt buộc: `Phần quà` và (`Phát lúc` **hoặc** `Đổi lúc`). Các cột khác là tùy chọn.
- Ngày giờ theo định dạng `DD/MM/YYYY HH:mm:ss`.
- Ngày thống kê lấy từ `Phát lúc`; nếu `Phát lúc` trống hoặc không hợp lệ thì
  fallback sang `Đổi lúc`.
- `Đã phát` coi là đã phát khi giá trị là `x`, `X`, `yes`, `true`, `1` (không phân
  biệt hoa thường). Trống = chưa phát.
- Parser chịu được: BOM UTF-8, UTF-16, dấu phẩy/semicolon/tab, dấu ngoặc kép,
  comma trong nội dung, dòng trống, CRLF/LF/CR, header trùng, khoảng trắng thừa,
  giá trị `null`/`N/A`/`-`, ngày không hợp lệ.

Toàn bộ dữ liệu trong UI, kể cả tên phần quà, số lượng, ngày và tên khách, đều lấy
từ CSV — không có dữ liệu hard-code.

## Kiến trúc

```
src/
  lib/
    csv.ts        parseDelimited / parseCSV / detectDelimiter / buildHeaders
    datetime.ts   parseDateTime (DD/MM/YYYY HH:mm:ss)
    records.ts    normalizeRecords + isDelivered (quy tắc "đã phát")
    analytics.ts  filterByDate / filterByGift / aggregateGifts / aggregateByDate / summarize
    export.ts     buildExportCsv / downloadCsv
    file.ts       assertCsvFile / readFileAsText (giải mã encoding trong browser)
  components/     UploadZone, Filters, SummaryCards, StatsTable, DailyTable, DetailTable
  test/           csv, datetime, analytics, export, file, pipeline
```

Luồng xử lý:

```
CSV → parseDelimited → normalizeRecords → filterByDelivered → filterByDate
    → filterByGift → aggregateGifts → render
```

Bảng chi tiết chỉ render 50 dòng đầu, có nút "Xem thêm" để không gánh hàng chục
nghìn row cùng lúc.
