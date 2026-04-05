import { usePackExport } from '@/hooks/usePackExport'

export function ExportButton() {
  const { exportPack, exporting, progress, error, clearError } = usePackExport()

  return (
    <div className="relative">
      <button
        onClick={exportPack}
        disabled={exporting}
        className="flex items-center gap-2 bg-mc-accent hover:bg-mc-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold px-4 py-1.5 rounded text-sm transition-colors"
      >
        {exporting ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            <span>{progress}%</span>
          </>
        ) : (
          <>
            <span>⬇</span>
            <span>다운로드 .zip</span>
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full right-0 mt-2 z-50 flex items-start gap-2 text-mc-danger text-xs bg-mc-bg-panel border border-mc-danger rounded px-3 py-2 shadow-xl whitespace-nowrap">
          <span>⚠</span>
          <span>{error}</span>
          <button onClick={clearError} className="ml-2 text-mc-text-muted hover:text-mc-text-secondary">✕</button>
        </div>
      )}
    </div>
  )
}
