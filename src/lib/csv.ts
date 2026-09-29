/**
 * Low level CSV parsing.
 *
 * Hand written parser (RFC 4180 flavoured) so that we stay dependency free and
 * keep full control over the quirks we care about:
 *  - UTF-8 BOM
 *  - quoted fields containing commas / newlines / escaped quotes
 *  - CRLF, LF and lone CR line endings
 *  - blank lines
 *  - duplicate / whitespace padded headers
 */

export type RawRow = Record<string, string>

export const DELIMITERS = [',', ';', '\t'] as const

/** Detects the delimiter used by the document. */
export function detectDelimiter(sample: string): string {
  const firstLine = firstMeaningfulLine(stripBom(sample))
  let best = ','
  let bestCount = -1

  for (const delimiter of DELIMITERS) {
    const count = countOutsideQuotes(firstLine, delimiter)
    if (count > bestCount) {
      best = delimiter
      bestCount = count
    }
  }

  return bestCount === 0 ? ',' : best
}

export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

/**
 * Splits raw text into a matrix of cells. Never throws.
 */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const input = stripBom(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let rowHasContent = false

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"' && field.trim() === '') {
      inQuotes = true
      field = ''
      rowHasContent = true
      continue
    }

    if (char === delimiter) {
      row.push(field)
      field = ''
      rowHasContent = true
      continue
    }

    if (char === '\n') {
      row.push(field)
      if (rowHasContent || row.some((cell) => cell.trim() !== '')) {
        rows.push(row)
      }
      row = []
      field = ''
      rowHasContent = false
      continue
    }

    field += char
    if (char.trim() !== '') rowHasContent = true
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    if (rowHasContent || row.some((cell) => cell.trim() !== '')) rows.push(row)
  }

  return rows
}

/** Normalises header names: trims, collapses inner whitespace, strips BOM. */
export function normalizeHeader(header: string): string {
  return stripBom(header).replace(/\s+/g, ' ').trim()
}

/**
 * Builds header row. Empty headers are dropped, duplicated headers get a
 * numeric suffix so no data is silently lost.
 */
export function buildHeaders(cells: string[]): string[] {
  const seen = new Map<string, number>()

  return cells.map((raw) => {
    const base = normalizeHeader(raw)
    if (base === '') return `Cột ${seen.size + 1}`
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base} (${count + 1})`
  })
}

/** Maps a matrix (with header) into objects keyed by header name. */
export function toRows(matrix: string[][]): RawRow[] {
  if (matrix.length === 0) return []
  const [headerCells, ...body] = matrix
  const headers = buildHeaders(headerCells)
  return body.map((cells) => {
    const row: RawRow = {}
    headers.forEach((header, index) => {
      row[header] = (cells[index] ?? '').trim()
    })
    return row
  })
}

/** Full pipeline: text -> rows keyed by (normalised) header name. */
export function parseCSV(text: string): RawRow[] {
  return toRows(parseDelimited(text, detectDelimiter(text)))
}

function firstMeaningfulLine(text: string): string {
  for (const line of text.split('\n')) {
    if (line.trim() !== '') return line
  }
  return ''
}

function countOutsideQuotes(line: string, char: string): number {
  let count = 0
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const current = line[i]
    if (current === '"') {
      if (inQuotes && line[i + 1] === '"') {
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (current === char && !inQuotes) count += 1
  }
  return count
}
