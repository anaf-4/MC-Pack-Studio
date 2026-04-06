import { useState, useRef } from 'react'
import { useTextureStore } from '@/store/textureStore'
import { useEditorStore } from '@/store/editorStore'
import { useTextureUpload } from '@/hooks/useTextureUpload'
import { useVanillaTexture } from '@/hooks/useVanillaTexture'
import { getTexturesByCategory } from '@/constants/texturePaths'
import { downloadTexture } from '@/utils/downloadTexture'
import type { CSSProperties } from 'react'

// ── 커스텀 아이템 스토어 ──────────────────────────────────────────────────────
interface CustomItem { id: string; label: string; path: string }

function loadCustomItems(): CustomItem[] {
  try { return JSON.parse(localStorage.getItem('mc_custom_items') ?? '[]') } catch { return [] }
}
function saveCustomItems(items: CustomItem[]) {
  localStorage.setItem('mc_custom_items', JSON.stringify(items))
}

// ── 3D 아이템 렌더러 ──────────────────────────────────────────────────────────
function Item3D({ dataURL, size = 64 }: { dataURL: string | null; size?: number }) {
  const commonStyle: CSSProperties = {
    position: 'absolute', width: size, height: size,
    backgroundImage: dataURL ? `url(${dataURL})` : undefined,
    backgroundSize: '100% 100%', imageRendering: 'pixelated', backfaceVisibility: 'hidden',
  }
  if (!dataURL) return (
    <div style={{ width: size * 1.6, height: size * 1.6, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
      <span style={{ fontSize: size * 0.5, lineHeight: 1 }}>?</span>
    </div>
  )
  return (
    <div style={{ perspective: 400, width: size * 1.6, height: size * 1.6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, transformStyle: 'preserve-3d',
        transform: 'rotateX(15deg) rotateY(-20deg) rotateZ(5deg)', filter: 'drop-shadow(4px 6px 8px rgba(0,0,0,0.7))' }}>
        <div style={{ ...commonStyle, transform: 'translateZ(2px)', filter: 'brightness(1.0)' }} />
        <div style={{ ...commonStyle, transform: 'translateZ(-2px)', filter: 'brightness(0.6)' }} />
      </div>
    </div>
  )
}

// ── 인벤토리 슬롯 ─────────────────────────────────────────────────────────────
function ItemSlot({ dataURL, vanillaURL, label, selected, onClick }: {
  dataURL: string | null; vanillaURL: string | null
  label: string; selected: boolean; onClick: () => void
}) {
  const displayURL = dataURL ?? vanillaURL
  return (
    <button onClick={onClick} title={label}
      className={`relative flex items-center justify-center transition-all ${selected ? 'ring-2 ring-mc-accent scale-110' : 'hover:brightness-125'}`}
      style={{
        width: 40, height: 40,
        background: selected ? '#4a4a6a' : '#3a3a3a',
        border: `2px solid ${selected ? '#aaaaff' : '#1a1a1a'}`, borderRadius: 2,
        boxShadow: selected ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'inset 2px 2px 0 rgba(255,255,255,0.08), inset -2px -2px 0 rgba(0,0,0,0.3)',
      }}>
      {displayURL
        ? <img src={displayURL} alt={label} style={{ width: 32, height: 32, imageRendering: 'pixelated', opacity: dataURL ? 1 : 0.45 }} />
        : <div style={{ width: 32, height: 32, opacity: 0.15, background: '#fff', borderRadius: 1 }} />
      }
      {dataURL && <div style={{ position: 'absolute', bottom: 1, right: 2, width: 4, height: 4, borderRadius: '50%', background: '#55FF55' }} />}
    </button>
  )
}

// ── 아이템 슬롯 (vanilla 훅 포함) ────────────────────────────────────────────
function ItemSlotWithVanilla({ path, label, selected, onClick }: {
  path: string; label: string; selected: boolean; onClick: () => void
}) {
  const dataURL    = useTextureStore(s => s.textures[path]?.dataURL ?? null)
  const vanillaURL = useVanillaTexture(path)
  return <ItemSlot dataURL={dataURL} vanillaURL={vanillaURL} label={label} selected={selected} onClick={onClick} />
}

// ── 아이템 상세 패널 ──────────────────────────────────────────────────────────
function ItemDetailPanel({ path, label, width, height, onDelete }: {
  path: string; label: string; width: number; height: number; onDelete?: () => void
}) {
  const textures      = useTextureStore(s => s.textures)
  const removeTexture = useTextureStore(s => s.removeTexture)
  const setEditing    = useEditorStore(s => s.setEditingTexture)
  const vanillaURL    = useVanillaTexture(path)
  const dataURL       = textures[path]?.dataURL ?? null
  const displayURL    = dataURL ?? vanillaURL
  const inputRef      = useRef<HTMLInputElement>(null)
  const { upload, uploading, error } = useTextureUpload()

  return (
    <div className="w-56 flex-shrink-0 border-l border-mc-border flex flex-col">
      <div className="flex items-center justify-center" style={{
        height: 160, background: 'radial-gradient(ellipse at center, #2a3a2a 0%, #0d1a0d 100%)', borderBottom: '1px solid #333'
      }}>
        <Item3D dataURL={displayURL} size={72} />
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1 overflow-y-auto">
        <div>
          <p className="text-mc-text-primary text-xs font-semibold">{label}</p>
          <p className="text-mc-text-muted text-xs mt-0.5 font-mono">{width}×{height}px</p>
          <p className="text-mc-text-muted text-xs opacity-60 mt-0.5 break-all leading-relaxed">{path}</p>
          {!dataURL && vanillaURL && <p className="text-mc-text-muted text-xs opacity-50 mt-0.5">바닐라 텍스처 표시 중</p>}
        </div>

        <button onClick={() => setEditing(path)}
          className="w-full text-xs border border-mc-accent rounded px-2 py-1.5 text-mc-accent hover:bg-mc-accent/10 transition-colors font-medium">
          ✏️ 픽셀 에디터로 편집
        </button>

        {dataURL ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-mc-accent text-xs">● 커스텀 텍스처 적용됨</span>
            <button
              onClick={() => downloadTexture(dataURL, path)}
              className="w-full text-xs border border-mc-border rounded px-2 py-1.5 text-mc-text-secondary hover:text-mc-accent hover:border-mc-accent transition-colors text-center"
            >⬇ PNG 저장</button>
            <div className="flex gap-1">
              <button onClick={() => { inputRef.current && (inputRef.current.value = '', inputRef.current.click()) }}
                disabled={uploading}
                className="flex-1 text-xs border border-mc-border rounded px-2 py-1 text-mc-text-secondary hover:text-mc-text-primary hover:bg-mc-bg-hover transition-colors disabled:opacity-50">
                {uploading ? '…' : '📁 교체'}
              </button>
              <button onClick={() => removeTexture(path)}
                className="text-xs border border-mc-border rounded px-2 py-1 text-mc-danger hover:bg-mc-bg-hover transition-colors">✕</button>
            </div>
          </div>
        ) : (
          <button onClick={() => { inputRef.current && (inputRef.current.value = '', inputRef.current.click()) }}
            disabled={uploading}
            className="text-xs border border-mc-border rounded px-2 py-1.5 text-mc-text-secondary hover:text-mc-text-primary hover:bg-mc-bg-hover transition-colors disabled:opacity-50 text-center">
            {uploading ? '업로드 중…' : '📁 PNG 업로드'}
          </button>
        )}
        {error && <p className="text-mc-danger text-xs">{error}</p>}

        {displayURL && (
          <div>
            <p className="text-mc-text-muted text-xs mb-1">2D 원본</p>
            <div className="flex items-center justify-center rounded" style={{ width: 64, height: 64, background: '#1a1a1a', border: '1px solid #333' }}>
              <img src={displayURL} alt={label} style={{ width: 48, height: 48, imageRendering: 'pixelated' }} />
            </div>
          </div>
        )}

        {onDelete && (
          <button onClick={onDelete}
            className="mt-auto text-xs border border-mc-danger rounded px-2 py-1 text-mc-danger hover:bg-mc-bg-hover transition-colors text-center">
            🗑 아이템 삭제
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/png" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f, path) }} />
    </div>
  )
}

// ── 아이템 추가 모달 ──────────────────────────────────────────────────────────
function AddItemModal({ onAdd, onClose }: { onAdd: (item: CustomItem) => void; onClose: () => void }) {
  const [label, setLabel] = useState('')
  const [pathSuffix, setPathSuffix] = useState('')

  const fullPath = `assets/minecraft/textures/item/${pathSuffix.replace(/\.png$/i, '')}.png`

  function handleSubmit() {
    if (!label.trim() || !pathSuffix.trim()) return
    onAdd({ id: `custom_item_${Date.now()}`, label: label.trim(), path: fullPath })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-mc-bg-panel border border-mc-border rounded-xl p-6 w-96 flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-mc-text-primary font-bold text-sm">아이템 추가</h2>
          <button onClick={onClose} className="text-mc-text-muted hover:text-mc-text-secondary text-lg">✕</button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-mc-text-muted text-xs">아이템 이름</label>
          <input type="text" value={label} onChange={e => setLabel(e.target.value)}
            placeholder="예: 나만의 아이템"
            className="bg-mc-bg-dark border border-mc-border rounded px-3 py-1.5 text-sm text-mc-text-primary focus:outline-none focus:border-mc-accent" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-mc-text-muted text-xs">파일명 <span className="opacity-60">(확장자 없어도 됨)</span></label>
          <div className="flex items-center gap-1.5">
            <span className="text-mc-text-muted text-xs opacity-60 shrink-0">…/item/</span>
            <input type="text" value={pathSuffix} onChange={e => setPathSuffix(e.target.value)}
              placeholder="my_item"
              className="flex-1 bg-mc-bg-dark border border-mc-border rounded px-3 py-1.5 text-sm text-mc-text-primary focus:outline-none focus:border-mc-accent" />
            <span className="text-mc-text-muted text-xs opacity-60 shrink-0">.png</span>
          </div>
          {pathSuffix && (
            <p className="text-mc-text-muted text-xs font-mono opacity-60 break-all">{fullPath}</p>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={handleSubmit} disabled={!label.trim() || !pathSuffix.trim()}
            className="flex-1 bg-mc-accent hover:bg-mc-accent-hover disabled:opacity-40 text-black font-bold py-1.5 rounded text-sm transition-colors">
            추가
          </button>
          <button onClick={onClose}
            className="px-4 border border-mc-border rounded text-mc-text-secondary hover:bg-mc-bg-hover text-sm transition-colors">
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
export function ItemPreview() {
  const textures     = useTextureStore(s => s.textures)
  const builtInItems = getTexturesByCategory('item')
  const [customItems, setCustomItems]   = useState<CustomItem[]>(loadCustomItems)
  const [selected, setSelected]         = useState<string | null>(null)
  const [filter, setFilter]             = useState('')
  const [showCustomOnly, setShowCustomOnly] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const allItems = [
    ...builtInItems.map(i => ({ id: i.path, label: i.label, path: i.path, builtIn: true })),
    ...customItems.map(i => ({ ...i, builtIn: false })),
  ]

  const filtered = allItems.filter(item => {
    if (showCustomOnly && item.builtIn) return false
    if (filter.trim() && !item.label.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  const selectedItem = allItems.find(i => i.path === selected)
  const modifiedCount = allItems.filter(i => !!textures[i.path]).length

  function addCustomItem(item: CustomItem) {
    const next = [...customItems, item]
    setCustomItems(next); saveCustomItems(next)
  }
  function deleteCustomItem(id: string) {
    const next = customItems.filter(i => i.id !== id)
    setCustomItems(next); saveCustomItems(next)
    if (selectedItem && !selectedItem.builtIn && selectedItem.id === id) setSelected(null)
  }

  const builtInInfo = builtInItems.find(i => i.path === selected)

  return (
    <div className="flex flex-col h-full bg-mc-bg-dark">
      {/* 헤더 */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-mc-border flex items-center gap-2 flex-wrap">
        <p className="text-mc-text-muted text-xs shrink-0">
          <span className="text-mc-accent font-medium">{modifiedCount}</span>개 수정됨
        </p>
        <input type="text" placeholder="아이템 검색…" value={filter} onChange={e => setFilter(e.target.value)}
          className="flex-1 min-w-0 bg-mc-bg-panel border border-mc-border rounded px-2 py-1 text-xs text-mc-text-primary placeholder:text-mc-text-muted focus:outline-none focus:border-mc-accent" />
        <button onClick={() => setShowCustomOnly(v => !v)}
          className={`px-2 py-1 rounded text-xs border transition-colors shrink-0 ${showCustomOnly ? 'border-mc-accent text-mc-accent bg-mc-accent/10' : 'border-mc-border text-mc-text-muted hover:bg-mc-bg-hover'}`}>
          커스텀만
        </button>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-mc-accent text-mc-accent hover:bg-mc-accent/10 transition-colors font-medium shrink-0">
          + 추가
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 인벤토리 그리드 */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="inline-flex flex-wrap gap-0.5 p-3 rounded"
            style={{ background: '#c6c6c6', border: '2px solid #555', boxShadow: '2px 2px 0 #000' }}>
            {filtered.map(item => (
              <ItemSlotWithVanilla
                key={item.path}
                path={item.path}
                label={item.label}
                selected={selected === item.path}
                onClick={() => setSelected(selected === item.path ? null : item.path)}
              />
            ))}
            {Array.from({ length: (9 - (filtered.length % 9)) % 9 }).map((_, i) => (
              <ItemSlot key={`empty-${i}`} dataURL={null} vanillaURL={null} label="" selected={false} onClick={() => {}} />
            ))}
          </div>
        </div>

        {/* 선택된 아이템 상세 */}
        {selected && selectedItem && (
          <ItemDetailPanel
            path={selected}
            label={selectedItem.label}
            width={builtInInfo?.defaultWidth ?? 16}
            height={builtInInfo?.defaultHeight ?? 16}
            onDelete={!selectedItem.builtIn ? () => deleteCustomItem(selectedItem.id) : undefined}
          />
        )}
      </div>

      {showAddModal && (
        <AddItemModal onAdd={addCustomItem} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  )
}
