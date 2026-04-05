import { useRef, useEffect, useState, useCallback } from 'react'
import { useTextureStore } from '@/store/textureStore'
import { useEditorStore } from '@/store/editorStore'
import { getTextureByPath } from '@/constants/texturePaths'

// ── 타입 ─────────────────────────────────────────────────────────────────────
type Tool = 'pencil' | 'eraser' | 'fill' | 'eyedropper' | 'line' | 'rect'

interface RGBA { r: number; g: number; b: number; a: number }

// ── 색상 유틸 ─────────────────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): RGBA {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b, a: Math.round(alpha * 255) }
}

function rgbaToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

function rgbaEqual(a: RGBA, b: RGBA) {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a
}

// ── 버킷 채우기 (BFS) ─────────────────────────────────────────────────────────
function floodFill(data: Uint8ClampedArray, w: number, h: number, sx: number, sy: number, fill: RGBA) {
  const idx = (x: number, y: number) => (y * w + x) * 4
  const start = idx(sx, sy)
  const target: RGBA = { r: data[start], g: data[start + 1], b: data[start + 2], a: data[start + 3] }
  if (rgbaEqual(target, fill)) return

  const stack: [number, number][] = [[sx, sy]]
  while (stack.length) {
    const [x, y] = stack.pop()!
    const i = idx(x, y)
    if (x < 0 || x >= w || y < 0 || y >= h) continue
    const cur: RGBA = { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] }
    if (!rgbaEqual(cur, target)) continue
    data[i] = fill.r; data[i + 1] = fill.g; data[i + 2] = fill.b; data[i + 3] = fill.a
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
}

// ── 선 (Bresenham) ────────────────────────────────────────────────────────────
function linePixels(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const pts: [number, number][] = []
  let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0)
  let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx - dy
  while (true) {
    pts.push([x0, y0])
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; x0 += sx }
    if (e2 < dx)  { err += dx; y0 += sy }
  }
  return pts
}

// ── 툴 아이콘 ─────────────────────────────────────────────────────────────────
const TOOLS: { id: Tool; icon: string; label: string }[] = [
  { id: 'pencil',     icon: '✏️',  label: '연필 (B)' },
  { id: 'eraser',     icon: '⬜', label: '지우개 (E)' },
  { id: 'fill',       icon: '🪣',  label: '채우기 (F)' },
  { id: 'eyedropper', icon: '💉',  label: '색 추출 (I)' },
  { id: 'line',       icon: '╱',   label: '선 (L)' },
  { id: 'rect',       icon: '▭',   label: '사각형 (R)' },
]

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
export function PixelEditor() {
  const editingPath = useEditorStore((s) => s.editingTexturePath)
  const setEditingTexture = useEditorStore((s) => s.setEditingTexture)
  const textures = useTextureStore((s) => s.textures)
  const setTexture = useTextureStore((s) => s.setTexture)
  const info = editingPath ? getTextureByPath(editingPath) : undefined

  const W = info?.defaultWidth  ?? 16
  const H = info?.defaultHeight ?? 16

  // 오프스크린 캔버스 (실제 픽셀 데이터)
  const offRef  = useRef<HTMLCanvasElement>(null)
  // 화면 표시 캔버스
  const dispRef = useRef<HTMLCanvasElement>(null)
  // 오버레이 캔버스 (선/사각형 미리보기)
  const overRef = useRef<HTMLCanvasElement>(null)

  const [tool, setTool]       = useState<Tool>('pencil')
  const [color, setColor]     = useState('#55ff55')
  const [alpha, setAlpha]     = useState(255)
  const [zoom, setZoom]       = useState(16)
  const [showGrid, setShowGrid] = useState(true)
  const [undoStack, setUndoStack] = useState<ImageData[]>([])
  const [redoStack, setRedoStack] = useState<ImageData[]>([])
  const [colorHistory, setColorHistory] = useState<string[]>([])

  // 선/사각형 시작점
  const shapeStart = useRef<[number, number] | null>(null)
  const drawing = useRef(false)
  const lastPixel = useRef<[number, number] | null>(null)

  // ── 오프스크린 캔버스 초기화 ────────────────────────────────────────────────
  useEffect(() => {
    const off = offRef.current
    if (!off) return
    off.width  = W
    off.height = H
    const ctx = off.getContext('2d')!
    ctx.clearRect(0, 0, W, H)

    const existing = editingPath ? textures[editingPath] : null
    if (existing) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        renderDisplay()
      }
      img.src = existing.dataURL
    } else {
      renderDisplay()
    }
    setUndoStack([])
    setRedoStack([])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPath])

  // ── 화면 렌더 ────────────────────────────────────────────────────────────────
  const renderDisplay = useCallback(() => {
    const off  = offRef.current
    const disp = dispRef.current
    if (!off || !disp) return
    const dw = W * zoom, dh = H * zoom

    // 크기가 달라질 때만 캔버스 크기를 변경 (리셋 방지)
    if (disp.width !== dw)  disp.width  = dw
    if (disp.height !== dh) disp.height = dh

    const ctx = disp.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, dw, dh)
    ctx.drawImage(off, 0, 0, dw, dh)

    // 격자 — 0.5px 오프셋으로 픽셀 가장자리에 정확히 정렬
    if (showGrid && zoom >= 4) {
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 1; x < W; x++) {
        ctx.moveTo(x * zoom + 0.5, 0)
        ctx.lineTo(x * zoom + 0.5, dh)
      }
      for (let y = 1; y < H; y++) {
        ctx.moveTo(0, y * zoom + 0.5)
        ctx.lineTo(dw, y * zoom + 0.5)
      }
      ctx.stroke()
    }
  }, [W, H, zoom, showGrid])

  useEffect(() => { renderDisplay() }, [renderDisplay])

  // ── 스냅샷 저장 (undo용) ─────────────────────────────────────────────────────
  function snapshot() {
    const off = offRef.current
    if (!off) return
    const ctx = off.getContext('2d')!
    const data = ctx.getImageData(0, 0, W, H)
    setUndoStack((prev) => [...prev.slice(-49), data])
    setRedoStack([])
  }

  // ── 픽셀 좌표 계산 ───────────────────────────────────────────────────────────
  function getPixelXY(e: React.MouseEvent): [number, number] {
    const rect = dispRef.current!.getBoundingClientRect()
    return [
      Math.floor((e.clientX - rect.left) / zoom),
      Math.floor((e.clientY - rect.top)  / zoom),
    ]
  }

  // ── 픽셀 그리기 ──────────────────────────────────────────────────────────────
  function putPixel(x: number, y: number, rgba: RGBA) {
    if (x < 0 || x >= W || y < 0 || y >= H) return
    const off = offRef.current!
    const ctx = off.getContext('2d')!
    const id = ctx.getImageData(x, y, 1, 1)
    id.data[0] = rgba.r; id.data[1] = rgba.g; id.data[2] = rgba.b; id.data[3] = rgba.a
    ctx.putImageData(id, x, y)
  }

  // ── 오버레이 렌더 (선/사각형 미리보기) ──────────────────────────────────────
  function renderOverlay(x1: number, y1: number) {
    const over = overRef.current
    if (!over || !shapeStart.current) return
    const [x0, y0] = shapeStart.current
    const dw = W * zoom, dh = H * zoom
    if (over.width !== dw)  over.width  = dw
    if (over.height !== dh) over.height = dh
    const ctx = over.getContext('2d')!
    ctx.clearRect(0, 0, dw, dh)
    ctx.strokeStyle = color
    ctx.lineWidth = zoom
    ctx.imageSmoothingEnabled = false

    if (tool === 'line') {
      const pts = linePixels(x0, y0, x1, y1)
      pts.forEach(([px, py]) => ctx.fillRect(px * zoom, py * zoom, zoom, zoom))
    } else if (tool === 'rect') {
      const rx = Math.min(x0, x1), ry = Math.min(y0, y1)
      const rw = Math.abs(x1 - x0) + 1, rh = Math.abs(y1 - y0) + 1
      ctx.strokeRect(rx * zoom + 0.5, ry * zoom + 0.5, rw * zoom - 1, rh * zoom - 1)
    }
  }

  function clearOverlay() {
    const over = overRef.current
    if (!over) return
    over.getContext('2d')!.clearRect(0, 0, over.width, over.height)
  }

  // ── 색상 히스토리 추가 ────────────────────────────────────────────────────────
  function addColorHistory(hex: string) {
    setColorHistory((prev) => {
      const next = [hex, ...prev.filter((c) => c !== hex)].slice(0, 16)
      return next
    })
  }

  // ── 마우스 이벤트 ────────────────────────────────────────────────────────────
  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    const [x, y] = getPixelXY(e)
    const off = offRef.current!
    const ctx = off.getContext('2d')!
    const rgba = hexToRgba(color, alpha / 255)

    if (tool === 'eyedropper') {
      const px = ctx.getImageData(x, y, 1, 1).data
      setColor(rgbaToHex(px[0], px[1], px[2]))
      setAlpha(px[3])
      setTool('pencil')
      return
    }

    if (tool === 'fill') {
      snapshot()
      const id = ctx.getImageData(0, 0, W, H)
      floodFill(id.data, W, H, x, y, rgba)
      ctx.putImageData(id, 0, 0)
      renderDisplay()
      addColorHistory(color)
      return
    }

    if (tool === 'line' || tool === 'rect') {
      shapeStart.current = [x, y]
      drawing.current = true
      return
    }

    // pencil / eraser
    snapshot()
    drawing.current = true
    const drawRgba = tool === 'eraser' ? { r: 0, g: 0, b: 0, a: 0 } : rgba
    putPixel(x, y, drawRgba)
    lastPixel.current = [x, y]
    renderDisplay()
    if (tool === 'pencil') addColorHistory(color)
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!drawing.current) return
    const [x, y] = getPixelXY(e)

    if (tool === 'line' || tool === 'rect') {
      renderDisplay()
      renderOverlay(x, y)
      return
    }

    const rgba = tool === 'eraser' ? { r: 0, g: 0, b: 0, a: 0 } : hexToRgba(color, alpha / 255)
    const last = lastPixel.current
    if (last) {
      const pts = linePixels(last[0], last[1], x, y)
      pts.forEach(([px, py]) => putPixel(px, py, rgba))
    } else {
      putPixel(x, y, rgba)
    }
    lastPixel.current = [x, y]
    renderDisplay()
  }

  function handleMouseUp(e: React.MouseEvent) {
    if (!drawing.current) return
    const [x, y] = getPixelXY(e)
    const off = offRef.current!
    const rgba = hexToRgba(color, alpha / 255)

    if ((tool === 'line' || tool === 'rect') && shapeStart.current) {
      snapshot()
      const [x0, y0] = shapeStart.current
      if (tool === 'line') {
        linePixels(x0, y0, x, y).forEach(([px, py]) => putPixel(px, py, rgba))
      } else {
        const rx = Math.min(x0, x), ry = Math.min(y0, y)
        const rw = Math.abs(x - x0) + 1, rh = Math.abs(y - y0) + 1
        for (let i = rx; i < rx + rw; i++) {
          putPixel(i, ry, rgba); putPixel(i, ry + rh - 1, rgba)
        }
        for (let j = ry; j < ry + rh; j++) {
          putPixel(rx, j, rgba); putPixel(rx + rw - 1, j, rgba)
        }
      }
      addColorHistory(color)
      shapeStart.current = null
      clearOverlay()
      renderDisplay()
    }

    drawing.current = false
    lastPixel.current = null

    // 저장 (실시간 미리보기)
    const dataURL = off.toDataURL('image/png')
    if (editingPath) {
      setTexture(editingPath, {
        path: editingPath,
        dataURL,
        width: W,
        height: H,
        fileName: editingPath.split('/').pop() ?? editingPath,
        uploadedAt: Date.now(),
      })
    }
  }

  // ── Undo / Redo ──────────────────────────────────────────────────────────────
  function undo() {
    if (undoStack.length === 0) return
    const off = offRef.current!
    const ctx = off.getContext('2d')!
    const current = ctx.getImageData(0, 0, W, H)
    setRedoStack((r) => [...r, current])
    const prev = undoStack[undoStack.length - 1]
    setUndoStack((u) => u.slice(0, -1))
    ctx.putImageData(prev, 0, 0)
    renderDisplay()
    // 저장
    const dataURL = off.toDataURL('image/png')
    if (editingPath) {
      setTexture(editingPath, { path: editingPath, dataURL, width: W, height: H, fileName: editingPath.split('/').pop() ?? editingPath, uploadedAt: Date.now() })
    }
  }

  function redo() {
    if (redoStack.length === 0) return
    const off = offRef.current!
    const ctx = off.getContext('2d')!
    const current = ctx.getImageData(0, 0, W, H)
    setUndoStack((u) => [...u, current])
    const next = redoStack[redoStack.length - 1]
    setRedoStack((r) => r.slice(0, -1))
    ctx.putImageData(next, 0, 0)
    renderDisplay()
    const dataURL = off.toDataURL('image/png')
    if (editingPath) {
      setTexture(editingPath, { path: editingPath, dataURL, width: W, height: H, fileName: editingPath.split('/').pop() ?? editingPath, uploadedAt: Date.now() })
    }
  }

  // ── 전체 지우기 ──────────────────────────────────────────────────────────────
  function clearCanvas() {
    snapshot()
    const off = offRef.current!
    off.getContext('2d')!.clearRect(0, 0, W, H)
    renderDisplay()
    if (editingPath) {
      setTexture(editingPath, { path: editingPath, dataURL: off.toDataURL('image/png'), width: W, height: H, fileName: editingPath.split('/').pop() ?? editingPath, uploadedAt: Date.now() })
    }
  }

  // ── 키보드 단축키 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo() }
      if (e.key === 'b') setTool('pencil')
      if (e.key === 'e') setTool('eraser')
      if (e.key === 'f') setTool('fill')
      if (e.key === 'i') setTool('eyedropper')
      if (e.key === 'l') setTool('line')
      if (e.key === 'r') setTool('rect')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!editingPath) return null

  const rgbaColor = hexToRgba(color, alpha / 255)
  const previewColor = `rgba(${rgbaColor.r},${rgbaColor.g},${rgbaColor.b},${alpha / 255})`

  return (
    <div className="flex flex-col h-full bg-mc-bg-dark overflow-hidden">
      {/* 상단 툴바 */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-mc-bg-panel border-b border-mc-border flex-wrap">
        {/* 닫기 */}
        <button
          onClick={() => setEditingTexture(null)}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs border border-mc-border text-mc-text-muted hover:text-mc-danger hover:border-mc-danger transition-colors"
        >
          ✕ 닫기
        </button>

        <div className="w-px h-5 bg-mc-border" />

        {/* 툴 선택 */}
        <div className="flex items-center gap-1">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              title={t.label}
              onClick={() => setTool(t.id)}
              className={`w-8 h-8 rounded text-base flex items-center justify-center transition-colors border ${
                tool === t.id
                  ? 'border-mc-accent bg-mc-accent/20 text-mc-accent'
                  : 'border-mc-border text-mc-text-secondary hover:bg-mc-bg-hover'
              }`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-mc-border" />

        {/* 색상 + 투명도 */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div
              className="w-7 h-7 rounded border-2 border-mc-border cursor-pointer"
              style={{ background: `repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 8px 8px` }}
            >
              <div
                className="w-full h-full rounded"
                style={{ background: previewColor }}
                onClick={() => document.getElementById('pixel-color-input')?.click()}
              />
            </div>
            <input
              id="pixel-color-input"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute opacity-0 w-0 h-0 pointer-events-none"
            />
          </div>

          {/* 투명도 */}
          <div className="flex items-center gap-1">
            <span className="text-mc-text-muted text-xs">A</span>
            <input
              type="range"
              min={0} max={255}
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
              className="w-16 h-1.5 accent-mc-accent"
            />
            <span className="text-mc-text-muted text-xs font-mono w-6">{Math.round(alpha / 255 * 100)}%</span>
          </div>
        </div>

        <div className="w-px h-5 bg-mc-border" />

        {/* Undo / Redo */}
        <div className="flex gap-1">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            title="실행 취소 (Ctrl+Z)"
            className="w-8 h-8 rounded border border-mc-border text-mc-text-secondary hover:bg-mc-bg-hover disabled:opacity-30 transition-colors text-sm"
          >↩</button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            title="다시 실행 (Ctrl+Y)"
            className="w-8 h-8 rounded border border-mc-border text-mc-text-secondary hover:bg-mc-bg-hover disabled:opacity-30 transition-colors text-sm"
          >↪</button>
        </div>

        <div className="w-px h-5 bg-mc-border" />

        {/* 그리드 / 확대 */}
        <button
          onClick={() => setShowGrid((g) => !g)}
          className={`px-2 py-1 rounded text-xs border transition-colors ${
            showGrid ? 'border-mc-accent text-mc-accent bg-mc-accent/10' : 'border-mc-border text-mc-text-muted hover:bg-mc-bg-hover'
          }`}
        >#</button>

        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(2, z - 2))} className="w-6 h-6 rounded border border-mc-border text-mc-text-secondary hover:bg-mc-bg-hover text-xs">−</button>
          <span className="text-mc-text-muted text-xs font-mono w-8 text-center">{zoom}×</span>
          <button onClick={() => setZoom((z) => Math.min(32, z + 2))} className="w-6 h-6 rounded border border-mc-border text-mc-text-secondary hover:bg-mc-bg-hover text-xs">+</button>
        </div>

        <div className="w-px h-5 bg-mc-border" />

        {/* 전체 지우기 */}
        <button
          onClick={() => { if (confirm('전체를 지울까요?')) clearCanvas() }}
          className="px-2 py-1 rounded text-xs border border-mc-border text-mc-danger hover:bg-mc-bg-hover transition-colors"
        >🗑 전체 지우기</button>

        {/* 파일 정보 */}
        <span className="ml-auto text-mc-text-muted text-xs font-mono hidden lg:block truncate">
          {info?.label ?? editingPath.split('/').pop()} · {W}×{H}
        </span>
      </div>

      {/* 편집 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 캔버스 */}
        <div
          className="flex-1 overflow-auto flex items-center justify-center bg-[repeating-conic-gradient(#2a2a2a_0%_25%,#1a1a1a_0%_50%)] bg-[length:16px_16px] p-4"
        >
          <div className="relative" style={{ cursor: tool === 'eyedropper' ? 'crosshair' : tool === 'fill' ? 'cell' : 'crosshair' }}>
            {/* 오프스크린 (숨김) */}
            <canvas ref={offRef} className="hidden" />

            {/* 표시 캔버스 */}
            <canvas
              ref={dispRef}
              style={{ imageRendering: 'pixelated', display: 'block', userSelect: 'none' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { drawing.current = false; lastPixel.current = null; clearOverlay() }}
            />

            {/* 오버레이 (선/사각형 미리보기) */}
            <canvas
              ref={overRef}
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', imageRendering: 'pixelated' }}
            />
          </div>
        </div>

        {/* 오른쪽 사이드: 색상 팔레트 + 미리보기 */}
        <div className="w-36 flex-shrink-0 border-l border-mc-border flex flex-col bg-mc-bg-panel overflow-y-auto">
          {/* 색상 히스토리 */}
          <div className="p-2 border-b border-mc-border">
            <p className="text-mc-text-muted text-xs mb-1.5">사용한 색상</p>
            <div className="grid grid-cols-4 gap-1">
              {colorHistory.map((c, i) => (
                <button
                  key={i}
                  title={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded border ${color === c ? 'border-mc-accent' : 'border-mc-border'}`}
                  style={{ background: c }}
                />
              ))}
              {colorHistory.length === 0 && (
                <span className="col-span-4 text-mc-text-muted text-xs opacity-60">없음</span>
              )}
            </div>
          </div>

          {/* 마인크래프트 기본 팔레트 */}
          <div className="p-2 border-b border-mc-border">
            <p className="text-mc-text-muted text-xs mb-1.5">MC 팔레트</p>
            <div className="grid grid-cols-4 gap-1">
              {[
                '#ffffff','#dddddd','#aaaaaa','#555555',
                '#222222','#000000','#ff5555','#ff0000',
                '#ffaa00','#ffff55','#55ff55','#00aa00',
                '#55ffff','#00aaaa','#5555ff','#0000aa',
                '#ff55ff','#aa00aa','#aa7700','#6a3a1a',
                '#3a5e1f','#1a3a5e','#7a1a2e','#c66600',
              ].map((c) => (
                <button
                  key={c}
                  title={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded border ${color === c ? 'border-white' : 'border-mc-border'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* 실시간 미리보기 */}
          <div className="p-2">
            <p className="text-mc-text-muted text-xs mb-1.5">미리보기</p>
            <canvas
              ref={(el) => {
                if (!el || !offRef.current) return
                el.width = W; el.height = H
                const ctx = el.getContext('2d')!
                ctx.imageSmoothingEnabled = false
                ctx.clearRect(0, 0, W, H)
                ctx.drawImage(offRef.current, 0, 0)
              }}
              style={{ imageRendering: 'pixelated', width: '100%', border: '1px solid #333', borderRadius: 4 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
