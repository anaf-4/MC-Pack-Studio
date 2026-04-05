import { useAnimationStore } from '@/store/animationStore'
import { useTextureStore } from '@/store/textureStore'
import { buildAnimationMeta } from '@/utils/mcmetaBuilder'
import { AnimationPreview } from './AnimationPreview'
import { FrameTimeline } from './FrameTimeline'
import type { AnimationDefinition } from '@/types/animation'

interface Props {
  texturePath: string
}

const DEFAULT_DEF: AnimationDefinition = {
  interpolate: false,
  frametime: 2,
  frames: [],
}

export function AnimationEditor({ texturePath }: Props) {
  const texture = useTextureStore((s) => s.textures[texturePath])
  const { animations, setAnimation, removeAnimation } = useAnimationStore()
  const def = animations[texturePath] ?? DEFAULT_DEF

  if (!texture) {
    return (
      <p className="text-mc-text-muted text-xs p-3 italic">
        Upload a texture first to configure animation.
      </p>
    )
  }

  const frameWidth = texture.width

  function update(patch: Partial<AnimationDefinition>) {
    setAnimation(texturePath, { ...def, ...patch })
  }

  function toggleEnabled() {
    if (animations[texturePath]) {
      removeAnimation(texturePath)
    } else {
      setAnimation(texturePath, { ...DEFAULT_DEF })
    }
  }

  const isEnabled = !!animations[texturePath]
  const mcmeta = isEnabled ? JSON.stringify(buildAnimationMeta(def), null, 2) : null

  return (
    <div className="p-3 space-y-4">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <span className="text-mc-text-secondary text-sm font-medium">Animation</span>
        <button
          onClick={toggleEnabled}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isEnabled ? 'bg-mc-accent' : 'bg-mc-border'}`}
        >
          <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      {!isEnabled && (
        <p className="text-mc-text-muted text-xs">Enable to configure animation frames for this texture.</p>
      )}

      {isEnabled && (
        <>
          {/* Settings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-mc-text-muted text-xs mb-1">Default frametime (ticks)</label>
              <input
                type="number"
                min={1}
                max={999}
                value={def.frametime}
                onChange={(e) => update({ frametime: parseInt(e.target.value) || 1 })}
                className="w-full bg-mc-bg-dark border border-mc-border rounded px-2 py-1 text-xs text-mc-text-primary focus:outline-none focus:border-mc-accent"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={def.interpolate}
                  onChange={(e) => update({ interpolate: e.target.checked })}
                  className="accent-mc-accent"
                />
                <span className="text-xs text-mc-text-secondary">Interpolate</span>
              </label>
            </div>
          </div>

          {/* Frame timeline */}
          <div>
            <p className="text-mc-text-muted text-xs uppercase tracking-wide mb-2">Frames</p>
            <FrameTimeline
              frames={def.frames}
              defaultFrametime={def.frametime}
              dataURL={texture.dataURL}
              frameWidth={frameWidth}
              onChange={(frames) => update({ frames })}
            />
          </div>

          {/* Preview */}
          {def.frames.length > 0 && (
            <div>
              <p className="text-mc-text-muted text-xs uppercase tracking-wide mb-2">Preview</p>
              <AnimationPreview
                dataURL={texture.dataURL}
                frameWidth={frameWidth}
                def={def}
              />
            </div>
          )}

          {/* Generated .mcmeta preview */}
          <div>
            <p className="text-mc-text-muted text-xs uppercase tracking-wide mb-1">
              Generated .mcmeta
            </p>
            <pre className="bg-mc-bg-dark border border-mc-border rounded p-2 text-xs text-mc-text-secondary font-mono overflow-x-auto whitespace-pre-wrap">
              {mcmeta}
            </pre>
          </div>
        </>
      )}
    </div>
  )
}
