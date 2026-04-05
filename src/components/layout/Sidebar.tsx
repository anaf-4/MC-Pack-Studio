import { useEditorStore } from '@/store/editorStore'
import { useTextureStore } from '@/store/textureStore'
import { getTexturesByCategory } from '@/constants/texturePaths'
import type { TextureCategory } from '@/types/texture'

const CATEGORIES: { id: TextureCategory; label: string; icon: string }[] = [
  { id: 'item',  label: 'Items',  icon: '⚔️' },
  { id: 'block', label: 'Blocks', icon: '🧱' },
  { id: 'gui',   label: 'GUI',    icon: '🖼️' },
  { id: 'hud',   label: 'HUD',    icon: '❤️' },
  { id: 'font',  label: 'Font',   icon: '🔤' },
]

export function Sidebar() {
  const { activeCategory, setCategory, selectedTexturePath, selectTexture } = useEditorStore()
  const textures = useTextureStore((s) => s.textures)
  const modifiedPaths = new Set(Object.keys(textures))

  const categoryTextures = getTexturesByCategory(activeCategory)
  const modifiedCount = categoryTextures.filter((t) => modifiedPaths.has(t.path)).length

  return (
    <aside className="w-60 bg-mc-bg-panel border-r border-mc-border flex flex-col shrink-0 overflow-hidden">
      {/* Category nav */}
      <nav className="border-b border-mc-border">
        {CATEGORIES.map((cat) => {
          const catPaths = getTexturesByCategory(cat.id).map((t) => t.path)
          const count = catPaths.filter((p) => modifiedPaths.has(p)).length
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                activeCategory === cat.id
                  ? 'bg-mc-bg-hover text-mc-accent border-l-2 border-mc-accent'
                  : 'text-mc-text-secondary hover:bg-mc-bg-hover hover:text-mc-text-primary border-l-2 border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </span>
              {count > 0 && (
                <span className="bg-mc-accent text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Texture list */}
      <div className="flex-1 overflow-y-auto">
        {activeCategory === 'font' ? (
          <div className="p-4 text-mc-text-muted text-xs text-center">
            Font editing coming soon.
          </div>
        ) : (
          <>
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="text-mc-text-muted text-xs uppercase tracking-wide">Textures</span>
              <span className="text-mc-text-muted text-xs">{modifiedCount}/{categoryTextures.length} modified</span>
            </div>
            <ul className="pb-4">
              {categoryTextures.map((info) => {
                const isModified = !!textures[info.path]
                const isSelected = selectedTexturePath === info.path
                return (
                  <li key={info.path}>
                    <button
                      onClick={() => selectTexture(isSelected ? null : info.path)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left ${
                        isSelected
                          ? 'bg-mc-bg-hover text-mc-text-primary'
                          : 'text-mc-text-secondary hover:bg-mc-bg-hover hover:text-mc-text-primary'
                      }`}
                    >
                      {/* Texture thumbnail */}
                      <div className="w-6 h-6 bg-mc-bg-dark border border-mc-border rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {isModified ? (
                          <img
                            src={textures[info.path].dataURL}
                            alt={info.label}
                            className="w-full h-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        ) : (
                          <span className="text-mc-text-muted" style={{ fontSize: '10px' }}>?</span>
                        )}
                      </div>
                      <span className="truncate flex-1">{info.label}</span>
                      {isModified && (
                        <span className="w-1.5 h-1.5 rounded-full bg-mc-accent shrink-0" title="Modified" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </aside>
  )
}
