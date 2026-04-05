export interface TextureDimensions {
  width: number
  height: number
}

export interface ValidationResult {
  valid: boolean
  error?: string
  dimensions?: TextureDimensions
}

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0
}

export async function getImageDimensions(dataURL: string): Promise<TextureDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataURL
  })
}

export async function validateTextureFile(file: File): Promise<ValidationResult> {
  if (file.type !== 'image/png') {
    return { valid: false, error: 'Only PNG files are supported.' }
  }

  if (file.size > 4 * 1024 * 1024) {
    return { valid: false, error: 'File size must be under 4 MB.' }
  }

  const dataURL = await fileToDataURL(file)
  let dimensions: TextureDimensions
  try {
    dimensions = await getImageDimensions(dataURL)
  } catch {
    return { valid: false, error: 'Could not read image dimensions.' }
  }

  const { width, height } = dimensions
  if (!isPowerOfTwo(width) || !isPowerOfTwo(height)) {
    return {
      valid: false,
      error: `Texture dimensions must be powers of 2 (e.g. 16×16, 32×32). Got ${width}×${height}.`,
    }
  }

  if (width !== height) {
    // Animated textures are allowed to be taller (height = width * frames)
    // so we only warn but still accept
  }

  return { valid: true, dimensions }
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function dataURLtoBlob(dataURL: string): Blob {
  const [header, base64] = dataURL.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

export async function dataURLtoArrayBuffer(dataURL: string): Promise<ArrayBuffer> {
  const blob = dataURLtoBlob(dataURL)
  return blob.arrayBuffer()
}

/** Sanitize a string for use as a filename */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'my_pack'
}
