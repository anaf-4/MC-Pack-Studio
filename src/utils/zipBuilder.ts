import JSZip from 'jszip'
import { buildPackMeta, buildAnimationMeta } from './mcmetaBuilder'
import { dataURLtoArrayBuffer, sanitizeFilename } from './imageUtils'
import type { TextureEntry } from '@/types/texture'
import type { AnimationDefinition } from '@/types/animation'

// 항상 ZIP에 포함되는 기본 폴더 구조
const STANDARD_FOLDERS = [
  'assets/minecraft/textures/item',
  'assets/minecraft/textures/block',
  'assets/minecraft/textures/gui',
  'assets/minecraft/textures/gui/container',
  'assets/minecraft/textures/gui/hud',
  'assets/minecraft/textures/entity',
  'assets/minecraft/textures/environment',
  'assets/minecraft/textures/font',
  'assets/minecraft/sounds',
  'assets/minecraft/lang',
  'assets/minecraft/models/item',
  'assets/minecraft/models/block',
]

export type CompressionLevel = 'none' | 'fast' | 'best'
export type TextureFilter    = 'all' | 'modified'

interface ZipBuildOptions {
  name: string
  description: string
  packFormat: number
  supportedFormats?: [number, number]
  packIconDataURL: string | null
  textures: Record<string, TextureEntry>
  animations: Record<string, AnimationDefinition>
  // 내보내기 설정
  compression?: CompressionLevel
  includeEmptyFolders?: boolean
  textureFilter?: TextureFilter
  onProgress?: (percent: number) => void
}

export async function buildResourcePackZip(opts: ZipBuildOptions): Promise<Blob> {
  const zip = new JSZip()

  const compression    = opts.compression ?? 'fast'
  const includeEmpty   = opts.includeEmptyFolders ?? true
  const textureFilter  = opts.textureFilter ?? 'all'

  const zipCompression = compression === 'none' ? 'STORE' : 'DEFLATE'
  const compressionOptions = compression === 'best' ? { level: 9 }
    : compression === 'fast' ? { level: 1 }
    : undefined

  // pack.mcmeta
  const meta = buildPackMeta(opts.description, opts.packFormat, opts.supportedFormats)
  zip.file('pack.mcmeta', JSON.stringify(meta, null, 2))

  // pack.png (optional)
  if (opts.packIconDataURL) {
    const iconBuffer = await dataURLtoArrayBuffer(opts.packIconDataURL)
    zip.file('pack.png', iconBuffer)
  }

  // 기본 폴더 구조
  if (includeEmpty) {
    for (const folder of STANDARD_FOLDERS) {
      zip.folder(folder)
    }
  }

  // 텍스처 필터링
  const allPaths = Object.keys(opts.textures)
  const texturePaths = textureFilter === 'modified'
    ? allPaths.filter(p => !!opts.textures[p])
    : allPaths

  for (let i = 0; i < texturePaths.length; i++) {
    const path  = texturePaths[i]
    const entry = opts.textures[path]
    const buffer = await dataURLtoArrayBuffer(entry.dataURL)
    zip.file(path, buffer, { compression: zipCompression, compressionOptions })

    if (opts.animations[path]) {
      const animMeta = buildAnimationMeta(opts.animations[path])
      zip.file(`${path}.mcmeta`, JSON.stringify(animMeta, null, 2))
    }

    opts.onProgress?.(Math.round(((i + 1) / texturePaths.length) * 100))
  }

  return zip.generateAsync({ type: 'blob', compression: zipCompression, compressionOptions })
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
): { folders: string[]; files: string[] } {
  const files: string[] = ['pack.mcmeta']
  if (hasIcon) files.push('pack.png')
  for (const path of Object.keys(textures)) {
    files.push(path)
    if (animations[path]) files.push(`${path}.mcmeta`)
  }
  return {
    folders: STANDARD_FOLDERS,
    files: files.sort(),
  }
}
