import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva'
import { useEditorStore } from '@/store/editorStore'
import { useTextureStore } from '@/store/textureStore'
import { getTextureByPath } from '@/constants/texturePaths'
import { CanvasToolbar } from './CanvasToolbar'

export function EditorCanvas() {
  const selectedPath = useEditorStore((s) => s.selectedTexturePath)
  const zoom = useEditorStore((s) => s.canvasZoom)
  const showGrid = useEditorStore((s) => s.showPixelGrid)
  const texture = useTextureStore((s) => selectedPath ? s.textures[selectedPath] : undefined)
  const info = selectedPath ? getTextureByPath(selectedPath) : undefined

  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const texW = texture?.width ?? info?.defaultWidth ?? 16
  const texH = texture?.height ?? info?.defaultHeight ?? 16
  const stageW = texW * zoom
  const stageH = texH * zoom

  useEffect(() => {
    if (!texture) { setImage(null); return }
    const img = new Image()
    img.src = texture.dataURL
    img.onload = () => setImage(img)
  }, [texture])

  if (!selectedPath) {
    return (
      <div className="flex flex-col h-full">
        <CanvasToolbar />
        <div className="flex-1 flex items-center justify-center text-mc-text-muted text-sm">
          Select a texture from the sidebar to edit it
        </div>
      </div>
    )
  }

  // Build pixel grid lines
  const gridLines: JSX.Element[] = []
  if (showGrid && zoom >= 4) {
    for (let x = 0; x <= texW; x++) {
      gridLines.push(
        <Line key={`gv${x}`} points={[x * zoom, 0, x * zoom, stageH]} stroke="#ffffff22" strokeWidth={1} listening={false} />
      )
    }
    for (let y = 0; y <= texH; y++) {
      gridLines.push(
        <Line key={`gh${y}`} points={[0, y * zoom, stageW, y * zoom]} stroke="#ffffff22" strokeWidth={1} listening={false} />
      )
    }
  }

  return (
    <div className="flex flex-col h-full">
      <CanvasToolbar />
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center bg-[repeating-conic-gradient(#2a2a2a_0%_25%,#1a1a1a_0%_50%)] bg-[length:16px_16px]"
      >
        <div className="shadow-2xl">
          <Stage width={stageW} height={stageH}>
            <Layer>
              {image && (
                <KonvaImage
                  image={image}
                  width={stageW}
                  height={stageH}
                  imageSmoothingEnabled={false}
                />
              )}
              {!image && (
                /* Placeholder grid when no texture uploaded */
                Array.from({ length: texW * texH }).map((_, i) => {
                  const x = (i % texW) * zoom
                  const y = Math.floor(i / texW) * zoom
                  return (
                    <Line
                      key={i}
                      points={[x, y, x + zoom, y, x + zoom, y + zoom, x, y + zoom, x, y]}
                      stroke="#333"
                      strokeWidth={1}
                      closed
                      listening={false}
                    />
                  )
                })
              )}
            </Layer>
            <Layer>
              {gridLines}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Info bar */}
      <div className="border-t border-mc-border px-3 py-1.5 bg-mc-bg-panel flex items-center gap-4 text-xs text-mc-text-muted">
        <span className="font-medium text-mc-text-secondary">{info?.label ?? selectedPath.split('/').pop()}</span>
        <span className="font-mono">{texW}×{texH}px</span>
        {texture && <span className="text-mc-accent">● Modified</span>}
        <span className="ml-auto font-mono opacity-60 truncate max-w-xs">{selectedPath}</span>
      </div>
    </div>
  )
}
