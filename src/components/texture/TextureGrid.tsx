import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { getTexturesByCategory } from '@/constants/texturePaths'
import { TextureCard } from './TextureCard'

export function TextureGrid() {
  const activeCategory = useEditorStore((s) => s.activeCategory)
  const [filter, setFilter] = useState('')

  const all = getTexturesByCategory(activeCategory)
  const filtered = filter.trim()
    ? all.filter((t) => t.label.toLowerCase().includes(filter.toLowerCase()))
    : all

  return (
    <div className="h-full flex flex-col">
      {/* 검색 */}
      <div className="p-3 border-b border-mc-border">
        <input
          type="text"
          placeholder={`${activeCategory} 텍스처 검색…`}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-mc-bg-dark border border-mc-border rounded px-3 py-1.5 text-sm text-mc-text-primary placeholder:text-mc-text-muted focus:outline-none focus:border-mc-accent"
        />
      </div>

      {/* 그리드 */}
      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <p className="text-mc-text-muted text-sm text-center py-8">텍스처를 찾을 수 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((info) => (
              <TextureCard key={info.path} info={info} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
