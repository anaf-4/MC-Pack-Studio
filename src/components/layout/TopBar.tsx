import { useState } from 'react'
import { usePackStore } from '@/store/packStore'
import { VersionSelector } from '@/components/setup/VersionSelector'
import { ExportButton } from '@/components/export/ExportButton'
import type { MCVersion } from '@/types/pack'

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

      {/* Export */}
      <div className="shrink-0">
        <ExportButton />
      </div>
    </header>
  )
}
