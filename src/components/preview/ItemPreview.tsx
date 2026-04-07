import { useState, useRef, useEffect } from 'react'
import { useTextureStore } from '@/store/textureStore'
import { useEditorStore } from '@/store/editorStore'
import { useTextureUpload } from '@/hooks/useTextureUpload'
import { useVanillaTexture } from '@/hooks/useVanillaTexture'
import { getTexturesByCategory } from '@/constants/texturePaths'
import { downloadTexture } from '@/utils/downloadTexture'
import { AnimationEditor } from '@/components/animation/AnimationEditor'

// ── 커스텀 아이템 스토어 ──────────────────────────────────────────────────────
interface CustomItem { id: string; label: string; path: string }

function loadCustomItems(): CustomItem[] {
  try { return JSON.parse(localStorage.getItem('mc_custom_items') ?? '[]') } catch { return [] }
}
function saveCustomItems(items: CustomItem[]) {
  localStorage.setItem('mc_custom_items', JSON.stringify(items))
}

// ── 아이소메트릭 3D 렌더 (공용) ──────────────────────────────────────────────
function drawIsometric(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  W: number, H: number,
  canvasW: number, canvasH: number,
) {
  const DR = 0.45
  const sFromW = (canvasW - 8) / ((W + H) / 2)
  const sFromH = (canvasH - 8) / ((W + H) / 4 + DR)
  const s = Math.min(sFromW, sFromH)
  const d = s * DR

  const renderW = (W + H) * s / 2
  const renderH = (W + H) * s / 4 + d
  const originX = (canvasW - renderW) / 2 + H * s / 2
  const originY = (canvasH - renderH) / 2 + s / 4

  const pixels: [number, number][] = []
  for (let row = 0; row < H; row++)
    for (let col = 0; col < W; col++)
      if (data[(row * W + col) * 4 + 3] > 8) pixels.push([col, row])
  pixels.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || a[1] - b[1])

  for (const [col, row] of pixels) {
    const i = (row * W + col) * 4
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3] / 255
    const cx = originX + (col - row) * (s / 2)
    const cy = originY + (col + row) * (s / 4)
    const c = (br: number) => `rgba(${Math.round(r * br)},${Math.round(g * br)},${Math.round(b * br)},${a})`

    // 왼쪽 면 (중간 밝기)
    ctx.fillStyle = c(0.72)
    ctx.beginPath()
    ctx.moveTo(cx, cy + s / 4); ctx.lineTo(cx - s / 2, cy)
    ctx.lineTo(cx - s / 2, cy + d); ctx.lineTo(cx, cy + s / 4 + d)
    ctx.closePath(); ctx.fill()

    // 오른쪽 면 (어두운)
    ctx.fillStyle = c(0.52)
    ctx.beginPath()
    ctx.moveTo(cx + s / 2, cy); ctx.lineTo(cx, cy + s / 4)
    ctx.lineTo(cx, cy + s / 4 + d); ctx.lineTo(cx + s / 2, cy + d)
    ctx.closePath(); ctx.fill()

    // 윗면 (가장 밝음)
    ctx.fillStyle = c(1.0)
    ctx.beginPath()
    ctx.moveTo(cx, cy - s / 4); ctx.lineTo(cx + s / 2, cy)
    ctx.lineTo(cx, cy + s / 4); ctx.lineTo(cx - s / 2, cy)
    ctx.closePath(); ctx.fill()
  }
}

function usePixelData(dataURL: string | null) {
  const [pixels, setPixels] = useState<{ data: Uint8ClampedArray; W: number; H: number } | null>(null)
  useEffect(() => {
    if (!dataURL) { setPixels(null); return }
    const img = new Image()
    img.onload = () => {
      const off = document.createElement('canvas')
      off.width = img.naturalWidth; off.height = img.naturalHeight
      const offCtx = off.getContext('2d')!
      offCtx.drawImage(img, 0, 0)
      setPixels({ data: offCtx.getImageData(0, 0, off.width, off.height).data, W: off.width, H: off.height })
    }
    img.src = dataURL
  }, [dataURL])
  return pixels
}

// ── 상세 패널용 3D (고정 캔버스 크기) ───────────────────────────────────────
function Item3D({ dataURL, canvasW = 196, canvasH = 120 }: {
  dataURL: string | null; canvasW?: number; canvasH?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const px = usePixelData(dataURL)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvasW, canvasH)
    if (px) drawIsometric(ctx, px.data, px.W, px.H, canvasW, canvasH)
  }, [px, canvasW, canvasH])

  if (!dataURL) return (
    <div style={{ width: canvasW, height: canvasH, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15 }}>
      <span style={{ fontSize: 32 }}>?</span>
    </div>
  )
  return (
    <canvas ref={canvasRef} width={canvasW} height={canvasH}
      style={{ imageRendering: 'pixelated', filter: 'drop-shadow(2px 4px 8px rgba(0,0,0,0.9))' }} />
  )
}

// ── 그리드용 3D 슬롯 (소형) ──────────────────────────────────────────────────
function Item3DSlot({ dataURL, vanillaURL, label, selected, onClick }: {
  dataURL: string | null; vanillaURL: string | null
  label: string; selected: boolean; onClick: () => void
}) {
  const displayURL = dataURL ?? vanillaURL
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const px = usePixelData(displayURL)
  const CW = 72, CH = 48

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, CW, CH)
    if (px) drawIsometric(ctx, px.data, px.W, px.H, CW, CH)
  }, [px])

  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex flex-col items-center justify-center gap-0.5 p-1 rounded transition-all ${
        selected ? 'ring-2 ring-mc-accent bg-mc-accent/10' : 'hover:bg-mc-bg-hover'
      }`}
      style={{ width: 84, minHeight: 72 }}
    >
      <div style={{ width: CW, height: CH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {displayURL
          ? <canvas ref={canvasRef} width={CW} height={CH}
              style={{ imageRendering: 'pixelated', opacity: dataURL ? 1 : 0.4 }} />
          : <div style={{ width: 32, height: 32, opacity: 0.1, background: '#fff', borderRadius: 2 }} />
        }
      </div>
      <span className="text-mc-text-muted truncate w-full text-center leading-tight"
        style={{ fontSize: 9, color: dataURL ? '#aaffaa' : undefined }}>
        {label}
      </span>
      {dataURL && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#55FF55' }} />}
    </button>
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

// ── 아이템 슬롯 (vanilla 훅 포함, 뷰 모드 분기) ──────────────────────────────
function ItemSlotWithVanilla({ path, label, selected, onClick, view3D }: {
  path: string; label: string; selected: boolean; onClick: () => void; view3D: boolean
}) {
  const dataURL    = useTextureStore(s => s.textures[path]?.dataURL ?? null)
  const vanillaURL = useVanillaTexture(path)
  if (view3D) return (
    <Item3DSlot dataURL={dataURL} vanillaURL={vanillaURL} label={label} selected={selected} onClick={onClick} />
  )
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
  const [showAnim, setShowAnim] = useState(false)

  return (
    <div className="w-56 flex-shrink-0 border-l border-mc-border flex flex-col">
      <div className="flex items-center justify-center" style={{
        height: 150, background: 'radial-gradient(ellipse at center, #1e2d3a 0%, #0a0f1a 100%)', borderBottom: '1px solid #333'
      }}>
        <Item3D dataURL={displayURL} canvasW={196} canvasH={120} />
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

        {/* 애니메이션 설정 (커스텀 텍스처가 있을 때만) */}
        {dataURL && (
          <div className="border-t border-mc-border -mx-3">
            <button
              onClick={() => setShowAnim(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-mc-text-secondary hover:text-mc-text-primary hover:bg-mc-bg-hover transition-colors">
              <span className="font-semibold">🎬 애니메이션</span>
              <span className="opacity-60">{showAnim ? '▴' : '▾'}</span>
            </button>
            {showAnim && (
              <div className="border-t border-mc-border">
                <AnimationEditor texturePath={path} />
              </div>
            )}
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

// ── 프리셋 타입 & 픽셀 생성기 ─────────────────────────────────────────────────
type PresetId = 'blank' | 'sword' | 'spear' | 'arrow'

function generatePreset(id: PresetId, size: number): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(size * size * 4)
  if (id === 'blank') return buf

  const set = (x: number, y: number, r: number, g: number, b: number) => {
    const xi = Math.max(0, Math.min(size - 1, Math.round(x)))
    const yi = Math.max(0, Math.min(size - 1, Math.round(y)))
    const idx = (yi * size + xi) * 4
    buf[idx] = r; buf[idx + 1] = g; buf[idx + 2] = b; buf[idx + 3] = 255
  }

  // 16×16 기준 좌표 → 실제 크기로 스케일
  const f = (n: number) => n * (size / 16)

  if (id === 'spear') {
    // 창끝 (steel, 우상단)
    set(f(15), f(0),  216, 224, 240)
    set(f(15), f(1),  172, 184, 204); set(f(14), f(1), 216, 224, 240)
    set(f(14), f(2),  172, 184, 204); set(f(13), f(2), 216, 224, 240)
    set(f(13), f(3),  148, 160, 180); set(f(12), f(3), 188, 200, 220)
    // 자루 (wood, 대각선)
    for (let row = 4; row <= 13; row++) {
      set(f(15 - row), f(row), 168, 120, 60)
      set(f(14 - row), f(row), 124, 84, 32)
    }
    // 끝 마감
    set(f(1), f(14), 100, 64, 20)
    set(f(0), f(15),  80, 48, 12)
  }

  if (id === 'sword') {
    // 검날 (diamond)
    for (let i = 0; i <= 6; i++) {
      set(f(14 - i), f(i), 160, 248, 244)
      set(f(13 - i), f(i),  80, 212, 204)
    }
    // 가드 (gold)
    set(f(7), f(7), 204, 168, 52); set(f(8), f(7), 204, 168, 52)
    set(f(7), f(8), 204, 168, 52)
    // 손잡이
    for (let i = 8; i <= 11; i++) set(f(14 - i), f(i), 140, 84, 36)
    // 봉 끝
    set(f(2), f(12), 204, 168, 52); set(f(3), f(12), 204, 168, 52)
  }

  if (id === 'arrow') {
    // 화살촉
    set(f(15), f(0), 224, 224, 232)
    set(f(14), f(1), 200, 200, 212); set(f(15), f(1), 164, 164, 176)
    set(f(13), f(2), 200, 200, 212)
    // 화살대
    for (let i = 3; i <= 11; i++) set(f(15 - i), f(i), 168, 124, 68)
    // 깃털
    set(f(3),  f(12), 216, 88, 88); set(f(2),  f(12), 192, 64, 64)
    set(f(3),  f(13), 192, 64, 64); set(f(2),  f(13), 168, 44, 44)
  }

  return buf
}

// ── 모달 내장 미니 픽셀 에디터 ───────────────────────────────────────────────
const CANVAS_PX = 224   // 화면상 고정 크기 (px)
const MINI_SIZES = [8, 16, 32, 64] as const

function MiniPixelEditor({ size, onDataURL, initialRgba }: {
  size: number
  onDataURL: (url: string | null) => void
  initialRgba?: Uint8ClampedArray
}) {
  const zoom = Math.max(2, Math.floor(CANVAS_PX / size))
  const [rgba, setRgba]   = useState<Uint8ClampedArray>(() =>
    initialRgba ? new Uint8ClampedArray(initialRgba) : new Uint8ClampedArray(size * size * 4)
  )
  const [color, setColor] = useState('#55ff55')
  const [alpha, setAlpha] = useState(255)
  const [tool,  setTool]  = useState<'pencil' | 'eraser'>('pencil')
  const [down,  setDown]  = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 크기 or 프리셋이 바뀌면 버퍼 교체
  useEffect(() => {
    setRgba(initialRgba ? new Uint8ClampedArray(initialRgba) : new Uint8ClampedArray(size * size * 4))
  }, [size, initialRgba])

  // 캔버스 렌더
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const W = size, H = size
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W * zoom, H * zoom)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#2a2a2a' : '#1e1e1e'
      ctx.fillRect(x * zoom, y * zoom, zoom, zoom)
    }
    const id = new ImageData(W, H)
    id.data.set(rgba)
    const off = document.createElement('canvas'); off.width = W; off.height = H
    off.getContext('2d')!.putImageData(id, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(off, 0, 0, W * zoom, H * zoom)
    if (zoom >= 4) {
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.5
      for (let x = 0; x <= W; x++) { ctx.beginPath(); ctx.moveTo(x*zoom,0); ctx.lineTo(x*zoom,H*zoom); ctx.stroke() }
      for (let y = 0; y <= H; y++) { ctx.beginPath(); ctx.moveTo(0,y*zoom); ctx.lineTo(W*zoom,y*zoom); ctx.stroke() }
    }
    const off2 = document.createElement('canvas'); off2.width = W; off2.height = H
    off2.getContext('2d')!.putImageData(id, 0, 0)
    const hasPixel = rgba.some((v, i) => i % 4 === 3 && v > 0)
    onDataURL(hasPixel ? off2.toDataURL('image/png') : null)
  }, [rgba, size, zoom])

  function applyPixel(ex: number, ey: number) {
    const canvas = canvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = (size * zoom) / rect.width
    const scaleY = (size * zoom) / rect.height
    const px = Math.floor((ex - rect.left) * scaleX / zoom)
    const py = Math.floor((ey - rect.top)  * scaleY / zoom)
    if (px < 0 || py < 0 || px >= size || py >= size) return
    const next = new Uint8ClampedArray(rgba)
    const i = (py * size + px) * 4
    if (tool === 'eraser') {
      next[i] = next[i+1] = next[i+2] = next[i+3] = 0
    } else {
      next[i]   = parseInt(color.slice(1,3), 16)
      next[i+1] = parseInt(color.slice(3,5), 16)
      next[i+2] = parseInt(color.slice(5,7), 16)
      next[i+3] = alpha
    }
    setRgba(next)
  }

  function clear() { setRgba(new Uint8ClampedArray(size * size * 4)) }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {(['pencil','eraser'] as const).map(t => (
          <button key={t} onClick={() => setTool(t)}
            className={`px-2 py-1 rounded text-xs border transition-colors ${tool===t ? 'border-mc-accent text-mc-accent bg-mc-accent/10' : 'border-mc-border text-mc-text-muted hover:bg-mc-bg-hover'}`}>
            {t === 'pencil' ? '✏️ 연필' : '🧹 지우개'}
          </button>
        ))}
        <input type="color" value={color} onChange={e => setColor(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border border-mc-border bg-transparent p-0.5" />
        <div className="flex items-center gap-1 flex-1">
          <span className="text-mc-text-muted text-xs shrink-0">투명도</span>
          <input type="range" min={0} max={255} value={alpha} onChange={e => setAlpha(+e.target.value)}
            className="flex-1 accent-mc-accent" />
        </div>
        <button onClick={clear} className="px-2 py-1 rounded text-xs border border-mc-border text-mc-danger hover:bg-mc-bg-hover">초기화</button>
      </div>
      <canvas
        ref={canvasRef}
        width={size * zoom}
        height={size * zoom}
        style={{ imageRendering: 'pixelated', cursor: tool === 'eraser' ? 'cell' : 'crosshair', border: '1px solid #444', borderRadius: 4, maxWidth: CANVAS_PX, maxHeight: CANVAS_PX }}
        onMouseDown={e => { setDown(true); applyPixel(e.clientX, e.clientY) }}
        onMouseMove={e => { if (down) applyPixel(e.clientX, e.clientY) }}
        onMouseUp={() => setDown(false)}
        onMouseLeave={() => setDown(false)}
      />
    </div>
  )
}

// ── 아이템 추가 모달 (직접 그리기 + PNG 업로드) ────────────────────────────────
function AddItemModal({ onAdd, onClose }: {
  onAdd: (item: CustomItem, dataURL: string | null, w: number, h: number) => void
  onClose: () => void
}) {
  const [label,      setLabel]      = useState('')
  const [pathSuffix, setPathSuffix] = useState('')
  const [mode,       setMode]       = useState<'draw' | 'upload'>('draw')
  const [drawSize,   setDrawSize]   = useState(16)
  const [drawnURL,   setDrawnURL]   = useState<string | null>(null)
  const [uploadURL,  setUploadURL]  = useState<string | null>(null)
  const [uploadSize, setUploadSize] = useState<{ w: number; h: number }>({ w: 16, h: 16 })
  const [imgError,   setImgError]   = useState<string | null>(null)
  const [dragging,   setDragging]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // 프리셋
  const [presetId,     setPresetId]     = useState<PresetId>('blank')
  const [presetPixels, setPresetPixels] = useState<Uint8ClampedArray | undefined>(undefined)

  // 드로잉 크기가 바뀌면 프리셋 재생성
  useEffect(() => {
    if (presetId !== 'blank') setPresetPixels(generatePreset(presetId, drawSize))
  }, [drawSize, presetId])

  function applyPreset(id: PresetId) {
    setPresetId(id)
    setPresetPixels(id === 'blank' ? undefined : generatePreset(id, drawSize))
    setDrawnURL(null)
  }

  const activeURL  = mode === 'draw' ? drawnURL : uploadURL
  const activeSize = mode === 'draw' ? { w: drawSize, h: drawSize } : uploadSize
  const autoSuffix = label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'my_item'
  const usedSuffix = pathSuffix.trim() || autoSuffix
  const fullPath   = `assets/minecraft/textures/item/${usedSuffix.replace(/\.png$/i, '')}.png`

  function handleFile(file: File) {
    setImgError(null)
    if (file.type !== 'image/png') { setImgError('PNG 파일만 가능합니다.'); return }
    if (file.size > 4 * 1024 * 1024) { setImgError('4MB 이하 파일만 가능합니다.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      const img = new Image()
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img
        setUploadURL(url)
        setUploadSize({ w, h })
        if (!pathSuffix.trim()) setPathSuffix(file.name.replace(/\.png$/i, ''))
        if (!label.trim())      setLabel(file.name.replace(/\.png$/i, '').replace(/_/g, ' '))
      }
      img.src = url
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit() {
    if (!label.trim()) return
    onAdd(
      { id: `custom_item_${Date.now()}`, label: label.trim(), path: fullPath },
      activeURL,
      activeSize.w, activeSize.h,
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-mc-bg-panel border border-mc-border rounded-xl shadow-2xl flex flex-col" style={{ width: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="p-5 flex flex-col gap-4">

          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <h2 className="text-mc-text-primary font-bold text-sm">🗡️ 커스텀 아이템 추가</h2>
            <button onClick={onClose} className="text-mc-text-muted hover:text-mc-text-secondary text-lg leading-none">✕</button>
          </div>

          {/* 프리셋 선택 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-mc-text-secondary text-xs font-semibold">프리셋 시작점</span>
            <div className="grid grid-cols-4 gap-1.5">
              {([
                ['blank', '⬜', '빈 캔버스'],
                ['sword', '⚔️', '검'],
                ['spear', '🗡', '창'],
                ['arrow', '🏹', '화살'],
              ] as [PresetId, string, string][]).map(([id, emoji, name]) => (
                <button key={id} onClick={() => applyPreset(id)}
                  className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded border text-xs transition-colors ${
                    presetId === id
                      ? 'border-mc-accent bg-mc-accent/10 text-mc-accent'
                      : 'border-mc-border text-mc-text-muted hover:bg-mc-bg-hover'
                  }`}>
                  <span className="text-base leading-none">{emoji}</span>
                  <span className="font-medium">{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 모드 탭 */}
          <div className="flex rounded-lg overflow-hidden border border-mc-border">
            {(['draw','upload'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${mode===m ? 'bg-mc-accent text-black' : 'text-mc-text-muted hover:bg-mc-bg-hover'}`}>
                {m === 'draw' ? '✏️ 직접 그리기' : '📁 PNG 업로드'}
              </button>
            ))}
          </div>

          {/* 본문 */}
          {mode === 'draw' ? (
            <div className="flex flex-col gap-2">
              {/* 크기 선택 */}
              <div className="flex items-center gap-2">
                <span className="text-mc-text-muted text-xs shrink-0">텍스처 크기</span>
                <div className="flex gap-1">
                  {MINI_SIZES.map(s => (
                    <button key={s} onClick={() => setDrawSize(s)}
                      className={`px-2 py-0.5 rounded text-xs border transition-colors ${drawSize===s ? 'border-mc-accent text-mc-accent bg-mc-accent/10' : 'border-mc-border text-mc-text-muted hover:bg-mc-bg-hover'}`}>
                      {s}×{s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                {/* 미니 픽셀 에디터 */}
                <MiniPixelEditor size={drawSize} onDataURL={setDrawnURL} initialRgba={presetPixels} />
                {/* 실시간 3D 미리보기 */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <span className="text-mc-text-muted text-xs">3D 미리보기</span>
                  <div className="flex items-center justify-center rounded-lg"
                    style={{ width: 160, height: 120, background: 'radial-gradient(ellipse at center, #1e2d3a 0%, #08101a 100%)', border: '1px solid #333' }}>
                    <Item3D dataURL={drawnURL} canvasW={154} canvasH={110} />
                  </div>
                  {!drawnURL && <p className="text-mc-text-muted text-xs opacity-50 text-center">픽셀을 그리면<br/>여기 3D로 보입니다</p>}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                className={`flex items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                  dragging ? 'border-mc-accent bg-mc-accent/10' : 'border-mc-border bg-mc-bg-dark hover:border-mc-accent/40'
                }`}
                style={{ height: 140 }}
              >
                {uploadURL ? (
                  <Item3D dataURL={uploadURL} canvasW={240} canvasH={130} />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-mc-text-muted select-none">
                    <span className="text-4xl opacity-30">🖼️</span>
                    <span className="text-xs">PNG 드래그 또는 클릭</span>
                    <span className="text-xs opacity-50">16×16 · 32×32 · 64×64 등</span>
                  </div>
                )}
              </div>
              {imgError && <p className="text-mc-danger text-xs mt-1">⚠ {imgError}</p>}
              <input ref={fileRef} type="file" accept="image/png" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>
          )}

          {/* 이름 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-mc-text-secondary text-xs font-semibold">아이템 이름 <span className="text-mc-danger">*</span></label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)}
              placeholder="예: 마법의 검" autoFocus
              className="bg-mc-bg-dark border border-mc-border rounded px-3 py-2 text-sm text-mc-text-primary focus:outline-none focus:border-mc-accent placeholder:text-mc-text-muted" />
          </div>

          {/* 경로 */}
          <div className="flex flex-col gap-1">
            <label className="text-mc-text-secondary text-xs font-semibold">
              경로 <span className="text-mc-text-muted font-normal">(선택 · 비우면 자동)</span>
            </label>
            <div className="flex items-center gap-1 font-mono text-xs text-mc-text-muted">
              <span className="opacity-50 shrink-0">item/</span>
              <input type="text" value={pathSuffix} onChange={e => setPathSuffix(e.target.value)}
                placeholder={autoSuffix}
                className="flex-1 bg-mc-bg-dark border border-mc-border rounded px-2 py-1.5 text-mc-text-primary focus:outline-none focus:border-mc-accent placeholder:text-mc-text-muted" />
              <span className="opacity-50 shrink-0">.png</span>
            </div>
            <p className="text-mc-text-muted text-xs opacity-40 font-mono break-all">{fullPath}</p>
          </div>

          {/* 추가 버튼 */}
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={!label.trim()}
              className="flex-1 bg-mc-accent hover:bg-mc-accent-hover disabled:opacity-40 text-black font-bold py-2 rounded text-sm transition-colors">
              {activeURL ? '✅ 아이템 추가' : '아이템 추가 (텍스처 없음)'}
            </button>
            <button onClick={onClose}
              className="px-4 border border-mc-border rounded text-mc-text-secondary hover:bg-mc-bg-hover text-sm">
              취소
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
export function ItemPreview() {
  const textures     = useTextureStore(s => s.textures)
  const setTexture   = useTextureStore(s => s.setTexture)
  const builtInItems = getTexturesByCategory('item')
  const [customItems, setCustomItems]   = useState<CustomItem[]>(loadCustomItems)
  const [selected, setSelected]         = useState<string | null>(null)
  const [filter, setFilter]             = useState('')
  const [showCustomOnly, setShowCustomOnly] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const [view3D, setView3D] = useState(false)

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

  function addCustomItem(item: CustomItem, dataURL: string | null, w: number, h: number) {
    const next = [...customItems, item]
    setCustomItems(next); saveCustomItems(next)
    if (dataURL) {
      setTexture(item.path, {
        path: item.path, dataURL,
        width: w, height: h,
        fileName: `${item.path.split('/').pop() ?? 'item.png'}`,
        uploadedAt: Date.now(),
      })
    }
    setSelected(item.path)
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
        <button onClick={() => setView3D(v => !v)}
          title={view3D ? '2D 그리드로 전환' : '3D 뷰로 전환'}
          className={`px-2 py-1 rounded text-xs border transition-colors shrink-0 ${view3D ? 'border-mc-accent text-mc-accent bg-mc-accent/10' : 'border-mc-border text-mc-text-muted hover:bg-mc-bg-hover'}`}>
          {view3D ? '3D ✓' : '3D'}
        </button>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-mc-accent text-mc-accent hover:bg-mc-accent/10 transition-colors font-medium shrink-0">
          + 추가
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 아이템 그리드 */}
        <div className="flex-1 overflow-y-auto p-3">
          {view3D ? (
            // 3D 뷰
            <div className="flex flex-wrap gap-2">
              {filtered.map(item => (
                <ItemSlotWithVanilla
                  key={item.path}
                  path={item.path}
                  label={item.label}
                  selected={selected === item.path}
                  onClick={() => setSelected(selected === item.path ? null : item.path)}
                  view3D
                />
              ))}
            </div>
          ) : (
            // 2D 인벤토리 그리드
            <div className="inline-flex flex-wrap gap-0.5 p-3 rounded"
              style={{ background: '#c6c6c6', border: '2px solid #555', boxShadow: '2px 2px 0 #000' }}>
              {filtered.map(item => (
                <ItemSlotWithVanilla
                  key={item.path}
                  path={item.path}
                  label={item.label}
                  selected={selected === item.path}
                  onClick={() => setSelected(selected === item.path ? null : item.path)}
                  view3D={false}
                />
              ))}
              {Array.from({ length: (9 - (filtered.length % 9)) % 9 }).map((_, i) => (
                <ItemSlot key={`empty-${i}`} dataURL={null} vanillaURL={null} label="" selected={false} onClick={() => {}} />
              ))}
            </div>
          )}
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
        <AddItemModal
          onAdd={(item, dataURL, w, h) => addCustomItem(item, dataURL, w, h)}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
