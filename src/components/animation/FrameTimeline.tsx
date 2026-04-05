import type { AnimationFrame } from '@/types/animation'

interface Props {
  frames: AnimationFrame[]
  defaultFrametime: number
  dataURL: string
  frameWidth: number
  onChange: (frames: AnimationFrame[]) => void
}

export function FrameTimeline({ frames, defaultFrametime, dataURL, frameWidth, onChange }: Props) {
  function updateDuration(idx: number, time: number) {
    const next = frames.map((f, i) =>
      i === idx ? { ...f, time: time <= 0 ? undefined : time } : f
    )
    onChange(next)
  }

  function addFrame() {
    const nextIndex = frames.length > 0 ? (frames[frames.length - 1].index + 1) : 0
    onChange([...frames, { index: nextIndex }])
  }

  function removeFrame(idx: number) {
    onChange(frames.filter((_, i) => i !== idx))
  }

  function moveFrame(from: number, to: number) {
    const next = [...frames]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {frames.map((frame, i) => {
          const yOffset = frame.index * frameWidth
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-1 bg-mc-bg-dark border border-mc-border rounded p-1.5 group"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const from = parseInt(e.dataTransfer.getData('text/plain'))
                if (!isNaN(from) && from !== i) moveFrame(from, i)
              }}
            >
              {/* Frame thumbnail */}
              <div
                className="overflow-hidden border border-mc-border rounded"
                style={{ width: frameWidth * 2, height: frameWidth * 2 }}
              >
                <img
                  src={dataURL}
                  alt={`Frame ${frame.index}`}
                  style={{
                    imageRendering: 'pixelated',
                    width: frameWidth * 2,
                    height: 'auto',
                    transform: `translateY(-${yOffset * 2}px)`,
                  }}
                />
              </div>

              {/* Frame index */}
              <span className="text-mc-text-muted text-xs">#{frame.index}</span>

              {/* Duration */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={frame.time ?? defaultFrametime}
                  onChange={(e) => updateDuration(i, parseInt(e.target.value) || 1)}
                  className="w-10 bg-mc-bg-panel border border-mc-border rounded text-center text-xs text-mc-text-primary focus:outline-none focus:border-mc-accent"
                  title="Duration in ticks (1 tick = 50ms)"
                />
                <span className="text-mc-text-muted text-xs">t</span>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFrame(i)}
                className="opacity-0 group-hover:opacity-100 text-mc-danger text-xs transition-opacity"
              >
                ✕
              </button>
            </div>
          )
        })}

        {/* Add frame button */}
        <button
          onClick={addFrame}
          className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-mc-border rounded p-1.5 text-mc-text-muted hover:border-mc-accent hover:text-mc-accent transition-colors"
          style={{ minWidth: frameWidth * 2 + 12, minHeight: frameWidth * 2 + 50 }}
        >
          <span className="text-lg">+</span>
          <span className="text-xs">Add</span>
        </button>
      </div>

      <p className="text-mc-text-muted text-xs">Drag frames to reorder · Duration in game ticks (20 ticks = 1 second)</p>
    </div>
  )
}
