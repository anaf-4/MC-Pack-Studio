export type TextureCategory = 'item' | 'block' | 'gui' | 'hud' | 'font'

export interface TextureEntry {
  path: string
  dataURL: string
  width: number
  height: number
  fileName: string
  uploadedAt: number
}

export interface TexturePathInfo {
  path: string
  label: string
  category: TextureCategory
  defaultWidth: number
  defaultHeight: number
  animatable?: boolean
}
