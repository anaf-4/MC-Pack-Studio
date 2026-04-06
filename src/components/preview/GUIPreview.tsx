import { useState } from 'react'
import { useTextureStore } from '@/store/textureStore'
import { useVanillaTexture } from '@/hooks/useVanillaTexture'

type GUIScreen = 'inventory' | 'chest' | 'crafting' | 'furnace'

const GUI_SCREENS: { id: GUIScreen; label: string }[] = [
  { id: 'inventory',  label: '인벤토리' },
  { id: 'crafting',   label: '작업대' },
  { id: 'chest',      label: '상자' },
  { id: 'furnace',    label: '용광로' },
]

const GUI_PATHS: Record<GUIScreen, string> = {
  inventory: 'assets/minecraft/textures/gui/container/inventory.png',
  crafting:  'assets/minecraft/textures/gui/container/crafting_table.png',
  chest:     'assets/minecraft/textures/gui/container/chest.png',
  furnace:   'assets/minecraft/textures/gui/container/furnace.png',
}

export function GUIPreview() {
  const [active, setActive] = useState<GUIScreen>('inventory')
  const textures = useTextureStore((s) => s.textures)

  // 바닐라 폴백 (hooks는 항상 고정 순서로 호출)
  const vanillaInv      = useVanillaTexture(GUI_PATHS.inventory)
  const vanillaCrafting = useVanillaTexture(GUI_PATHS.crafting)
  const vanillaChest    = useVanillaTexture(GUI_PATHS.chest)
  const vanillaFurnace  = useVanillaTexture(GUI_PATHS.furnace)

  const VANILLA_MAP: Record<GUIScreen, string | null> = {
    inventory: vanillaInv,
    crafting:  vanillaCrafting,
    chest:     vanillaChest,
    furnace:   vanillaFurnace,
  }

  const customTex  = textures[GUI_PATHS[active]]
  const displayURL = customTex?.dataURL ?? VANILLA_MAP[active]

  return (
    <div className="flex flex-col h-full bg-mc-bg-dark">
      {/* 탭 */}
      <div className="flex border-b border-mc-border flex-shrink-0">
        {GUI_SCREENS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              active === s.id
                ? 'border-mc-accent text-mc-accent'
                : 'border-transparent text-mc-text-muted hover:text-mc-text-secondary'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 프리뷰 */}
      <div className="flex-1 overflow-auto flex flex-col items-center justify-center p-4 gap-4">
        {/* 게임 내 배경 흐림 효과 */}
        <div
          className="relative rounded overflow-hidden shadow-2xl border border-mc-border"
          style={{ background: '#222' }}
        >
          {/* 배경 (게임 화면 흐림) */}
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: 'linear-gradient(135deg, #5B9BD6, #5D8A35)' }}
          />

          {/* GUI 텍스처 */}
          {displayURL ? (
            <div className="relative p-4">
              <img
                src={displayURL}
                alt={active}
                style={{
                  imageRendering: 'pixelated',
                  width: 352,    // 176px × 2 (2× GUI scale)
                  height: 'auto',
                  display: 'block',
                }}
              />
            </div>
          ) : (
            <GUIWireframe screen={active} />
          )}
        </div>

        {!displayURL && (
          <p className="text-mc-text-muted text-xs text-center">
            GUI 탭에서 <span className="text-mc-accent">{GUI_SCREENS.find(s => s.id === active)?.label}</span> 텍스처를 업로드하면 여기에 표시됩니다
          </p>
        )}
        {displayURL && !customTex && (
          <p className="text-mc-text-muted text-xs text-center opacity-50">바닐라 기본 텍스처</p>
        )}
        {customTex && (
          <p className="text-mc-text-muted text-xs">
            {customTex.width}×{customTex.height}px · {customTex.fileName}
          </p>
        )}
      </div>
    </div>
  )
}

// ── 와이어프레임 플레이스홀더 ────────────────────────────────────────────────
function GUIWireframe({ screen }: { screen: GUIScreen }) {
  const SLOT = 36   // 18px × 2
  const GAP  = 4

  const slotGrid = (cols: number, rows: number, label?: string) => (
    <div>
      {label && <p className="text-mc-text-muted text-xs mb-1">{label}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${SLOT}px)`, gap: GAP }}>
        {Array.from({ length: cols * rows }).map((_, i) => (
          <div
            key={i}
            style={{
              width: SLOT,
              height: SLOT,
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    </div>
  )

  const commonInv = (
    <div className="flex flex-col gap-2">
      {slotGrid(9, 3, '인벤토리')}
      {slotGrid(9, 1, '핫바')}
    </div>
  )

  if (screen === 'inventory') return (
    <div className="relative p-5 flex flex-col gap-4" style={{ background: 'rgba(139,139,139,0.15)' }}>
      <div className="flex gap-4">
        <div style={{ width: 64, height: 88, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}
          className="flex items-center justify-center text-mc-text-muted text-xs">캐릭터</div>
        <div className="flex flex-col gap-2">
          {slotGrid(2, 2, '제작')}
          {slotGrid(1, 1, '결과')}
        </div>
      </div>
      {commonInv}
      <WireframeLabel>인벤토리</WireframeLabel>
    </div>
  )

  if (screen === 'crafting') return (
    <div className="relative p-5 flex flex-col gap-4" style={{ background: 'rgba(139,139,139,0.15)' }}>
      <div className="flex items-center gap-4">
        {slotGrid(3, 3, '재료')}
        <span className="text-mc-text-muted text-xl">→</span>
        {slotGrid(1, 1, '결과')}
      </div>
      {commonInv}
      <WireframeLabel>작업대</WireframeLabel>
    </div>
  )

  if (screen === 'chest') return (
    <div className="relative p-5 flex flex-col gap-4" style={{ background: 'rgba(139,139,139,0.15)' }}>
      {slotGrid(9, 3, '상자')}
      {commonInv}
      <WireframeLabel>상자</WireframeLabel>
    </div>
  )

  if (screen === 'furnace') return (
    <div className="relative p-5 flex flex-col gap-4" style={{ background: 'rgba(139,139,139,0.15)' }}>
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-2">
          {slotGrid(1, 1, '재료')}
          {slotGrid(1, 1, '연료')}
        </div>
        <span className="text-mc-text-muted text-xl">→</span>
        {slotGrid(1, 1, '결과')}
      </div>
      {commonInv}
      <WireframeLabel>용광로</WireframeLabel>
    </div>
  )

  return null
}

function WireframeLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="absolute top-2 left-3 text-mc-text-muted text-xs opacity-50">{children}</p>
  )
}
