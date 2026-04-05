import { useRef } from 'react'
import { useDragDrop } from '@/hooks/useDragDrop'
import { useTextureUpload } from '@/hooks/useTextureUpload'

interface Props {
  texturePath: string
  onSuccess?: () => void
  compact?: boolean
}

export function TextureDropZone({ texturePath, onSuccess, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading, error, clearError } = useTextureUpload()

  async function handleFiles(files: File[]) {
    const file = files[0]
    if (!file) return
    const ok = await upload(file, texturePath)
    if (ok) onSuccess?.()
  }

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useDragDrop({
    onDrop: handleFiles,
    accept: ['image/png'],
  })

  if (compact) {
    return (
      <div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs text-mc-text-muted hover:text-mc-accent border border-mc-border hover:border-mc-accent rounded px-2 py-1 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Replace'}
        </button>
        {error && <p className="text-mc-danger text-xs mt-1">{error} <button onClick={clearError} className="underline">dismiss</button></p>}
        <input ref={inputRef} type="file" accept="image/png" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFiles([f]) }} />
      </div>
    )
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-mc-accent bg-mc-accent/10 text-mc-accent'
            : 'border-mc-border hover:border-mc-accent hover:text-mc-accent text-mc-text-muted'
        }`}
      >
        {uploading ? (
          <p className="text-sm">Uploading…</p>
        ) : (
          <>
            <p className="text-2xl mb-2">🖼️</p>
            <p className="text-sm font-medium">Drop PNG here or click to browse</p>
            <p className="text-xs mt-1 opacity-70">Must be PNG, power-of-2 dimensions (16×16, 32×32, etc.)</p>
          </>
        )}
      </div>
      {error && (
        <div className="mt-2 flex items-center gap-2 text-mc-danger text-xs">
          <span>⚠ {error}</span>
          <button onClick={clearError} className="ml-auto text-mc-text-muted hover:text-mc-text-secondary">✕</button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFiles([f]) }}
      />
    </div>
  )
}
