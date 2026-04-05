import { create } from 'zustand'
import type { TextureCategory } from '@/types/texture'

export type PreviewMode = 'game' | 'gui' | 'block' | 'item' | 'font'

interface EditorState {
  activeCategory: TextureCategory
  selectedTexturePath: string | null
  canvasZoom: number
  showPixelGrid: boolean
  previewMode: PreviewMode
  editingTexturePath: string | null

  setCategory: (cat: TextureCategory) => void
  selectTexture: (path: string | null) => void
  setZoom: (zoom: number) => void
  togglePixelGrid: () => void
  setPreviewMode: (mode: PreviewMode) => void
  setEditingTexture: (path: string | null) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  activeCategory: 'item',
  selectedTexturePath: null,
  canvasZoom: 8,
  showPixelGrid: true,
  previewMode: 'game',
  editingTexturePath: null,

  setCategory: (cat) => set({ activeCategory: cat, selectedTexturePath: null }),
  selectTexture: (path) => set({ selectedTexturePath: path }),
  setZoom: (zoom) => set({ canvasZoom: Math.min(16, Math.max(1, zoom)) }),
  togglePixelGrid: () => set((s) => ({ showPixelGrid: !s.showPixelGrid })),
  setPreviewMode: (mode) => set({ previewMode: mode }),
  setEditingTexture: (path) => set({ editingTexturePath: path }),
}))
