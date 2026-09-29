import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react'

interface UploadZoneProps {
  onFile: (file: File) => void
  fileName: string | null
  recordCount: number | null
}

export function UploadZone({ onFile, fileName, recordCount }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => handleFiles(event.target.files),
    [handleFiles],
  )

  const handleDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault()
      setIsDragging(false)
      handleFiles(event.dataTransfer.files)
    },
    [handleFiles],
  )

  const openPicker = useCallback(() => inputRef.current?.click(), [])

  return (
    <section className="upload">
      <label
        className={`dropzone${isDragging ? ' dropzone--active' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="dropzone__input"
          onChange={handleChange}
        />
        <p className="dropzone__title">Kéo thả CSV vào đây</p>
        <p className="dropzone__hint">hoặc</p>
        <button type="button" className="button button--primary" onClick={openPicker}>
          Chọn file CSV
        </button>
      </label>

      {fileName ? (
        <p className="upload__meta">
          <span className="upload__name">{fileName}</span>
          <span aria-hidden="true"> · </span>
          <span>{recordCount ?? 0} bản ghi</span>
        </p>
      ) : null}
    </section>
  )
}
