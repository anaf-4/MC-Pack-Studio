import { useState, useCallback, DragEvent } from 'react'

interface DragDropOptions {
  onDrop: (files: File[]) => void
  accept?: string[]
}

export function useDragDrop({ onDrop, accept }: DragDropOptions) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const filtered = accept
      ? files.filter((f) => accept.includes(f.type))
      : files

    if (filtered.length > 0) {
      onDrop(filtered)
    }
  }, [onDrop, accept])

  return { isDragging, handleDragOver, handleDragLeave, handleDrop }
}
