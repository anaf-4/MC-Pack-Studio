export interface AnimationFrame {
  index: number
  time?: number
}

export interface AnimationDefinition {
  interpolate: boolean
  frametime: number
  frames: AnimationFrame[]
}

export interface AnimationMeta {
  animation: {
    interpolate?: boolean
    frametime?: number
    frames?: Array<number | { index: number; time: number }>
  }
}
