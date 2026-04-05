import { useRef, useMemo } from 'react'
import { useTextureStore } from '@/store/textureStore'
import { useTextureUpload } from '@/hooks/useTextureUpload'
import type { CSSProperties } from 'react'

// ── 블록 정의 ─────────────────────────────────────────────────────────────────
interface BlockDef {
  label: string
  top: string
  side: string
  bottom: string
}

const BLOCK_DEFS: BlockDef[] = [
  {
    label:  '잔디 블록',
    top:    'assets/minecraft/textures/block/grass_block_top.png',
    side:   'assets/minecraft/textures/block/grass_block_side.png',
    bottom: 'assets/minecraft/textures/block/dirt.png',
  },
  {
    label:  '돌',
    top:    'assets/minecraft/textures/block/stone.png',
    side:   'assets/minecraft/textures/block/stone.png',
    bottom: 'assets/minecraft/textures/block/stone.png',
  },
  {
    label:  '흙',
    top:    'assets/minecraft/textures/block/dirt.png',
    side:   'assets/minecraft/textures/block/dirt.png',
    bottom: 'assets/minecraft/textures/block/dirt.png',
  },
  {
    label:  '조약돌',
    top:    'assets/minecraft/textures/block/cobblestone.png',
    side:   'assets/minecraft/textures/block/cobblestone.png',
    bottom: 'assets/minecraft/textures/block/cobblestone.png',
  },
  {
    label:  '참나무 원목',
    top:    'assets/minecraft/textures/block/oak_log_top.png',
    side:   'assets/minecraft/textures/block/oak_log.png',
    bottom: 'assets/minecraft/textures/block/oak_log_top.png',
  },
  {
    label:  '참나무 판자',
    top:    'assets/minecraft/textures/block/oak_planks.png',
    side:   'assets/minecraft/textures/block/oak_planks.png',
    bottom: 'assets/minecraft/textures/block/oak_planks.png',
  },
  {
    label:  '모래',
    top:    'assets/minecraft/textures/block/sand.png',
    side:   'assets/minecraft/textures/block/sand.png',
    bottom: 'assets/minecraft/textures/block/sand.png',
  },
  {
    label:  '다이아몬드 광석',
    top:    'assets/minecraft/textures/block/diamond_ore.png',
    side:   'assets/minecraft/textures/block/diamond_ore.png',
    bottom: 'assets/minecraft/textures/block/diamond_ore.png',
  },
  {
    label:  '철 광석',
    top:    'assets/minecraft/textures/block/iron_ore.png',
    side:   'assets/minecraft/textures/block/iron_ore.png',
    bottom: 'assets/minecraft/textures/block/iron_ore.png',
  },
  {
    label:  '금 광석',
    top:    'assets/minecraft/textures/block/gold_ore.png',
    side:   'assets/minecraft/textures/block/gold_ore.png',
    bottom: 'assets/minecraft/textures/block/gold_ore.png',
  },
  {
    label:  '흑요석',
    top:    'assets/minecraft/textures/block/obsidian.png',
    side:   'assets/minecraft/textures/block/obsidian.png',
    bottom: 'assets/minecraft/textures/block/obsidian.png',
  },
  {
    label:  'TNT',
    top:    'assets/minecraft/textures/block/tnt_top.png',
    side:   'assets/minecraft/textures/block/tnt_side.png',
    bottom: 'assets/minecraft/textures/block/tnt_bottom.png',
  },
  {
    label:  '베드락',
    top:    'assets/minecraft/textures/block/bedrock.png',
    side:   'assets/minecraft/textures/block/bedrock.png',
    bottom: 'assets/minecraft/textures/block/bedrock.png',
  },
]

// ── 경로 → 공유 블록명 목록 사전 계산 ─────────────────────────────────────────
// 특정 텍스처 경로가 어떤 블록·면에서 쓰이는지 미리 맵핑
function buildShareMap(): Record<string, Array<{ blockLabel: string; faceLabel: string }>> {
  const map: Record<string, Array<{ blockLabel: string; faceLabel: string }>> = {}
  for (const def of BLOCK_DEFS) {
    const faces: [string, string][] = [
      [def.top,    '윗면'],
      [def.side,   '옆면'],
      [def.bottom, '아랫면'],
    ]
    for (const [path, faceLabel] of faces) {
      if (!map[path]) map[path] = []
      // 이미 동일 blockLabel+faceLabel이 없을 때만 추가
      if (!map[path].some(e => e.blockLabel === def.label && e.faceLabel === faceLabel)) {
        map[path].push({ blockLabel: def.label, faceLabel })
      }
    }
  }
  return map
}

const SHARE_MAP = buildShareMap()

// ── CSS 3D 큐브 (6면) ─────────────────────────────────────────────────────────
const S = 64

function BlockCube3D({ topUrl, sideUrl, bottomUrl }: {
  topUrl: string | null
  sideUrl: string | null
  bottomUrl: string | null
}) {
  const half = S / 2

  function faceStyle(transform: string, url: string | null, fallback: string, brightness: number): CSSProperties {
    return {
      position: 'absolute',
      width: S,
      height: S,
      transform,
      backgroundImage: url ? `url(${url})` : undefined,
      backgroundSize: '100% 100%',
      backgroundColor: url ? undefined : fallback,
      imageRendering: 'pixelated',
      backfaceVisibility: 'hidden',
      filter: `brightness(${brightness})`,
      border: '1px solid rgba(0,0,0,0.3)',
      boxSizing: 'border-box',
    }
  }

  return (
    <div style={{ perspective: 480, width: S * 2.2, height: S * 2.2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: S, height: S, transformStyle: 'preserve-3d', transform: 'rotateX(26deg) rotateY(-45deg)' }}>
        <div style={faceStyle(`rotateX(90deg) translateZ(${half}px)`,   topUrl,    '#6ab04c', 1.0)} />
        <div style={faceStyle(`rotateX(-90deg) translateZ(${half}px)`,  bottomUrl, '#5a6e28', 0.6)} />
        <div style={faceStyle(`translateZ(${half}px)`,                   sideUrl,   '#4a7c3f', 0.75)} />
        <div style={faceStyle(`rotateY(180deg) translateZ(${half}px)`,   sideUrl,   '#3a5c30', 0.55)} />
        <div style={faceStyle(`rotateY(-90deg) translateZ(${half}px)`,   sideUrl,   '#3a5c30', 0.65)} />
        <div style={faceStyle(`rotateY(90deg) translateZ(${half}px)`,    sideUrl,   '#2d4a25', 0.52)} />
      </div>
    </div>
  )
}

// ── 면 업로드 슬롯 ────────────────────────────────────────────────────────────
function FaceSlot({ faceLabel, texturePath, dataURL, currentBlockLabel }: {
  faceLabel: string
  texturePath: string
  dataURL: string | null
  currentBlockLabel: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading, error, clearError } = useTextureUpload()

  // 이 경로를 현재 블록 외의 다른 블록/면에서도 사용하는지 확인
  const sharedWith = useMemo(() =>
    (SHARE_MAP[texturePath] ?? []).filter(
      (e) => !(e.blockLabel === currentBlockLabel && e.faceLabel === faceLabel)
    ),
    [texturePath, currentBlockLabel, faceLabel]
  )
  const isShared = sharedWith.length > 0

  async function handleFile(file: File) {
    clearError()
    await upload(file, texturePath)
  }

  function openPicker() {
    if (inputRef.current) {
      // ✅ 버그 수정: 같은 파일 재선택 시 onChange가 발생하도록 value 초기화
      inputRef.current.value = ''
      inputRef.current.click()
    }
  }

  const isModified = !!dataURL

  return (
    <div className="flex flex-col items-center gap-1">
      {/* 라벨 */}
      <span className={`text-xs font-medium ${isModified ? 'text-mc-accent' : 'text-mc-text-muted'}`}>
        {faceLabel}
      </span>

      {/* 텍스처 썸네일 + 클릭 업로드 */}
      <div className="relative group">
        <button
          onClick={openPicker}
          disabled={uploading}
          style={{
            width: 40,
            height: 40,
            background: '#1a1a1a',
            border: `2px solid ${
              error    ? '#FF5555' :
              isShared && isModified ? '#FFAA00' :
              isModified ? '#55FF55' : '#444'
            }`,
            borderRadius: 4,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {dataURL ? (
            <img src={dataURL} alt={faceLabel} style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />
          ) : (
            <span style={{ fontSize: 20, opacity: 0.25, lineHeight: 1 }}>+</span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <span className="text-white text-xs">…</span>
            </div>
          )}
        </button>

        {/* 공유 경고 툴팁 */}
        {isShared && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 hidden group-hover:block w-48 pointer-events-none">
            <div className="bg-mc-bg-dark border border-mc-warning rounded p-2 text-xs text-mc-text-secondary shadow-xl">
              <p className="text-mc-warning font-semibold mb-1">⚠ 공유 텍스처</p>
              <p className="leading-relaxed">이 파일을 수정하면 아래 블록에도 함께 적용됩니다:</p>
              <ul className="mt-1 space-y-0.5">
                {sharedWith.map((e, i) => (
                  <li key={i} className="text-mc-accent">• {e.blockLabel} ({e.faceLabel})</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 상태 텍스트 */}
      <span style={{ fontSize: 9 }} className={
        error    ? 'text-mc-danger'  :
        isShared && isModified ? 'text-mc-warning' :
        isShared ? 'text-mc-text-muted' :
        'text-mc-text-muted'
      }>
        {error ? '오류' : isShared ? '공유됨' : isModified ? '적용됨' : '클릭'}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

// ── 블록 카드 ─────────────────────────────────────────────────────────────────
function BlockCard({ def }: { def: BlockDef }) {
  const textures = useTextureStore((s) => s.textures)
  const topUrl    = textures[def.top]?.dataURL    ?? null
  const sideUrl   = textures[def.side]?.dataURL   ?? null
  const bottomUrl = textures[def.bottom]?.dataURL ?? null
  const anyModified = !!(topUrl || sideUrl || bottomUrl)

  return (
    <div className={`flex flex-col items-center gap-3 p-4 rounded-lg border transition-colors ${
      anyModified ? 'border-mc-accent/40 bg-mc-accent/5' : 'border-mc-border bg-mc-bg-panel'
    }`}>
      <span className={`text-xs font-semibold ${anyModified ? 'text-mc-accent' : 'text-mc-text-secondary'}`}>
        {def.label}
        {anyModified && <span className="ml-1 text-mc-accent text-xs">●</span>}
      </span>

      <BlockCube3D topUrl={topUrl} sideUrl={sideUrl} bottomUrl={bottomUrl} />

      <div className="flex items-end gap-3">
        <FaceSlot faceLabel="윗면"   texturePath={def.top}    dataURL={topUrl}    currentBlockLabel={def.label} />
        <FaceSlot faceLabel="옆면"   texturePath={def.side}   dataURL={sideUrl}   currentBlockLabel={def.label} />
        <FaceSlot faceLabel="아랫면" texturePath={def.bottom} dataURL={bottomUrl} currentBlockLabel={def.label} />
      </div>
    </div>
  )
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
export function BlockPreview() {
  const textures = useTextureStore((s) => s.textures)
  const allPaths = new Set(BLOCK_DEFS.flatMap((b) => [b.top, b.side, b.bottom]))
  const modifiedCount = [...allPaths].filter((p) => !!textures[p]).length

  return (
    <div className="flex flex-col h-full bg-mc-bg-dark overflow-hidden">
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-mc-border flex items-center gap-2 flex-wrap">
        <p className="text-mc-text-muted text-xs">
          <span className="text-mc-accent font-medium">{modifiedCount}</span>개 텍스처 수정됨
        </p>
        <span className="text-mc-text-muted opacity-40">·</span>
        <p className="text-mc-text-muted text-xs">
          <span className="text-mc-warning">⚠ 주황 테두리</span> = 다른 블록과 공유되는 텍스처 (슬롯에 마우스를 올려 확인)
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          {BLOCK_DEFS.map((def) => (
            <BlockCard key={def.label} def={def} />
          ))}
        </div>
      </div>
    </div>
  )
}
