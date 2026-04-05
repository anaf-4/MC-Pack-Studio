import { useState, useRef } from 'react'
import { useTextureStore } from '@/store/textureStore'
import { useEditorStore } from '@/store/editorStore'
import { useTextureUpload } from '@/hooks/useTextureUpload'
import { getTexturesByCategory } from '@/constants/texturePaths'
import type { CSSProperties } from 'react'

// ── 3D 아이템 렌더러 ──────────────────────────────────────────────────────────
// 마인크래프트 아이템: 평면 스프라이트를 CSS 3D로 비스듬히 기울여서 표현
function Item3D({ dataURL, size = 64 }: { dataURL: string | null; size?: number }) {
  const commonStyle: CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    backgroundImage: dataURL ? `url(${dataURL})` : undefined,
    backgroundSize: '100% 100%',
    imageRendering: 'pixelated',
    backfaceVisibility: 'hidden',
  }

  if (!dataURL) {
    return (
      <div style={{
        width: size * 1.6,
        height: size * 1.6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.2,
      }}>
        <span style={{ fontSize: size * 0.5, lineHeight: 1 }}>?</span>
      </div>
    )
  }

  return (
    <div style={{ perspective: 400, width: size * 1.6, height: size * 1.6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'relative',
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
        // 마인크래프트 아이템 손에 든 각도 모방
        transform: 'rotateX(15deg) rotateY(-20deg) rotateZ(5deg)',
        filter: 'drop-shadow(4px 6px 8px rgba(0,0,0,0.7))',
      }}>
        {/* 앞면 */}
        <div style={{ ...commonStyle, transform: 'translateZ(2px)', filter: 'brightness(1.0)' }} />
        {/* 뒷면 (약간 어둡게, 두께감) */}
        <div style={{ ...commonStyle, transform: 'translateZ(-2px)', filter: 'brightness(0.6)' }} />
        {/* 오른쪽 측면 (두께) */}
        <div style={{
          position: 'absolute',
          width: 4,
          height: size,
          right: -2,
          top: 0,
          background: '#000',
          opacity: 0.35,
          transform: 'rotateY(90deg) translateZ(-2px)',
          transformOrigin: 'right center',
        }} />
        {/* 아래 측면 (두께) */}
        <div style={{
          position: 'absolute',
          width: size,
          height: 4,
          bottom: -2,
          left: 0,
          background: '#000',
          opacity: 0.5,
          transform: 'rotateX(-90deg) translateZ(-2px)',
          transformOrigin: 'bottom center',
        }} />
      </div>
    </div>
  )
}

// ── 인벤토리 슬롯 ─────────────────────────────────────────────────────────────
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
      className={`relative flex items-center justify-center transition-all ${
        selected ? 'ring-2 ring-mc-accent scale-110' : 'hover:brightness-125'
      }`}
      style={{
        width: 40,
        height: 40,
        background: selected ? '#4a4a6a' : '#3a3a3a',
        border: `2px solid ${selected ? '#aaaaff' : '#1a1a1a'}`,
        borderRadius: 2,
        boxShadow: selected
          ? 'inset 0 0 0 1px rgba(255,255,255,0.15)'
          : 'inset 2px 2px 0 rgba(255,255,255,0.08), inset -2px -2px 0 rgba(0,0,0,0.3)',
      }}
    >
      {dataURL ? (
        <img src={dataURL} alt={label} style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />
      ) : (
        <div style={{ width: 32, height: 32, opacity: 0.15, background: '#fff', borderRadius: 1 }} />
      )}
      {dataURL && (
        <div style={{
          position: 'absolute',
          bottom: 1,
          right: 2,
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: '#55FF55',
        }} />
      )}
    </button>
  )
}

// ── 아이템 상세 패널 ──────────────────────────────────────────────────────────
function ItemDetailPanel({ path, label, width, height }: {
  path: string
  label: string
  width: number
  height: number
}) {
  const textures = useTextureStore((s) => s.textures)
  const removeTexture = useTextureStore((s) => s.removeTexture)
  const setEditingTexture = useEditorStore((s) => s.setEditingTexture)
  const dataURL = textures[path]?.dataURL ?? null
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading, error } = useTextureUpload()

  function openPicker() {
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.click()
    }
  }

  async function handleFile(file: File) {
    await upload(file, path)
  }

  return (
    <div className="w-56 flex-shrink-0 border-l border-mc-border flex flex-col">
      {/* 3D 아이템 뷰 */}
      <div
        className="flex items-center justify-center"
        style={{
          height: 160,
          background: 'radial-gradient(ellipse at center, #2a3a2a 0%, #0d1a0d 100%)',
          borderBottom: '1px solid #333',
        }}
      >
        <Item3D dataURL={dataURL} size={72} />
      </div>

      {/* 아이템 정보 */}
      <div className="p-3 flex flex-col gap-2 flex-1 overflow-y-auto">
        <div>
          <p className="text-mc-text-primary text-xs font-semibold">{label}</p>
          <p className="text-mc-text-muted text-xs mt-0.5 font-mono">{width}×{height}px</p>
          <p className="text-mc-text-muted text-xs opacity-60 mt-0.5 break-all leading-relaxed">{path}</p>
        </div>

        {/* 편집 버튼 */}
        <button
          onClick={() => setEditingTexture(path)}
          className="w-full text-xs border border-mc-accent rounded px-2 py-1.5 text-mc-accent hover:bg-mc-accent/10 transition-colors font-medium"
        >
          ✏️ 픽셀 에디터로 편집
        </button>

        {dataURL ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-mc-accent text-xs">● 커스텀 텍스처 적용됨</span>
            <div className="flex gap-1">
              <button
                onClick={openPicker}
                disabled={uploading}
                className="flex-1 text-xs border border-mc-border rounded px-2 py-1 text-mc-text-secondary hover:text-mc-text-primary hover:bg-mc-bg-hover transition-colors disabled:opacity-50"
              >
                {uploading ? '…' : '📁 교체'}
              </button>
              <button
                onClick={() => removeTexture(path)}
                className="text-xs border border-mc-border rounded px-2 py-1 text-mc-danger hover:bg-mc-bg-hover transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={openPicker}
            disabled={uploading}
            className="text-xs border border-mc-border rounded px-2 py-1.5 text-mc-text-secondary hover:text-mc-text-primary hover:bg-mc-bg-hover transition-colors disabled:opacity-50 text-center"
          >
            {uploading ? '업로드 중…' : '📁 PNG 업로드'}
          </button>
        )}

        {error && <p className="text-mc-danger text-xs">{error}</p>}

        {/* 2D 플랫 미리보기 */}
        {dataURL && (
          <div>
            <p className="text-mc-text-muted text-xs mb-1">2D 원본</p>
            <div
              className="flex items-center justify-center rounded"
              style={{
                width: 64,
                height: 64,
                background: '#1a1a1a',
                border: '1px solid #333',
              }}
            >
              <img src={dataURL} alt={label} style={{ width: 48, height: 48, imageRendering: 'pixelated' }} />
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
export function ItemPreview() {
  const textures = useTextureStore((s) => s.textures)
  const allItems = getTexturesByCategory('item')
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const filtered = filter.trim()
    ? allItems.filter((t) => t.label.toLowerCase().includes(filter.toLowerCase()))
    : allItems

  const selectedInfo = allItems.find((t) => t.path === selected)
  const modifiedCount = allItems.filter((t) => !!textures[t.path]).length

  return (
    <div className="flex flex-col h-full bg-mc-bg-dark">
      {/* 헤더 */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-mc-border flex items-center gap-2 flex-wrap">
        <p className="text-mc-text-muted text-xs">
          <span className="text-mc-accent font-medium">{modifiedCount}</span>개 아이템 수정됨
        </p>
        <span className="text-mc-text-muted opacity-40">·</span>
        <input
          type="text"
          placeholder="아이템 검색…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 min-w-0 bg-mc-bg-panel border border-mc-border rounded px-2 py-1 text-xs text-mc-text-primary placeholder:text-mc-text-muted focus:outline-none focus:border-mc-accent"
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 인벤토리 그리드 */}
        <div className="flex-1 overflow-y-auto p-3">
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

        {/* 선택된 아이템 상세 + 3D 뷰 */}
        {selected && selectedInfo && (
          <ItemDetailPanel
            path={selected}
            label={selectedInfo.label}
            width={selectedInfo.defaultWidth}
            height={selectedInfo.defaultHeight}
          />
        )}
      </div>
    </div>
  )
}
