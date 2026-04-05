import { useState } from 'react'
import { usePackStore } from '@/store/packStore'
import { VersionSelector } from '@/components/setup/VersionSelector'
import { ExportButton } from '@/components/export/ExportButton'
import { ExportPreview } from '@/components/export/ExportPreview'
import { usePackImport } from '@/hooks/usePackImport'
import type { MCVersion } from '@/types/pack'

function ImportButton() {
  const { openPicker, importZip, importing, error, result, inputRef } = usePackImport()
  const [showResult, setShowResult] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await importZip(file)
    setShowResult(true)
    setTimeout(() => setShowResult(false), 3000)
  }

  return (
    <div className="relative">
      <button
        onClick={openPicker}
        disabled={importing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border border-mc-border text-mc-text-secondary hover:text-mc-text-primary hover:bg-mc-bg-hover disabled:opacity-50 transition-colors"
      >
        {importing ? (
          <>
            <span className="animate-spin">↻</span>
            <span>가져오는 중…</span>
          </>
        ) : (
          <>
            <span>📂</span>
            <span>팩 불러오기</span>
          </>
        )}
      </button>

      {/* 결과 토스트 */}
      {showResult && !error && result && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-mc-bg-panel border border-mc-accent rounded px-3 py-2 text-xs text-mc-text-primary shadow-xl whitespace-nowrap">
          ✅ <span className="text-mc-accent font-medium">{result.packName}</span> 불러오기 완료 — 텍스처 {result.textureCount}개
        </div>
      )}
      {showResult && error && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-mc-bg-panel border border-mc-danger rounded px-3 py-2 text-xs text-mc-danger shadow-xl whitespace-nowrap">
          ❌ {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}

export function TopBar() {
  const { name, setName, mcVersion, setMCVersion, packFormat, description } = usePackStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  function commitName() {
    if (draft.trim()) setName(draft.trim())
    else setDraft(name)
    setEditing(false)
  }

  return (
    <header className="h-14 bg-mc-bg-panel border-b border-mc-border flex items-center px-4 gap-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-2xl select-none">🎮</span>
        <span className="text-mc-accent font-bold text-sm hidden sm:block">MC-Pack Studio</span>
      </div>

      <div className="w-px h-6 bg-mc-border shrink-0" />

      {/* Pack name (inline edit) */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setDraft(name); setEditing(false) } }}
            className="bg-mc-bg-dark border border-mc-accent rounded px-2 py-1 text-sm text-mc-text-primary focus:outline-none w-48"
          />
        ) : (
          <button
            onClick={() => { setDraft(name); setEditing(true) }}
            className="text-mc-text-primary text-sm font-semibold truncate max-w-xs hover:text-mc-accent transition-colors"
            title="Click to rename"
          >
            {name || 'Untitled Pack'}
          </button>
        )}
        <span className="text-mc-text-muted text-xs shrink-0 hidden md:block">
          {description && `· ${description.slice(0, 40)}${description.length > 40 ? '…' : ''}`}
        </span>
      </div>

      {/* Version selector */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-mc-text-muted text-xs hidden lg:block">Version:</span>
        <VersionSelector value={mcVersion} onChange={(v: MCVersion) => setMCVersion(v)} className="text-xs py-1" />
        <span className="text-mc-text-muted text-xs hidden lg:block">
          format <span className="text-mc-accent font-mono">{packFormat}</span>
        </span>
      </div>

      <div className="w-px h-6 bg-mc-border shrink-0" />

      {/* Import */}
      <ImportButton />

      <div className="w-px h-6 bg-mc-border shrink-0" />

      {/* ZIP 구조 미리보기 */}
      <div className="shrink-0">
        <ExportPreview />
      </div>

      {/* Export */}
      <div className="shrink-0">
        <ExportButton />
      </div>
    </header>
  )
}
