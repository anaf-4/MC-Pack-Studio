import { useEditorStore } from '@/store/editorStore'
import { useTextureStore } from '@/store/textureStore'
import { useVanillaTexture } from '@/hooks/useVanillaTexture'
import { getTexturesByCategory } from '@/constants/texturePaths'
import type { TexturePathInfo, TextureCategory } from '@/types/texture'

const CATEGORIES: { id: TextureCategory; label: string; icon: string }[] = [
  { id: 'item',  label: '아이템', icon: '⚔️' },
  { id: 'block', label: '블록',   icon: '🧱' },
  { id: 'gui',   label: 'GUI',    icon: '🖼️' },
  { id: 'hud',   label: 'HUD',    icon: '❤️' },
  { id: 'font',  label: '폰트',   icon: '🔤' },
]

// 개별 텍스처 아이템 (바닐라 썸네일 포함)
function TextureListItem({ info, isSelected, isModified, onClick }: {
  info: TexturePathInfo
  isSelected: boolean
  isModified: boolean
  onClick: () => void
}) {
  const customDataURL  = useTextureStore(s => s.textures[info.path]?.dataURL ?? null)
  const vanillaDataURL = useVanillaTexture(info.path)
  const displayURL     = customDataURL ?? vanillaDataURL

  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left ${
          isSelected
            ? 'bg-mc-bg-hover text-mc-text-primary'
            : 'text-mc-text-secondary hover:bg-mc-bg-hover hover:text-mc-text-primary'
        }`}
      >
        {/* 썸네일 */}
        <div className="w-6 h-6 bg-mc-bg-dark border border-mc-border rounded flex-shrink-0 overflow-hidden flex items-center justify-center"
          style={{ background: 'repeating-conic-gradient(#222 0% 25%, #1a1a1a 0% 50%) 0 0 / 6px 6px' }}>
          {displayURL
            ? <img src={displayURL} alt={info.label} className="w-full h-full object-contain"
                style={{ imageRendering: 'pixelated', opacity: customDataURL ? 1 : 0.5 }} />
            : <span className="text-mc-text-muted" style={{ fontSize: 9 }}>?</span>
          }
        </div>
        <span className="truncate flex-1">{info.label}</span>
        {isModified && <span className="w-1.5 h-1.5 rounded-full bg-mc-accent shrink-0" title="수정됨" />}
      </button>
    </li>
  )
}

export function Sidebar() {
  const { activeCategory, setCategory, selectedTexturePath, selectTexture } = useEditorStore()
  const textures    = useTextureStore(s => s.textures)
  const modifiedSet = new Set(Object.keys(textures))

  const categoryTextures = getTexturesByCategory(activeCategory)
  const modifiedCount    = categoryTextures.filter(t => modifiedSet.has(t.path)).length

  return (
    <aside className="w-60 bg-mc-bg-panel border-r border-mc-border flex flex-col shrink-0 overflow-hidden">

      {/* 카테고리 네비게이션 */}
      <nav className="border-b border-mc-border">
        {CATEGORIES.map(cat => {
          const count = getTexturesByCategory(cat.id).filter(t => modifiedSet.has(t.path)).length
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors border-l-2 ${
                isActive
                  ? 'bg-mc-bg-hover text-mc-accent border-mc-accent'
                  : 'text-mc-text-secondary hover:bg-mc-bg-hover hover:text-mc-text-primary border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span className="font-medium">{cat.label}</span>
              </span>
              {count > 0 && (
                <span className="bg-mc-accent text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* 텍스처 목록 */}
      <div className="flex-1 overflow-y-auto">
        {activeCategory === 'font' ? (
          <div className="p-6 flex flex-col items-center gap-2 text-center">
            <span className="text-3xl">🔤</span>
            <p className="text-mc-text-muted text-xs leading-relaxed">
              폰트 편집은<br/>우측 프리뷰 패널에서<br/>확인할 수 있습니다.
            </p>
          </div>
        ) : (
          <>
            <div className="px-3 py-2 flex items-center justify-between sticky top-0 bg-mc-bg-panel z-10 border-b border-mc-border/50">
              <span className="text-mc-text-muted text-xs font-semibold uppercase tracking-wide">텍스처</span>
              <span className="text-mc-text-muted text-xs">
                <span className={modifiedCount > 0 ? 'text-mc-accent font-bold' : ''}>{modifiedCount}</span>
                /{categoryTextures.length} 수정됨
              </span>
            </div>
            <ul className="pb-4">
              {categoryTextures.map(info => (
                <TextureListItem
                  key={info.path}
                  info={info}
                  isSelected={selectedTexturePath === info.path}
                  isModified={modifiedSet.has(info.path)}
                  onClick={() => selectTexture(selectedTexturePath === info.path ? null : info.path)}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  )
}
