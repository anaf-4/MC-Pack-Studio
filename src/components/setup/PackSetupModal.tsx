import { useState, useRef } from 'react'
import { usePackStore } from '@/store/packStore'
import { VersionSelector } from './VersionSelector'
import { PACK_FORMAT_MAP } from '@/constants/packFormats'
import type { MCVersion } from '@/types/pack'
import { validateTextureFile, fileToDataURL } from '@/utils/imageUtils'

export function PackSetupModal() {
  const { setName, setDescription, setMCVersion, setPackIcon, completeSetup, mcVersion } = usePackStore()
  const [localName, setLocalName]       = useState('')
  const [localDesc, setLocalDesc]       = useState('')
  const [localVersion, setLocalVersion] = useState<MCVersion>(mcVersion)
  const [iconPreview, setIconPreview]   = useState<string | null>(null)
  const [iconError, setIconError]       = useState<string | null>(null)
  const [nameError, setNameError]       = useState<string | null>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)

  async function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await validateTextureFile(file)
    if (!result.valid) { setIconError(result.error ?? '유효하지 않은 이미지입니다.'); return }
    setIconPreview(await fileToDataURL(file))
    setIconError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!localName.trim()) { setNameError('팩 이름을 입력해주세요.'); return }
    setName(localName.trim())
    setDescription(localDesc.trim())
    setMCVersion(localVersion)
    if (iconPreview) setPackIcon(iconPreview)
    completeSetup()
  }

  const format = PACK_FORMAT_MAP[localVersion]?.format ?? '?'

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-mc-bg-panel border-2 border-mc-border rounded-xl w-full max-w-md p-7 shadow-2xl">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 bg-gradient-to-br from-mc-grass to-emerald-700 rounded-lg flex items-center justify-center text-2xl select-none shadow-lg">
            🎮
          </div>
          <div>
            <h1 className="text-mc-text-primary font-bold text-xl leading-tight">MC-Pack Studio</h1>
            <p className="text-mc-text-muted text-xs mt-0.5">새 리소스팩을 만들거나 기존 팩을 불러오세요</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 팩 이름 */}
          <div>
            <label className="block text-mc-text-secondary text-xs mb-1.5 font-semibold tracking-wide">
              팩 이름 <span className="text-mc-danger">*</span>
            </label>
            <input
              type="text"
              value={localName}
              onChange={e => { setLocalName(e.target.value); setNameError(null) }}
              placeholder="나만의 리소스팩"
              autoFocus
              className="w-full bg-mc-bg-dark border border-mc-border text-mc-text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-mc-accent placeholder:text-mc-text-muted transition-colors"
            />
            {nameError && <p className="text-mc-danger text-xs mt-1.5">⚠ {nameError}</p>}
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-mc-text-secondary text-xs mb-1.5 font-semibold tracking-wide">
              설명 <span className="text-mc-text-muted font-normal">(선택)</span>
            </label>
            <textarea
              value={localDesc}
              onChange={e => setLocalDesc(e.target.value)}
              placeholder="MC-Pack Studio로 만든 리소스팩"
              rows={2}
              className="w-full bg-mc-bg-dark border border-mc-border text-mc-text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-mc-accent placeholder:text-mc-text-muted resize-none transition-colors"
            />
          </div>

          {/* 마인크래프트 버전 */}
          <div>
            <label className="block text-mc-text-secondary text-xs mb-1.5 font-semibold tracking-wide">
              마인크래프트 버전
            </label>
            <VersionSelector value={localVersion} onChange={v => setLocalVersion(v)} className="w-full" />
            <p className="text-mc-text-muted text-xs mt-1.5">
              pack_format:&nbsp;
              <span className="text-mc-accent font-mono font-bold">{format}</span>
            </p>
          </div>

          {/* 팩 아이콘 */}
          <div>
            <label className="block text-mc-text-secondary text-xs mb-1.5 font-semibold tracking-wide">
              팩 아이콘 <span className="text-mc-text-muted font-normal">(선택 · PNG · 2의 거듭제곱)</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => iconInputRef.current?.click()}
                className="w-16 h-16 bg-mc-bg-dark border-2 border-mc-border rounded-lg flex items-center justify-center cursor-pointer overflow-hidden hover:border-mc-accent transition-colors shrink-0"
              >
                {iconPreview
                  ? <img src={iconPreview} alt="팩 아이콘" className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                  : <span className="text-mc-text-muted text-xs text-center leading-snug px-1">클릭하여<br/>업로드</span>
                }
              </button>
              <div className="flex flex-col gap-1.5">
                <button type="button" onClick={() => iconInputRef.current?.click()}
                  className="text-mc-text-secondary text-xs border border-mc-border rounded-lg px-3 py-1.5 hover:bg-mc-bg-hover hover:text-mc-text-primary transition-colors">
                  PNG 선택…
                </button>
                {iconPreview && (
                  <button type="button" onClick={() => { setIconPreview(null); if (iconInputRef.current) iconInputRef.current.value = '' }}
                    className="text-mc-danger text-xs hover:underline">
                    제거
                  </button>
                )}
              </div>
            </div>
            {iconError && <p className="text-mc-danger text-xs mt-1.5">⚠ {iconError}</p>}
            <input ref={iconInputRef} type="file" accept="image/png" onChange={handleIconChange} className="hidden" />
          </div>

          {/* 구분선 */}
          <div className="border-t border-mc-border" />

          {/* 제출 */}
          <button type="submit"
            className="w-full bg-mc-accent hover:bg-mc-accent-hover text-black font-bold py-3 rounded-lg text-sm transition-colors shadow-lg shadow-mc-accent/20">
            팩 만들기 →
          </button>

          <p className="text-mc-text-muted text-xs text-center">
            기존 팩이 있다면 만든 후 상단의 <span className="text-mc-accent">📂 팩 불러오기</span>를 이용하세요
          </p>
        </form>
      </div>
    </div>
  )
}
