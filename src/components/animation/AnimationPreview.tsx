import { useEffect, useRef, useState } from 'react'
import type { AnimationDefinition } from '@/types/animation'

interface Props {
  dataURL: string
  frameWidth: number
  def: AnimationDefinition
}

export function AnimationPreview({ dataURL, frameWidth, def }: Props) {
  const [frameIdx, setFrameIdx] = useState(0)
  const [playing, setPlaying] = useState(true)
  const timerRef = useRef<number>()

  const frames = def.frames.length > 0
    ? def.frames
    : Array.from({ length: 8 }, (_, i) => ({ index: i }))

  useEffect(() => {
    if (!playing) return
    const currentFrame = frames[frameIdx % frames.length]
    const ticks = currentFrame.time ?? def.frametime
    const ms = ticks * 50 // 1 game tick ≈ 50ms

    timerRef.current = window.setTimeout(() => {
      setFrameIdx((n) => (n + 1) % frames.length)
    }, ms)

    return () => clearTimeout(timerRef.current)
  }, [frameIdx, playing, frames, def.frametime])

  const currentFrame = frames[frameIdx % frames.length]
  const yOffset = currentFrame.index * frameWidth

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="bg-[repeating-conic-gradient(#2a2a2a_0%_25%,#1a1a1a_0%_50%)] bg-[length:8px_8px] rounded overflow-hidden border border-mc-border"
        style={{ width: frameWidth * 4, height: frameWidth * 4 }}
      >
        <img
          src={dataURL}
          alt="animation preview"
          style={{
            imageRendering: 'pixelated',
            width: frameWidth * 4,
            height: 'auto',
            transform: `translateY(-${yOffset * 4}px)`,
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="text-xs border border-mc-border rounded px-2 py-1 text-mc-text-secondary hover:text-mc-text-primary hover:bg-mc-bg-hover transition-colors"
        >
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <span className="text-mc-text-muted text-xs">
          Frame {frameIdx + 1}/{frames.length}
        </span>
      </div>
    </div>
  )
}
