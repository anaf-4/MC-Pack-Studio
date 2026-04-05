import { useState } from 'react'
import { useTextureStore } from '@/store/textureStore'
import { getTexturesByCategory } from '@/constants/texturePaths'

// 아이템 슬롯 하나 — 인벤토리 스타일
function ItemSlot({ dataURL, label, selected, onClick }: {
  dataURL: string | null
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative flex items-center justify-center transition-colors ${
        selected ? 'ring-2 ring-mc-accent' : 'hover:brightness-125'
      }`}
      style={{
        width: 40,
        height: 40,
        background: selected ? '#4a4a6a' : '#3a3a3a',
        border: `2px solid ${selected ? '#aaaaff' : '#1a1a1a'}`,
        borderRadius: 2,
        boxShadow: selected ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'inset 2px 2px 0 rgba(255,255,255,0.08), inset -2px -2px 0 rgba(0,0,0,0.3)',
      }}
    >
      {dataURL ? (
        <img
          src={dataURL}
          alt={label}
          style={{ width: 32, height: 32, imageRendering: 'pixelated' }}
        />
      ) : (
        /* 기본 아이콘 (업로드 전) */
        <div style={{ width: 32, height: 32, opacity: 0.15, background: '#fff', borderRadius: 1 }} />
      )}
    </button>
  )
}

export function ItemPreview() {
  const textures = useTextureStore((s) => s.textures)
  const allItems = getTexturesByCategory('item')
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const filtered = filter.trim()
    ? allItems.filter((t) => t.label.toLowerCase().includes(filter.toLowerCase()))
    : allItems

  const selectedInfo = allItems.find((t) => t.path === selected)
  const selectedTex  = selected ? textures[selected] : undefined

  return (
    <div className="flex flex-col h-full bg-mc-bg-dark">
      {/* 검색 */}
      <div className="flex-shrink-0 p-3 border-b border-mc-border">
        <input
          type="text"
          placeholder="아이템 검색…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-mc-bg-panel border border-mc-border rounded px-3 py-1.5 text-xs text-mc-text-primary placeholder:text-mc-text-muted focus:outline-none focus:border-mc-accent"
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 인벤토리 그리드 */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* 인벤토리 스타일 배경 */}
          <div
            className="inline-flex flex-wrap gap-0.5 p-3 rounded"
            style={{ background: '#c6c6c6', border: '2px solid #555', boxShadow: '2px 2px 0 #000' }}
          >
            {filtered.map((info) => (
              <ItemSlot
                key={info.path}
                dataURL={textures[info.path]?.dataURL ?? null}
                label={info.label}
                selected={selected === info.path}
                onClick={() => setSelected(selected === info.path ? null : info.path)}
              />
            ))}
            {/* 빈 슬롯으로 행 채우기 */}
            {Array.from({ length: (9 - (filtered.length % 9)) % 9 }).map((_, i) => (
              <ItemSlot key={`empty-${i}`} dataURL={null} label="" selected={false} onClick={() => {}} />
            ))}
          </div>
        </div>

        {/* 선택된 아이템 상세 */}
        {selected && (
          <div className="w-48 flex-shrink-0 border-l border-mc-border p-4 flex flex-col items-center gap-3">
            <div
              className="rounded flex items-center justify-center"
              style={{ width: 80, height: 80, background: '#3a3a3a', border: '2px solid #1a1a1a', boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.08)' }}
            >
              {selectedTex ? (
                <img
                  src={selectedTex.dataURL}
                  alt={selectedInfo?.label}
                  style={{ width: 64, height: 64, imageRendering: 'pixelated' }}
                />
              ) : (
                <span className="text-mc-text-muted text-xs text-center px-2">기본 텍스처</span>
              )}
            </div>

            <div className="text-center">
              <p className="text-mc-text-primary text-xs font-medium">{selectedInfo?.label}</p>
              <p className="text-mc-text-muted text-xs mt-0.5">
                {selectedInfo?.defaultWidth}×{selectedInfo?.defaultHeight}
              </p>
              {selectedTex ? (
                <span className="inline-block mt-1 text-mc-accent text-xs">● 수정됨</span>
              ) : (
                <span className="inline-block mt-1 text-mc-text-muted text-xs">기본값</span>
              )}
            </div>

            <p className="text-mc-text-muted text-xs text-center leading-relaxed opacity-70">
              사이드바에서 해당 아이템을 선택해 텍스처를 교체하세요
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
