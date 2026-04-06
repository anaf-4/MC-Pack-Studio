import { useState, useEffect } from 'react'

const cache: Record<string, string | null> = {}

export function useVanillaTexture(path: string): string | null {
  const [dataURL, setDataURL] = useState<string | null>(cache[path] ?? null)

  useEffect(() => {
    if (path in cache) {
      setDataURL(cache[path])
      return
    }
    const url = `${import.meta.env.BASE_URL}vanilla/${path}`
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      const result = canvas.toDataURL('image/png')
      cache[path] = result
      setDataURL(result)
    }
    img.onerror = () => {
      cache[path] = null
      setDataURL(null)
    }
    img.src = url
  }, [path])

  return dataURL
}
