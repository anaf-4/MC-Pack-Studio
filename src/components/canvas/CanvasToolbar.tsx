import { useEditorStore } from '@/store/editorStore'

export function CanvasToolbar() {
  const { canvasZoom, setZoom, showPixelGrid, togglePixelGrid, setPreviewMode } = useEditorStore()

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-mc-bg-panel border-b border-mc-border">
      {/* 줌 컨트롤 */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setZoom(canvasZoom - 1)}
          disabled={canvasZoom <= 1}
          className="w-7 h-7 bg-mc-bg-dark border border-mc-border rounded text-mc-text-secondary hover:text-mc-text-primary hover:bg-mc-bg-hover disabled:opacity-40 text-sm transition-colors"
        >
          −
        </button>
        <span className="text-mc-text-muted text-xs font-mono w-12 text-center">{canvasZoom}×</span>
        <button
          onClick={() => setZoom(canvasZoom + 1)}
          disabled={canvasZoom >= 16}
          className="w-7 h-7 bg-mc-bg-dark border border-mc-border rounded text-mc-text-secondary hover:text-mc-text-primary hover:bg-mc-bg-hover disabled:opacity-40 text-sm transition-colors"
        >
          +
        </button>
      </div>

      <div className="w-px h-5 bg-mc-border" />

      {/* 그리드 토글 */}
      <button
        onClick={togglePixelGrid}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-colors ${
          showPixelGrid
            ? 'border-mc-accent text-mc-accent bg-mc-accent/10'
            : 'border-mc-border text-mc-text-secondary hover:text-mc-text-primary'
        }`}
      >
        <span>#</span>
        <span>그리드</span>
      </button>

      <div className="ml-auto">
        <button
          onClick={() => setPreviewMode('game')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border border-mc-border text-mc-text-secondary hover:text-mc-text-primary hover:bg-mc-bg-hover transition-colors"
        >
          <span>🎮</span>
          <span>게임 프리뷰</span>
        </button>
      </div>
    </div>
  )
}
