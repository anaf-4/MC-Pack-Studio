import type { PackMeta } from '@/types/pack'
import type { AnimationDefinition, AnimationMeta } from '@/types/animation'

export type { AnimationMeta }

export function buildPackMeta(
  description: string,
  packFormat: number,
  supportedFormats?: [number, number],
): PackMeta {
  const meta: PackMeta = {
    pack: {
      pack_format: packFormat,
      description,
    },
  }
  if (supportedFormats) {
    meta.pack.supported_formats = supportedFormats
  }
  return meta
}

export function buildAnimationMeta(def: AnimationDefinition): AnimationMeta {
  const frames = def.frames.map((f) =>
    f.time !== undefined
      ? { index: f.index, time: f.time }
      : f.index,
  )

  return {
    animation: {
      ...(def.interpolate ? { interpolate: true } : {}),
      ...(def.frametime !== 1 ? { frametime: def.frametime } : {}),
      frames,
    },
  }
}
