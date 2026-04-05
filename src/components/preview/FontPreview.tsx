import { useState } from 'react'

const SAMPLE_TEXTS = [
  { label: '기본 문장',      text: 'Hello, Minecraft!' },
  { label: '숫자',          text: '0123456789' },
  { label: '특수문자',       text: '!@#$%^&*()_+-=[]{}' },
  { label: '한국어 (시스템)', text: '마인크래프트 리소스팩' },
]

const MC_COLORS: { code: string; name: string; color: string }[] = [
  { code: '§0', name: '검정',   color: '#000000' },
  { code: '§1', name: '남색',   color: '#0000AA' },
  { code: '§2', name: '초록',   color: '#00AA00' },
  { code: '§3', name: '청록',   color: '#00AAAA' },
  { code: '§4', name: '빨강',   color: '#AA0000' },
  { code: '§5', name: '보라',   color: '#AA00AA' },
  { code: '§6', name: '금색',   color: '#FFAA00' },
  { code: '§7', name: '회색',   color: '#AAAAAA' },
  { code: '§8', name: '짙은회', color: '#555555' },
  { code: '§9', name: '파랑',   color: '#5555FF' },
  { code: '§a', name: '연두',   color: '#55FF55' },
  { code: '§b', name: '하늘',   color: '#55FFFF' },
  { code: '§c', name: '분홍',   color: '#FF5555' },
  { code: '§d', name: '자홍',   color: '#FF55FF' },
  { code: '§e', name: '노랑',   color: '#FFFF55' },
  { code: '§f', name: '흰색',   color: '#FFFFFF' },
]

// Minecraft-style pixel font via CSS (approximation — real MC font needs bitmap)
const MC_FONT_STYLE: React.CSSProperties = {
  fontFamily: '"Courier New", monospace',
  letterSpacing: '0.05em',
  textShadow: '2px 2px 0 rgba(0,0,0,0.5)',
}

export function FontPreview() {
  const [customText, setCustomText] = useState('The quick brown fox jumps over the lazy dog')
  const [fontSize, setFontSize] = useState(16)

  return (
    <div className="flex flex-col h-full bg-mc-bg-dark overflow-y-auto">
      {/* 컨트롤 */}
      <div className="flex-shrink-0 p-4 border-b border-mc-border space-y-3">
        <div>
          <label className="block text-mc-text-muted text-xs mb-1 uppercase tracking-wide">미리보기 텍스트</label>
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full bg-mc-bg-panel border border-mc-border rounded px-3 py-1.5 text-sm text-mc-text-primary focus:outline-none focus:border-mc-accent"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-mc-text-muted text-xs uppercase tracking-wide">크기</label>
          <input
            type="range"
            min={8}
            max={48}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="flex-1 accent-mc-accent"
          />
          <span className="text-mc-text-secondary text-xs font-mono w-10 text-right">{fontSize}px</span>
        </div>
      </div>

      {/* 미리보기 패널들 */}
      <div className="flex-1 p-4 space-y-6">
        {/* 커스텀 텍스트 */}
        <div
          className="rounded p-4"
          style={{ background: '#1a1a1a', border: '1px solid #333' }}
        >
          <p className="text-mc-text-muted text-xs mb-3 uppercase tracking-wide">커스텀 미리보기</p>
          <p style={{ ...MC_FONT_STYLE, fontSize, color: '#FFFFFF', wordBreak: 'break-all' }}>
            {customText || '텍스트를 입력하세요…'}
          </p>
        </div>

        {/* 샘플 문장들 */}
        <div className="rounded overflow-hidden border border-mc-border">
          <p className="text-mc-text-muted text-xs px-3 py-2 bg-mc-bg-panel uppercase tracking-wide">샘플 텍스트</p>
          {SAMPLE_TEXTS.map((s) => (
            <div key={s.label} className="flex items-baseline gap-3 px-3 py-2.5 border-t border-mc-border first:border-0" style={{ background: '#1a1a1a' }}>
              <span className="text-mc-text-muted text-xs w-20 shrink-0">{s.label}</span>
              <span style={{ ...MC_FONT_STYLE, fontSize: 14, color: '#FFFFFF' }}>{s.text}</span>
            </div>
          ))}
        </div>

        {/* 색상 코드 팔레트 */}
        <div className="rounded overflow-hidden border border-mc-border">
          <p className="text-mc-text-muted text-xs px-3 py-2 bg-mc-bg-panel uppercase tracking-wide">마인크래프트 색상 코드</p>
          <div className="p-3 grid grid-cols-2 gap-1" style={{ background: '#1a1a1a' }}>
            {MC_COLORS.map((c) => (
              <div key={c.code} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5">
                <span style={{ ...MC_FONT_STYLE, fontSize: 13, color: c.color }}>Aa</span>
                <span className="text-mc-text-muted text-xs font-mono">{c.code}</span>
                <span className="text-mc-text-muted text-xs">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 크기별 미리보기 */}
        <div className="rounded overflow-hidden border border-mc-border">
          <p className="text-mc-text-muted text-xs px-3 py-2 bg-mc-bg-panel uppercase tracking-wide">크기별</p>
          <div className="p-4 space-y-2" style={{ background: '#1a1a1a' }}>
            {[8, 12, 16, 20, 24, 32].map((size) => (
              <div key={size} className="flex items-baseline gap-3">
                <span className="text-mc-text-muted text-xs font-mono w-8 shrink-0">{size}</span>
                <span style={{ ...MC_FONT_STYLE, fontSize: size, color: '#FFFFFF' }}>
                  Minecraft
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-mc-text-muted text-xs text-center pb-2">
          실제 마인크래프트 비트맵 폰트(default.json) 편집 기능은 추후 지원 예정입니다
        </p>
      </div>
    </div>
  )
}
