import { create } from 'zustand'
import type { TextureEntry } from '@/types/texture'

interface TextureState {
  textures: Record<string, TextureEntry>

  setTexture: (path: string, entry: TextureEntry) => void
  removeTexture: (path: string) => void
  clearAll: () => void
  getModifiedPaths: () => string[]
}

export const useTextureStore = create<TextureState>((set, get) => ({
  textures: {},

  setTexture: (path, entry) =>
    set((state) => ({
      textures: { ...state.textures, [path]: entry },
    })),

  removeTexture: (path) =>
    set((state) => {
      const next = { ...state.textures }
      delete next[path]
      return { textures: next }
    }),

  clearAll: () => set({ textures: {} }),

  getModifiedPaths: () => Object.keys(get().textures),
}))
