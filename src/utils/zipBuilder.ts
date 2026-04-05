import JSZip from 'jszip'
import { buildPackMeta, buildAnimationMeta } from './mcmetaBuilder'
import { dataURLtoArrayBuffer, sanitizeFilename } from './imageUtils'
import type { TextureEntry } from '@/types/texture'
import type { AnimationDefinition } from '@/types/animation'

interface ZipBuildOptions {
  name: string
  description: string
  packFormat: number
  supportedFormats?: [number, number]
  packIconDataURL: string | null
  textures: Record<string, TextureEntry>
  animations: Record<string, AnimationDefinition>
  onProgress?: (percent: number) => void
}

export async function buildResourcePackZip(opts: ZipBuildOptions): Promise<Blob> {
  const zip = new JSZip()

  // pack.mcmeta
  const meta = buildPackMeta(opts.description, opts.packFormat, opts.supportedFormats)
  zip.file('pack.mcmeta', JSON.stringify(meta, null, 2))

  // pack.png (optional)
  if (opts.packIconDataURL) {
    const iconBuffer = await dataURLtoArrayBuffer(opts.packIconDataURL)
    zip.file('pack.png', iconBuffer)
  }

  // textures
  const texturePaths = Object.keys(opts.textures)
  for (let i = 0; i < texturePaths.length; i++) {
    const path = texturePaths[i]
    const entry = opts.textures[path]
    const buffer = await dataURLtoArrayBuffer(entry.dataURL)
    zip.file(path, buffer)

    // animation .mcmeta
    if (opts.animations[path]) {
      const animMeta = buildAnimationMeta(opts.animations[path])
      zip.file(`${path}.mcmeta`, JSON.stringify(animMeta, null, 2))
    }

    if (opts.onProgress) {
      opts.onProgress(Math.round(((i + 1) / texturePaths.length) * 100))
    }
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getZipFilename(packName: string): string {
  return `${sanitizeFilename(packName)}.zip`
}

/** Returns the file tree that will be in the ZIP (for preview) */
export function getZipFileList(
  textures: Record<string, TextureEntry>,
  animations: Record<string, AnimationDefinition>,
  hasIcon: boolean,
): string[] {
  const files: string[] = ['pack.mcmeta']
  if (hasIcon) files.push('pack.png')
  for (const path of Object.keys(textures)) {
    files.push(path)
    if (animations[path]) files.push(`${path}.mcmeta`)
  }
  return files.sort()
}
