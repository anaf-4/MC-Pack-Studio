import { useState, useRef } from 'react'
import { usePackStore } from '@/store/packStore'
import { VersionSelector } from './VersionSelector'
import { PACK_FORMAT_MAP } from '@/constants/packFormats'
import type { MCVersion } from '@/types/pack'
import { validateTextureFile, fileToDataURL } from '@/utils/imageUtils'

export function PackSetupModal() {
  const { setName, setDescription, setMCVersion, setPackIcon, completeSetup, mcVersion, packFormat } = usePackStore()
  const [localName, setLocalName] = useState('')
  const [localDesc, setLocalDesc] = useState('')
  const [localVersion, setLocalVersion] = useState<MCVersion>(mcVersion)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [iconError, setIconError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)

  async function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await validateTextureFile(file)
    if (!result.valid) {
      setIconError(result.error ?? 'Invalid image.')
      return
    }
    const dataURL = await fileToDataURL(file)
    setIconPreview(dataURL)
    setIconError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!localName.trim()) {
      setNameError('Pack name is required.')
      return
    }
    setName(localName.trim())
    setDescription(localDesc.trim())
    setMCVersion(localVersion)
    if (iconPreview) setPackIcon(iconPreview)
    completeSetup()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-mc-bg-panel border-2 border-mc-border rounded-lg w-full max-w-md p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-mc-grass rounded flex items-center justify-center text-2xl select-none">
            🎮
          </div>
          <div>
            <h1 className="text-mc-text-primary font-bold text-lg leading-tight">MC-Pack Studio</h1>
            <p className="text-mc-text-secondary text-xs">Create a new resource pack</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pack Name */}
          <div>
            <label className="block text-mc-text-secondary text-xs mb-1 uppercase tracking-wide">
              Pack Name <span className="text-mc-danger">*</span>
            </label>
            <input
              type="text"
              value={localName}
              onChange={(e) => { setLocalName(e.target.value); setNameError(null) }}
              placeholder="My Awesome Pack"
              className="w-full bg-mc-bg-dark border border-mc-border text-mc-text-primary rounded px-3 py-2 text-sm focus:outline-none focus:border-mc-accent placeholder:text-mc-text-muted"
            />
            {nameError && <p className="text-mc-danger text-xs mt-1">{nameError}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-mc-text-secondary text-xs mb-1 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={localDesc}
              onChange={(e) => setLocalDesc(e.target.value)}
              placeholder="A resource pack created with MC-Pack Studio"
              rows={2}
              className="w-full bg-mc-bg-dark border border-mc-border text-mc-text-primary rounded px-3 py-2 text-sm focus:outline-none focus:border-mc-accent placeholder:text-mc-text-muted resize-none"
            />
          </div>

          {/* MC Version */}
          <div>
            <label className="block text-mc-text-secondary text-xs mb-1 uppercase tracking-wide">
              Minecraft Version
            </label>
            <VersionSelector
              value={localVersion}
              onChange={(v) => setLocalVersion(v)}
              className="w-full"
            />
            <p className="text-mc-text-muted text-xs mt-1">
              pack_format: <span className="text-mc-accent font-mono">{PACK_FORMAT_MAP[localVersion]?.format ?? '?'}</span>
            </p>
          </div>

          {/* Pack Icon */}
          <div>
            <label className="block text-mc-text-secondary text-xs mb-1 uppercase tracking-wide">
              Pack Icon <span className="text-mc-text-muted">(optional, PNG, power-of-2)</span>
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 bg-mc-bg-dark border border-mc-border rounded flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={() => iconInputRef.current?.click()}
              >
                {iconPreview ? (
                  <img
                    src={iconPreview}
                    alt="Pack icon"
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <span className="text-mc-text-muted text-xs text-center leading-tight px-1">Click to upload</span>
                )}
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => iconInputRef.current?.click()}
                  className="text-mc-text-secondary text-xs border border-mc-border rounded px-3 py-1.5 hover:bg-mc-bg-hover hover:text-mc-text-primary transition-colors"
                >
                  Choose PNG...
                </button>
                {iconPreview && (
                  <button
                    type="button"
                    onClick={() => { setIconPreview(null); if (iconInputRef.current) iconInputRef.current.value = '' }}
                    className="ml-2 text-mc-danger text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            {iconError && <p className="text-mc-danger text-xs mt-1">{iconError}</p>}
            <input
              ref={iconInputRef}
              type="file"
              accept="image/png"
              onChange={handleIconChange}
              className="hidden"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-mc-accent hover:bg-mc-accent-hover text-black font-bold py-2.5 rounded text-sm transition-colors mt-2"
          >
            Create Pack →
          </button>
        </form>
      </div>
    </div>
  )
}

