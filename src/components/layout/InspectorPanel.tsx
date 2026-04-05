import { useEditorStore } from '@/store/editorStore'
import { useTextureStore } from '@/store/textureStore'
import { getTextureByPath } from '@/constants/texturePaths'
import { AnimationEditor } from '@/components/animation/AnimationEditor'
import { TextureDropZone } from '@/components/texture/TextureDropZone'

export function InspectorPanel() {
  const selectedPath = useEditorStore((s) => s.selectedTexturePath)
  const texture = useTextureStore((s) => selectedPath ? s.textures[selectedPath] : undefined)
  const removeTexture = useTextureStore((s) => s.removeTexture)
  const info = selectedPath ? getTextureByPath(selectedPath) : undefined

  if (!selectedPath) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full text-center gap-2">
        <span className="text-3xl opacity-30">🖱️</span>
        <p className="text-mc-text-muted text-xs">Select a texture to inspect and edit it</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-3 border-b border-mc-border">
        <p className="text-mc-text-primary text-sm font-semibold truncate">{info?.label ?? selectedPath.split('/').pop()}</p>
        <p className="text-mc-text-muted text-xs font-mono truncate mt-0.5">{selectedPath}</p>
      </div>

      {/* Texture preview */}
      <div className="p-3 border-b border-mc-border">
        <div
          className="mx-auto bg-[repeating-conic-gradient(#2a2a2a_0%_25%,#1a1a1a_0%_50%)] bg-[length:8px_8px] rounded border border-mc-border flex items-center justify-center overflow-hidden"
          style={{ width: 96, height: 96 }}
        >
          {texture ? (
            <img
              src={texture.dataURL}
              alt={info?.label}
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <span className="text-mc-text-muted text-xs">No texture</span>
          )}
        </div>

        {/* Meta */}
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-mc-text-muted">Default size</span>
            <span className="text-mc-text-secondary font-mono">{info?.defaultWidth ?? '?'}×{info?.defaultHeight ?? '?'}</span>
          </div>
          {texture && (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-mc-text-muted">Uploaded size</span>
                <span className="text-mc-text-secondary font-mono">{texture.width}×{texture.height}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-mc-text-muted">File</span>
                <span className="text-mc-text-secondary truncate max-w-[120px]">{texture.fileName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-mc-text-muted">Status</span>
                <span className="text-mc-accent">● Modified</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Replace / Remove */}
      <div className="p-3 border-b border-mc-border space-y-2">
        <p className="text-mc-text-muted text-xs uppercase tracking-wide mb-2">Texture</p>
        <TextureDropZone texturePath={selectedPath} />
        {texture && (
          <button
            onClick={() => removeTexture(selectedPath)}
            className="w-full text-mc-danger text-xs border border-mc-border rounded py-1.5 hover:bg-mc-danger/10 transition-colors"
          >
            Remove custom texture
          </button>
        )}
      </div>

      {/* Animation editor (only for animatable textures) */}
      {info?.animatable && (
        <div className="border-b border-mc-border">
          <AnimationEditor texturePath={selectedPath} />
        </div>
      )}
    </div>
  )
}
