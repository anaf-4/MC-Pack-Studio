import { useState } from 'react'
import { usePackStore } from '@/store/packStore'
import { useTextureStore } from '@/store/textureStore'
import { useAnimationStore } from '@/store/animationStore'
import { buildResourcePackZip, downloadBlob, getZipFilename } from '@/utils/zipBuilder'

interface ExportState {
  exporting: boolean
  progress: number
  error: string | null
}

export function usePackExport() {
  const pack = usePackStore()
  const textures = useTextureStore((s) => s.textures)
  const animations = useAnimationStore((s) => s.animations)
  const [state, setState] = useState<ExportState>({ exporting: false, progress: 0, error: null })

  async function exportPack() {
    if (!pack.name.trim()) {
      setState({ exporting: false, progress: 0, error: 'Pack name is required before exporting.' })
      return
    }

    setState({ exporting: true, progress: 0, error: null })

    try {
      const blob = await buildResourcePackZip({
        name: pack.name,
        description: pack.description,
        packFormat: pack.packFormat,
        supportedFormats: pack.supportedFormats,
        packIconDataURL: pack.packIconDataURL,
        textures,
        animations,
        onProgress: (p) => setState((s) => ({ ...s, progress: p })),
      })

      downloadBlob(blob, getZipFilename(pack.name))
      setState({ exporting: false, progress: 100, error: null })
    } catch (err) {
      setState({
        exporting: false,
        progress: 0,
        error: err instanceof Error ? err.message : 'Export failed.',
      })
    }
  }

  function clearError() {
    setState((s) => ({ ...s, error: null }))
  }

  return { exportPack, clearError, ...state }
}
