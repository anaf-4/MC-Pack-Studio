import { useState } from 'react'
import { useTextureStore } from '@/store/textureStore'
import { useAnimationStore } from '@/store/animationStore'
import { usePackStore } from '@/store/packStore'
import { getZipFileList } from '@/utils/zipBuilder'

export function ExportPreview() {
  const [open, setOpen] = useState(false)
  const textures = useTextureStore((s) => s.textures)
  const animations = useAnimationStore((s) => s.animations)
  const packIconDataURL = usePackStore((s) => s.packIconDataURL)
  const files = getZipFileList(textures, animations, !!packIconDataURL)

  // Build a tree for display
  const tree: Record<string, string[]> = {}
  for (const f of files) {
    const parts = f.split('/')
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : ''
    if (!tree[dir]) tree[dir] = []
    tree[dir].push(parts[parts.length - 1])
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-mc-text-muted text-xs hover:text-mc-text-secondary flex items-center gap-1"
      >
        <span>{open ? '▼' : '▶'}</span>
        <span>Preview ZIP contents ({files.length} files)</span>
      </button>
      {open && (
        <div className="mt-2 bg-mc-bg-dark border border-mc-border rounded p-3 max-h-48 overflow-y-auto">
          {files.length === 0 ? (
            <p className="text-mc-text-muted text-xs italic">Only pack.mcmeta will be included (no textures modified yet).</p>
          ) : (
            <ul className="text-xs font-mono text-mc-text-secondary space-y-0.5">
              {files.map((f) => (
                <li key={f} className="truncate">
                  <span className="text-mc-text-muted">{'  '.repeat(f.split('/').length - 1)}</span>
                  <span className={f.endsWith('.mcmeta') ? 'text-mc-warning' : 'text-mc-accent'}>
                    {f.split('/').pop()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
