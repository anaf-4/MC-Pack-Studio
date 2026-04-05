import { useState, useRef, useEffect } from 'react'
import { useTextureStore } from '@/store/textureStore'
import { useAnimationStore } from '@/store/animationStore'
import { usePackStore } from '@/store/packStore'
import { getZipFileList } from '@/utils/zipBuilder'

export function ExportPreview() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const textures = useTextureStore((s) => s.textures)
  const animations = useAnimationStore((s) => s.animations)
  const packIconDataURL = usePackStore((s) => s.packIconDataURL)
  const { folders, files } = getZipFileList(textures, animations, !!packIconDataURL)
  const modifiedCount = Object.keys(textures).length

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="ZIP 구조 미리보기"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs border transition-colors ${
          open
            ? 'border-mc-accent text-mc-accent bg-mc-accent/10'
            : 'border-mc-border text-mc-text-muted hover:text-mc-text-secondary hover:bg-mc-bg-hover'
        }`}
      >
        <span>📋</span>
        <span className="hidden sm:inline">ZIP 구조</span>
        {modifiedCount > 0 && (
          <span className="bg-mc-accent text-black text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {modifiedCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 w-80 bg-mc-bg-panel border border-mc-border rounded-lg shadow-2xl overflow-hidden">
          <div className="px-3 py-2 border-b border-mc-border flex items-center justify-between">
            <span className="text-mc-text-primary text-xs font-semibold">ZIP 파일 구조</span>
            <span className="text-mc-text-muted text-xs">{files.length + folders.length}개 항목</span>
          </div>

          <div className="max-h-72 overflow-y-auto p-2 font-mono text-xs">
            {/* pack.mcmeta, pack.png */}
            {files.filter(f => !f.startsWith('assets/')).map(f => (
              <div key={f} className="flex items-center gap-1.5 py-0.5 px-1 rounded hover:bg-mc-bg-hover">
                <span className="text-mc-warning">📄</span>
                <span className="text-mc-text-primary">{f}</span>
              </div>
            ))}

            {/* assets/ 트리 */}
            <div className="mt-1">
              <div className="flex items-center gap-1.5 py-0.5 px-1 text-mc-text-muted">
                <span>📁</span>
                <span>assets/minecraft/textures/</span>
              </div>

              {/* 폴더 구조 */}
              {(() => {
                // 하위 폴더만 추출 (assets/minecraft/textures/ 하위)
                const subFolders = folders
                  .filter(f => f.startsWith('assets/minecraft/textures/'))
                  .map(f => f.replace('assets/minecraft/textures/', ''))

                // 텍스처 파일을 폴더별로 그룹
                const textureFiles = files.filter(f => f.startsWith('assets/minecraft/textures/'))
                const byFolder: Record<string, string[]> = {}
                for (const f of textureFiles) {
                  const rel = f.replace('assets/minecraft/textures/', '')
                  const parts = rel.split('/')
                  const dir = parts.length > 1 ? parts[0] : ''
                  if (!byFolder[dir]) byFolder[dir] = []
                  byFolder[dir].push(parts[parts.length - 1])
                }

                const allDirs = [...new Set([...subFolders.map(f => f.split('/')[0]), ...Object.keys(byFolder).filter(Boolean)])]

                return allDirs.map(dir => {
                  const filesInDir = byFolder[dir] ?? []
                  return (
                    <div key={dir} className="ml-4">
                      <div className="flex items-center gap-1.5 py-0.5 px-1 text-mc-text-muted">
                        <span>📁</span>
                        <span>{dir}/</span>
                        {filesInDir.length === 0 && (
                          <span className="text-mc-text-muted opacity-50 italic">(비어 있음)</span>
                        )}
                      </div>
                      {filesInDir.map(fname => (
                        <div key={fname} className="ml-4 flex items-center gap-1.5 py-0.5 px-1 rounded hover:bg-mc-bg-hover">
                          <span className="text-mc-accent">🖼</span>
                          <span className="text-mc-text-primary truncate">{fname}</span>
                        </div>
                      ))}
                    </div>
                  )
                })
              })()}

              {/* 기타 assets 폴더 (textures 외) */}
              {folders.filter(f => !f.startsWith('assets/minecraft/textures')).map(f => (
                <div key={f} className="flex items-center gap-1.5 py-0.5 px-1 rounded hover:bg-mc-bg-hover">
                  <span className="text-mc-text-muted">📁</span>
                  <span className="text-mc-text-muted">{f.replace('assets/minecraft/', '')}/</span>
                  <span className="text-mc-text-muted opacity-50 italic text-xs">(비어 있음)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-3 py-2 border-t border-mc-border bg-mc-bg-dark">
            <p className="text-mc-text-muted text-xs">
              수정된 텍스처 <span className="text-mc-accent font-medium">{modifiedCount}개</span>
              {modifiedCount === 0 && ' — 텍스처를 추가하면 여기에 표시됩니다'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
