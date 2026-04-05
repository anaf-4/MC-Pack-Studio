import { usePackExport } from '@/hooks/usePackExport'
import { ExportPreview } from './ExportPreview'

export function ExportButton() {
  const { exportPack, exporting, progress, error, clearError } = usePackExport()

  return (
    <div>
      <button
        onClick={exportPack}
        disabled={exporting}
        className="flex items-center gap-2 bg-mc-accent hover:bg-mc-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold px-4 py-2 rounded text-sm transition-colors"
      >
        {exporting ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Exporting {progress}%
          </>
        ) : (
          <>
            <span>⬇</span>
            Download .zip
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 flex items-start gap-2 text-mc-danger text-xs">
          <span>⚠</span>
          <span>{error}</span>
          <button onClick={clearError} className="ml-auto text-mc-text-muted hover:text-mc-text-secondary">✕</button>
        </div>
      )}

      <ExportPreview />
    </div>
  )
}
