import { useState, useRef } from 'react'
import JSZip from 'jszip'
import { useTextureStore } from '@/store/textureStore'
import { usePackStore } from '@/store/packStore'
import type { MCVersion } from '@/types/pack'
import { PACK_FORMAT_MAP } from '@/constants/packFormats'

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// pack_format integer → MCVersion string (pick highest matching version)
function formatToVersion(format: number): MCVersion | null {
  let best: MCVersion | null = null
  for (const [ver, entry] of Object.entries(PACK_FORMAT_MAP)) {
    if (entry.format === format) {
      best = ver as MCVersion
    }
  }
  return best
}

export function usePackImport() {
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ textureCount: number; packName: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const setTexture = useTextureStore((s) => s.setTexture)
  const clearAll   = useTextureStore((s) => s.clearAll)
  const setName    = usePackStore((s) => s.setName)
  const setDescription = usePackStore((s) => s.setDescription)
  const setMCVersion   = usePackStore((s) => s.setMCVersion)
  const setPackIcon    = usePackStore((s) => s.setPackIcon)
  const completeSetup  = usePackStore((s) => s.completeSetup)

  function openPicker() {
    setError(null)
    setResult(null)
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.click()
    }
  }

  async function importZip(file: File) {
    if (!file.name.endsWith('.zip')) {
      setError('ZIP 파일만 가져올 수 있습니다.')
      return
    }
    setImporting(true)
    setError(null)
    try {
      const zip = await JSZip.loadAsync(file)

      // ── pack.mcmeta 파싱 ──────────────────────────────────────────────
      let packName = file.name.replace(/\.zip$/i, '')
      let packDesc = ''

      const mcmetaFile = zip.file('pack.mcmeta')
      if (mcmetaFile) {
        const raw = await mcmetaFile.async('text')
        try {
          const meta = JSON.parse(raw)
          packDesc = meta?.pack?.description ?? ''
          const format: number = meta?.pack?.pack_format ?? 0
          const version = formatToVersion(format)
          if (version) setMCVersion(version)
        } catch { /* ignore malformed mcmeta */ }
      }

      // ── pack.png ─────────────────────────────────────────────────────
      const iconFile = zip.file('pack.png')
      if (iconFile) {
        const blob = await iconFile.async('blob')
        const dataURL = await blobToDataURL(blob)
        setPackIcon(dataURL)
      }

      // ── 텍스처 로드 ───────────────────────────────────────────────────
      clearAll()
      let count = 0

      const pngFiles = Object.keys(zip.files).filter(
        (name) => name.startsWith('assets/') && name.endsWith('.png') && !zip.files[name].dir
      )

      await Promise.all(
        pngFiles.map(async (path) => {
          const fileObj = zip.file(path)
          if (!fileObj) return
          try {
            const blob = await fileObj.async('blob')
            const dataURL = await blobToDataURL(blob)
            // measure dimensions
            const { width, height } = await new Promise<{ width: number; height: number }>((res) => {
              const img = new Image()
              img.onload = () => res({ width: img.naturalWidth, height: img.naturalHeight })
              img.onerror = () => res({ width: 16, height: 16 })
              img.src = dataURL
            })
            setTexture(path, {
              path,
              dataURL,
              width,
              height,
              fileName: path.split('/').pop() ?? path,
              uploadedAt: Date.now(),
            })
            count++
          } catch { /* skip broken files */ }
        })
      )

      setName(packName)
      setDescription(packDesc)
      completeSetup()
      setResult({ textureCount: count, packName })
    } catch (e) {
      setError('ZIP 파일을 읽을 수 없습니다.')
      console.error(e)
    } finally {
      setImporting(false)
    }
  }

  return { openPicker, importZip, importing, error, result, inputRef }
}
