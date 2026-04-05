import { useState } from 'react'
import { useTextureStore } from '@/store/textureStore'
import { validateTextureFile, fileToDataURL } from '@/utils/imageUtils'

interface UploadState {
  uploading: boolean
  error: string | null
}

export function useTextureUpload() {
  const setTexture = useTextureStore((s) => s.setTexture)
  const [state, setState] = useState<UploadState>({ uploading: false, error: null })

  async function upload(file: File, texturePath: string): Promise<boolean> {
    setState({ uploading: true, error: null })
    const result = await validateTextureFile(file)
    if (!result.valid || !result.dimensions) {
      setState({ uploading: false, error: result.error ?? 'Invalid file.' })
      return false
    }

    const dataURL = await fileToDataURL(file)
    setTexture(texturePath, {
      path: texturePath,
      dataURL,
      width: result.dimensions.width,
      height: result.dimensions.height,
      fileName: file.name,
      uploadedAt: Date.now(),
    })
    setState({ uploading: false, error: null })
    return true
  }

  function clearError() {
    setState((s) => ({ ...s, error: null }))
  }

  return { upload, clearError, ...state }
}
