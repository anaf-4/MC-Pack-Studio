import { useState } from 'react'
import { useTextureStore } from '@/store/textureStore'
import { useEditorStore } from '@/store/editorStore'
import { TextureDropZone } from './TextureDropZone'
import type { TexturePathInfo } from '@/types/texture'

interface Props {
  info: TexturePathInfo
}

export function TextureCard({ info }: Props) {
  const texture = useTextureStore((s) => s.textures[info.path])
  const removeTexture = useTextureStore((s) => s.removeTexture)
  const selectedPath = useEditorStore((s) => s.selectedTexturePath)
  const selectTexture = useEditorStore((s) => s.selectTexture)
  const [showDrop, setShowDrop] = useState(false)

  const isSelected = selectedPath === info.path
  const isModified = !!texture

  return (
    <div
      className={`bg-mc-bg-panel border rounded-lg p-3 flex flex-col gap-2 transition-colors cursor-pointer ${
        isSelected
          ? 'border-mc-accent ring-1 ring-mc-accent'
          : 'border-mc-border hover:border-mc-accent/50'
      }`}
      onClick={() => selectTexture(isSelected ? null : info.path)}
    >
      {/* Texture preview */}
      <div className="aspect-square bg-[#1a1a1a] bg-[repeating-conic-gradient(#2a2a2a_0%_25%,#1a1a1a_0%_50%)] bg-[length:16px_16px] rounded flex items-center justify-center overflow-hidden relative">
        {isModified ? (
          <img
            src={texture.dataURL}
            alt={info.label}
            className="w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-mc-text-muted">
            <span className="text-xl">📄</span>
            <span className="text-xs">Default</span>
          </div>
        )}
        {isModified && (
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-mc-accent" title="Modified" />
        )}
      </div>

      {/* Label */}
      <div>
        <p className="text-mc-text-primary text-xs font-medium truncate">{info.label}</p>
        <p className="text-mc-text-muted text-xs truncate">{info.defaultWidth}×{info.defaultHeight}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <TextureDropZone texturePath={info.path} compact onSuccess={() => setShowDrop(false)} />
        {isModified && (
          <button
            onClick={() => removeTexture(info.path)}
            className="text-xs text-mc-danger hover:text-red-400 border border-mc-border rounded px-1.5 py-1 transition-colors"
            title="Remove custom texture"
          >
            ✕
          </button>
        )}
      </div>

      {/* Full drop zone (shown when expanded) */}
      {showDrop && (
        <div onClick={(e) => e.stopPropagation()}>
          <TextureDropZone texturePath={info.path} onSuccess={() => setShowDrop(false)} />
        </div>
      )}
    </div>
  )
}
