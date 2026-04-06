import { useRef, useMemo, useState } from 'react'
import { useTextureStore } from '@/store/textureStore'
import { useTextureUpload } from '@/hooks/useTextureUpload'
import { getTexturesByCategory } from '@/constants/texturePaths'
import { downloadTexture } from '@/utils/downloadTexture'
import type { CSSProperties } from 'react'

// ── 블록 정의 ─────────────────────────────────────────────────────────────────
interface BlockDef {
  id: string
  label: string
  top: string
  side: string
  bottom: string
  builtIn?: boolean
}

const b = (label: string, top: string, side?: string, bottom?: string, id?: string): BlockDef => {
  const p = (f: string) => `assets/minecraft/textures/block/${f}`
  return {
    id: id ?? label,
    label,
    top:    p(top),
    side:   p(side ?? top),
    bottom: p(bottom ?? side ?? top),
    builtIn: true,
  }
}

const DEFAULT_BLOCK_DEFS: BlockDef[] = [
  // 지형
  b('잔디 블록',    'grass_block_top.png', 'grass_block_side.png', 'dirt.png'),
  b('흙',          'dirt.png'),
  b('포드졸',      'podzol_top.png',       'podzol_side.png',      'dirt.png'),
  b('균사',        'mycelium_top.png',     'mycelium_side.png',    'dirt.png'),
  b('돌',          'stone.png'),
  b('조약돌',      'cobblestone.png'),
  b('이끼 낀 조약돌','mossy_cobblestone.png'),
  b('자갈',        'gravel.png'),
  b('모래',        'sand.png'),
  b('붉은 모래',   'red_sand.png'),
  b('사암',        'sandstone_top.png',   'sandstone.png',        'sandstone_bottom.png'),
  b('붉은 사암',   'red_sandstone_top.png','red_sandstone.png',   'red_sandstone_top.png'),
  b('베드락',      'bedrock.png'),
  b('점토',        'clay.png'),
  b('눈',          'snow.png'),
  b('얼음',        'ice.png'),
  b('단단한 얼음', 'packed_ice.png'),
  b('청색 얼음',   'blue_ice.png'),

  // 광석
  b('석탄 광석',      'coal_ore.png'),
  b('철 광석',        'iron_ore.png'),
  b('구리 광석',      'copper_ore.png'),
  b('금 광석',        'gold_ore.png'),
  b('레드스톤 광석',  'redstone_ore.png'),
  b('청금석 광석',    'lapis_ore.png'),
  b('다이아몬드 광석','diamond_ore.png'),
  b('에메랄드 광석',  'emerald_ore.png'),
  b('심층암 다이아',  'deepslate_diamond_ore.png'),
  b('고대 잔해',      'ancient_debris_top.png','ancient_debris_side.png','ancient_debris_top.png'),

  // 광물 블록
  b('석탄 블록',      'coal_block.png'),
  b('철 블록',        'iron_block.png'),
  b('구리 블록',      'copper_block.png'),
  b('금 블록',        'gold_block.png'),
  b('다이아 블록',    'diamond_block.png'),
  b('에메랄드 블록',  'emerald_block.png'),
  b('네더라이트 블록','netherite_block.png'),

  // 돌 계열
  b('화강암',     'granite.png'),
  b('섬록암',     'diorite.png'),
  b('안산암',     'andesite.png'),
  b('심층암',     'deepslate.png'),
  b('응회암',     'tuff.png'),
  b('석재 벽돌',  'stone_bricks.png'),
  b('벽돌',       'bricks.png'),

  // 나무
  b('참나무 원목', 'oak_log_top.png',    'oak_log.png',    'oak_log_top.png'),
  b('참나무 판자', 'oak_planks.png'),
  b('자작 원목',   'birch_log_top.png',  'birch_log.png',  'birch_log_top.png'),
  b('자작 판자',   'birch_planks.png'),
  b('가문비 원목', 'spruce_log_top.png', 'spruce_log.png', 'spruce_log_top.png'),
  b('가문비 판자', 'spruce_planks.png'),
  b('정글 원목',   'jungle_log_top.png', 'jungle_log.png', 'jungle_log_top.png'),
  b('정글 판자',   'jungle_planks.png'),
  b('아카시아 원목','acacia_log_top.png','acacia_log.png', 'acacia_log_top.png'),
  b('아카시아 판자','acacia_planks.png'),
  b('짙은참나무 원목','dark_oak_log_top.png','dark_oak_log.png','dark_oak_log_top.png'),
  b('짙은참나무 판자','dark_oak_planks.png'),
  b('맹그로브 원목', 'mangrove_log_top.png','mangrove_log.png','mangrove_log_top.png'),
  b('벚나무 원목',   'cherry_log_top.png',  'cherry_log.png',  'cherry_log_top.png'),

  // 양털
  b('흰색 양털',  'white_wool.png'),
  b('주황색 양털','orange_wool.png'),
  b('자홍색 양털','magenta_wool.png'),
  b('노란색 양털','yellow_wool.png'),
  b('연두색 양털','lime_wool.png'),
  b('분홍색 양털','pink_wool.png'),
  b('회색 양털',  'gray_wool.png'),
  b('청록색 양털','cyan_wool.png'),
  b('보라색 양털','purple_wool.png'),
  b('파란색 양털','blue_wool.png'),
  b('붉은색 양털','red_wool.png'),
  b('검정색 양털','black_wool.png'),

  // 콘크리트
  b('흰색 콘크리트',  'white_concrete.png'),
  b('주황색 콘크리트','orange_concrete.png'),
  b('노란색 콘크리트','yellow_concrete.png'),
  b('연두색 콘크리트','lime_concrete.png'),
  b('파란색 콘크리트','blue_concrete.png'),
  b('붉은색 콘크리트','red_concrete.png'),
  b('검정색 콘크리트','black_concrete.png'),

  // 유리
  b('유리',       'glass.png'),
  b('빛나는 유리','tinted_glass.png'),

  // 빛
  b('글로우스톤', 'glowstone.png'),
  b('바다 랜턴',  'sea_lantern.png'),
  b('버섯빛',     'shroomlight.png'),

  // 네더
  b('네더랙',   'netherrack.png'),
  b('네더 벽돌','nether_bricks.png'),
  b('현무암',   'basalt_top.png',  'basalt_side.png',         'basalt_top.png'),
  b('흑석',     'blackstone.png'),
  b('소울 샌드','soul_sand.png'),
  b('마그마',   'magma.png'),
  b('흑요석',   'obsidian.png'),
  b('울부짖는 흑요석','crying_obsidian.png'),

  // 엔드
  b('엔드 돌',  'end_stone.png'),
  b('퍼퍼 블록','purpur_block.png'),

  // 기능 블록
  b('작업대',   'crafting_table_top.png','crafting_table_side.png','crafting_table_top.png'),
  b('용광로',   'furnace_top.png',       'furnace_front.png',      'furnace_top.png'),
  b('TNT',      'tnt_top.png',           'tnt_side.png',           'tnt_bottom.png'),
  b('책장',     'bookshelf.png'),
  b('음표 블록','note_block.png'),
  b('레드스톤 램프','redstone_lamp.png'),
  b('슬라임 블록','slime_block.png'),
  b('해면',     'sponge.png'),
  b('벌집',     'honeycomb_block.png'),
]

// ── 커스텀 블록 스토어 (localStorage) ────────────────────────────────────────
function loadCustomBlocks(): BlockDef[] {
  try {
    const raw = localStorage.getItem('mc_custom_blocks')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
function saveCustomBlocks(blocks: BlockDef[]) {
  localStorage.setItem('mc_custom_blocks', JSON.stringify(blocks))
}

// ── 경로 → 공유 블록명 목록 ───────────────────────────────────────────────────
function buildShareMap(defs: BlockDef[]): Record<string, Array<{ blockLabel: string; faceLabel: string }>> {
  const map: Record<string, Array<{ blockLabel: string; faceLabel: string }>> = {}
  for (const def of defs) {
    const faces: [string, string][] = [
      [def.top, '윗면'], [def.side, '옆면'], [def.bottom, '아랫면'],
    ]
    for (const [path, faceLabel] of faces) {
      if (!map[path]) map[path] = []
      if (!map[path].some(e => e.blockLabel === def.label && e.faceLabel === faceLabel))
        map[path].push({ blockLabel: def.label, faceLabel })
    }
  }
  return map
}

// ── CSS 3D 큐브 ───────────────────────────────────────────────────────────────
const S = 64

function BlockCube3D({ topUrl, sideUrl, bottomUrl }: {
  topUrl: string | null; sideUrl: string | null; bottomUrl: string | null
}) {
  const half = S / 2
  function faceStyle(transform: string, url: string | null, fallback: string, brightness: number): CSSProperties {
    return {
      position: 'absolute', width: S, height: S, transform,
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
function FaceSlot({ faceLabel, texturePath, dataURL, currentBlockLabel, shareMap }: {
  faceLabel: string; texturePath: string; dataURL: string | null
  currentBlockLabel: string; shareMap: Record<string, Array<{ blockLabel: string; faceLabel: string }>>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading, error, clearError } = useTextureUpload()

  const sharedWith = useMemo(() =>
    (shareMap[texturePath] ?? []).filter(
      e => !(e.blockLabel === currentBlockLabel && e.faceLabel === faceLabel)
    ), [shareMap, texturePath, currentBlockLabel, faceLabel])
  const isShared = sharedWith.length > 0
  const isModified = !!dataURL

  async function handleFile(file: File) { clearError(); await upload(file, texturePath) }
  function openPicker() {
    if (inputRef.current) { inputRef.current.value = ''; inputRef.current.click() }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-xs font-medium ${isModified ? 'text-mc-accent' : 'text-mc-text-muted'}`}>{faceLabel}</span>
      <div className="relative group">
        <button
          onClick={openPicker}
          disabled={uploading}
          style={{
            width: 40, height: 40, background: '#1a1a1a',
            border: `2px solid ${error ? '#FF5555' : isShared && isModified ? '#FFAA00' : isModified ? '#55FF55' : '#444'}`,
            borderRadius: 4, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
          }}
        >
          {dataURL
            ? <img src={dataURL} alt={faceLabel} style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />
            : <span style={{ fontSize: 20, opacity: 0.25, lineHeight: 1 }}>+</span>
          }
          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <span className="text-white text-xs">…</span>
            </div>
          )}
        </button>
        {isShared && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 hidden group-hover:block w-48 pointer-events-none">
            <div className="bg-mc-bg-dark border border-mc-warning rounded p-2 text-xs text-mc-text-secondary shadow-xl">
              <p className="text-mc-warning font-semibold mb-1">⚠ 공유 텍스처</p>
              <ul className="mt-1 space-y-0.5">
                {sharedWith.map((e, i) => <li key={i} className="text-mc-accent">• {e.blockLabel} ({e.faceLabel})</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span style={{ fontSize: 9 }} className={error ? 'text-mc-danger' : isShared && isModified ? 'text-mc-warning' : 'text-mc-text-muted'}>
          {error ? '오류' : isShared ? '공유됨' : isModified ? '적용됨' : '클릭'}
        </span>
        {isModified && (
          <button
            onClick={e => { e.stopPropagation(); downloadTexture(dataURL!, texturePath) }}
            title="PNG 저장"
            style={{ fontSize: 9, lineHeight: 1, padding: '1px 3px', borderRadius: 2, border: '1px solid #444', color: '#aaa', cursor: 'pointer', background: 'transparent' }}
            className="hover:text-mc-accent hover:border-mc-accent transition-colors"
          >⬇</button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/png" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}

// ── 블록 카드 ─────────────────────────────────────────────────────────────────
function BlockCard({ def, shareMap, onDelete }: {
  def: BlockDef
  shareMap: Record<string, Array<{ blockLabel: string; faceLabel: string }>>
  onDelete?: () => void
}) {
  const textures = useTextureStore(s => s.textures)
  const topUrl    = textures[def.top]?.dataURL    ?? null
  const sideUrl   = textures[def.side]?.dataURL   ?? null
  const bottomUrl = textures[def.bottom]?.dataURL ?? null
  const anyModified = !!(topUrl || sideUrl || bottomUrl)

  return (
    <div className={`flex flex-col items-center gap-3 p-4 rounded-lg border transition-colors relative ${
      anyModified ? 'border-mc-accent/40 bg-mc-accent/5' : 'border-mc-border bg-mc-bg-panel'
    }`}>
      {!def.builtIn && onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded text-mc-text-muted hover:text-mc-danger hover:bg-mc-bg-hover transition-colors text-xs"
          title="블록 삭제"
        >✕</button>
      )}
      <span className={`text-xs font-semibold ${anyModified ? 'text-mc-accent' : 'text-mc-text-secondary'}`}>
        {def.label}{anyModified && <span className="ml-1 text-mc-accent">●</span>}
      </span>
      <BlockCube3D topUrl={topUrl} sideUrl={sideUrl} bottomUrl={bottomUrl} />
      <div className="flex items-end gap-3">
        <FaceSlot faceLabel="윗면"   texturePath={def.top}    dataURL={topUrl}    currentBlockLabel={def.label} shareMap={shareMap} />
        <FaceSlot faceLabel="옆면"   texturePath={def.side}   dataURL={sideUrl}   currentBlockLabel={def.label} shareMap={shareMap} />
        <FaceSlot faceLabel="아랫면" texturePath={def.bottom} dataURL={bottomUrl} currentBlockLabel={def.label} shareMap={shareMap} />
      </div>
    </div>
  )
}

// ── 커스텀 블록 추가 모달 ─────────────────────────────────────────────────────
function AddBlockModal({ onAdd, onClose }: {
  onAdd: (def: BlockDef) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState('')
  const allBlocks = getTexturesByCategory('block')
  const [top,    setTop]    = useState(allBlocks[0]?.path ?? '')
  const [side,   setSide]   = useState(allBlocks[0]?.path ?? '')
  const [bottom, setBottom] = useState(allBlocks[0]?.path ?? '')
  const [sameAll, setSameAll] = useState(true)

  function handleTopChange(v: string) {
    setTop(v)
    if (sameAll) { setSide(v); setBottom(v) }
  }

  function handleSubmit() {
    if (!label.trim()) return
    onAdd({
      id: `custom_${Date.now()}`,
      label: label.trim(),
      top, side, bottom,
    })
    onClose()
  }

  const sel = (value: string, onChange: (v: string) => void) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-mc-bg-dark border border-mc-border rounded px-2 py-1 text-xs text-mc-text-primary focus:outline-none focus:border-mc-accent"
    >
      {allBlocks.map(b => (
        <option key={b.path} value={b.path}>{b.label}</option>
      ))}
    </select>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-mc-bg-panel border border-mc-border rounded-xl p-6 w-96 flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-mc-text-primary font-bold text-sm">블록 추가</h2>
          <button onClick={onClose} className="text-mc-text-muted hover:text-mc-text-secondary text-lg leading-none">✕</button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-mc-text-muted text-xs">블록 이름</label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="예: 나만의 블록"
            className="bg-mc-bg-dark border border-mc-border rounded px-3 py-1.5 text-sm text-mc-text-primary focus:outline-none focus:border-mc-accent"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={sameAll} onChange={e => setSameAll(e.target.checked)} className="accent-mc-accent" />
          <span className="text-mc-text-muted text-xs">윗면·옆면·아랫면 동일하게</span>
        </label>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-mc-text-muted text-xs">윗면</label>
            {sel(top, handleTopChange)}
          </div>
          {!sameAll && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-mc-text-muted text-xs">옆면</label>
                {sel(side, setSide)}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-mc-text-muted text-xs">아랫면</label>
                {sel(bottom, setBottom)}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSubmit}
            disabled={!label.trim()}
            className="flex-1 bg-mc-accent hover:bg-mc-accent-hover disabled:opacity-40 text-black font-bold py-1.5 rounded text-sm transition-colors"
          >추가</button>
          <button
            onClick={onClose}
            className="px-4 border border-mc-border rounded text-mc-text-secondary hover:bg-mc-bg-hover text-sm transition-colors"
          >취소</button>
        </div>
      </div>
    </div>
  )
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
export function BlockPreview() {
  const textures = useTextureStore(s => s.textures)
  const [customBlocks, setCustomBlocks] = useState<BlockDef[]>(loadCustomBlocks)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState('')
  const [showCustomOnly, setShowCustomOnly] = useState(false)

  const allBlocks = [...DEFAULT_BLOCK_DEFS, ...customBlocks]
  const shareMap  = useMemo(() => buildShareMap(allBlocks), [customBlocks])

  const filtered = allBlocks.filter(def => {
    if (showCustomOnly && def.builtIn) return false
    if (filter.trim() && !def.label.includes(filter.trim())) return false
    return true
  })

  const allPaths = new Set(allBlocks.flatMap(b => [b.top, b.side, b.bottom]))
  const modifiedCount = [...allPaths].filter(p => !!textures[p]).length

  function addCustomBlock(def: BlockDef) {
    const next = [...customBlocks, def]
    setCustomBlocks(next)
    saveCustomBlocks(next)
  }

  function deleteCustomBlock(id: string) {
    const next = customBlocks.filter(b => b.id !== id)
    setCustomBlocks(next)
    saveCustomBlocks(next)
  }

  return (
    <div className="flex flex-col h-full bg-mc-bg-dark overflow-hidden">
      {/* 헤더 */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-mc-border flex items-center gap-2 flex-wrap">
        <p className="text-mc-text-muted text-xs">
          <span className="text-mc-accent font-medium">{modifiedCount}</span>개 수정됨
        </p>
        <span className="text-mc-text-muted opacity-40">·</span>
        <input
          type="text"
          placeholder="블록 검색…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="flex-1 min-w-0 bg-mc-bg-panel border border-mc-border rounded px-2 py-1 text-xs text-mc-text-primary placeholder:text-mc-text-muted focus:outline-none focus:border-mc-accent"
        />
        <button
          onClick={() => setShowCustomOnly(v => !v)}
          className={`px-2 py-1 rounded text-xs border transition-colors ${
            showCustomOnly ? 'border-mc-accent text-mc-accent bg-mc-accent/10' : 'border-mc-border text-mc-text-muted hover:bg-mc-bg-hover'
          }`}
        >커스텀만</button>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs border border-mc-accent text-mc-accent hover:bg-mc-accent/10 transition-colors font-medium"
        >+ 블록 추가</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <p className="text-mc-text-muted text-sm text-center py-8">블록을 찾을 수 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {filtered.map(def => (
              <BlockCard
                key={def.id}
                def={def}
                shareMap={shareMap}
                onDelete={!def.builtIn ? () => deleteCustomBlock(def.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddBlockModal
          onAdd={addCustomBlock}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
