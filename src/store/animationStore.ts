import { create } from 'zustand'
import type { AnimationDefinition } from '@/types/animation'

interface AnimationState {
  animations: Record<string, AnimationDefinition>

  setAnimation: (path: string, def: AnimationDefinition) => void
  removeAnimation: (path: string) => void
  clearAll: () => void
}

export const useAnimationStore = create<AnimationState>((set) => ({
  animations: {},

  setAnimation: (path, def) =>
    set((state) => ({
      animations: { ...state.animations, [path]: def },
    })),

  removeAnimation: (path) =>
    set((state) => {
      const next = { ...state.animations }
      delete next[path]
      return { animations: next }
    }),

  clearAll: () => set({ animations: {} }),
}))
