import { useEditorStore } from '@/store/editorStore'
import type { PreviewMode } from '@/store/editorStore'
import { GameSimulator } from '@/components/canvas/GameSimulator'
import { GUIPreview } from './GUIPreview'
import { BlockPreview } from './BlockPreview'
import { ItemPreview } from './ItemPreview'
import { FontPreview } from './FontPreview'

const TABS: { id: PreviewMode; label: string; icon: string }[] = [
  { id: 'game',  label: '게임',  icon: '🎮' },
  { id: 'gui',   label: 'GUI',   icon: '🖼️' },
  { id: 'block', label: '블록',  icon: '🧱' },
  { id: 'item',  label: '아이템', icon: '⚔️' },
  { id: 'font',  label: '폰트',  icon: '🔤' },
]

export function PreviewPanel() {
  const { previewMode, setPreviewMode } = useEditorStore()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 탭 헤더 */}
      <div className="flex-shrink-0 flex border-b border-mc-border bg-mc-bg-panel">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPreviewMode(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${
              previewMode === tab.id
                ? 'border-mc-accent text-mc-accent bg-mc-bg-hover'
                : 'border-transparent text-mc-text-muted hover:text-mc-text-secondary hover:bg-mc-bg-hover'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 프리뷰 컨텐츠 */}
      <div className="flex-1 overflow-hidden">
        {previewMode === 'game'  && <GameSimulator />}
        {previewMode === 'gui'   && <GUIPreview />}
        {previewMode === 'block' && <BlockPreview />}
        {previewMode === 'item'  && <ItemPreview />}
        {previewMode === 'font'  && <FontPreview />}
      </div>
    </div>
  )
}
