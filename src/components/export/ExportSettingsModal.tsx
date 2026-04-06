import { useState } from 'react'
import { usePackStore } from '@/store/packStore'
import { useTextureStore } from '@/store/textureStore'
import { useAnimationStore } from '@/store/animationStore'
import { buildResourcePackZip, downloadBlob } from '@/utils/zipBuilder'
import { sanitizeFilename } from '@/utils/imageUtils'
import type { CompressionLevel, TextureFilter } from '@/utils/zipBuilder'

interface Props { onClose: () => void }

export function ExportSettingsModal({ onClose }: Props) {
  const pack       = usePackStore()
  const textures   = useTextureStore(s => s.textures)
  const animations = useAnimationStore(s => s.animations)

  const [filename,      setFilename]      = useState(sanitizeFilename(pack.name) || 'my_pack')
  const [compression,   setCompression]   = useState<CompressionLevel>('fast')
  const [includeEmpty,  setIncludeEmpty]  = useState(true)
  const [texFilter,     setTexFilter]     = useState<TextureFilter>('all')
  const [exporting,     setExporting]     = useState(false)
  const [progress,      setProgress]      = useState(0)
  const [error,         setError]         = useState<string | null>(null)

  const modifiedCount = Object.keys(textures).length
  const totalCount    = modifiedCount   // all in store are modified

  async function handleExport() {
    setExporting(true); setError(null); setProgress(0)
    try {
      const blob = await buildResourcePackZip({
        name: pack.name,
        description: pack.description,
        packFormat: pack.packFormat,
        supportedFormats: pack.supportedFormats,
        packIconDataURL: pack.packIconDataURL,
        textures,
        animations,
        compression,
        includeEmptyFolders: includeEmpty,
        textureFilter: texFilter,
        onProgress: setProgress,
      })
      downloadBlob(blob, `${filename || 'my_pack'}.zip`)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '내보내기 실패')
    } finally {
      setExporting(false)
    }
  }

  // 예상 파일 수
  const expectedTextures = texFilter === 'modified' ? modifiedCount : totalCount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-mc-bg-panel border border-mc-border rounded-xl shadow-2xl w-[420px] flex flex-col overflow-hidden">

        {/* 헤더 */}
        <div className="px-5 py-4 border-b border-mc-border flex items-center justify-between">
          <h2 className="text-mc-text-primary font-bold text-sm">⬇ 리소스팩 내보내기</h2>
          <button onClick={onClose} className="text-mc-text-muted hover:text-mc-text-secondary text-lg leading-none">✕</button>
        </div>

        <div className="p-5 flex flex-col gap-5">

          {/* 파일명 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-mc-text-secondary text-xs font-semibold">파일명</label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={filename}
                onChange={e => setFilename(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, '_'))}
                className="flex-1 bg-mc-bg-dark border border-mc-border rounded px-3 py-1.5 text-sm text-mc-text-primary focus:outline-none focus:border-mc-accent font-mono"
              />
              <span className="text-mc-text-muted text-xs">.zip</span>
            </div>
          </div>

          {/* 압축 수준 */}
          <div className="flex flex-col gap-2">
            <label className="text-mc-text-secondary text-xs font-semibold">압축 수준</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['none',  '없음',    '빠름, 용량 큼'],
                ['fast',  '보통',    '기본값'],
                ['best',  '최고',    '느림, 용량 최소'],
              ] as [CompressionLevel, string, string][]).map(([val, label, sub]) => (
                <button key={val} onClick={() => setCompression(val)}
                  className={`flex flex-col items-center py-2 px-1 rounded border text-xs transition-colors ${
                    compression === val
                      ? 'border-mc-accent bg-mc-accent/10 text-mc-accent'
                      : 'border-mc-border text-mc-text-muted hover:bg-mc-bg-hover'
                  }`}>
                  <span className="font-semibold">{label}</span>
                  <span className="opacity-60 text-xs mt-0.5">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 텍스처 필터 */}
          <div className="flex flex-col gap-2">
            <label className="text-mc-text-secondary text-xs font-semibold">포함할 텍스처</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['all',      '전체',       `스토어 내 모든 텍스처 (${totalCount}개)`],
                ['modified', '수정된 것만', `커스텀 적용된 것만 (${modifiedCount}개)`],
              ] as [TextureFilter, string, string][]).map(([val, label, sub]) => (
                <button key={val} onClick={() => setTexFilter(val)}
                  className={`flex flex-col items-start p-2.5 rounded border text-xs transition-colors ${
                    texFilter === val
                      ? 'border-mc-accent bg-mc-accent/10 text-mc-accent'
                      : 'border-mc-border text-mc-text-muted hover:bg-mc-bg-hover'
                  }`}>
                  <span className="font-semibold">{label}</span>
                  <span className="opacity-60 mt-0.5">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 빈 폴더 */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setIncludeEmpty(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${includeEmpty ? 'bg-mc-accent' : 'bg-mc-border'}`}
              style={{ position: 'relative' }}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${includeEmpty ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <div>
              <p className="text-mc-text-secondary text-xs font-semibold">빈 폴더 포함</p>
              <p className="text-mc-text-muted text-xs opacity-60">item, block, gui 등 표준 폴더 구조를 항상 포함</p>
            </div>
          </label>

          {/* 요약 */}
          <div className="rounded-lg bg-mc-bg-dark border border-mc-border px-4 py-3 flex items-center justify-between">
            <div className="text-xs text-mc-text-muted">
              <span>텍스처 </span>
              <span className="text-mc-accent font-semibold">{expectedTextures}개</span>
              <span> · 압축 </span>
              <span className="text-mc-accent font-semibold">
                {compression === 'none' ? '없음' : compression === 'fast' ? '보통' : '최고'}
              </span>
              {includeEmpty && <span className="opacity-60"> · 표준 폴더 포함</span>}
            </div>
            <span className="text-mc-text-muted text-xs font-mono">{filename}.zip</span>
          </div>

          {/* 에러 */}
          {error && <p className="text-mc-danger text-xs">⚠ {error}</p>}

          {/* 진행 바 */}
          {exporting && (
            <div className="w-full bg-mc-border rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-mc-accent transition-all duration-200 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || !filename.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-mc-accent hover:bg-mc-accent-hover disabled:opacity-50 text-black font-bold py-2.5 rounded text-sm transition-colors"
          >
            {exporting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>{progress}%</span>
              </>
            ) : (
              <span>⬇ 다운로드</span>
            )}
          </button>
          <button onClick={onClose}
            className="px-5 border border-mc-border rounded text-mc-text-secondary hover:bg-mc-bg-hover text-sm transition-colors">
            취소
          </button>
        </div>

      </div>
    </div>
  )
}
