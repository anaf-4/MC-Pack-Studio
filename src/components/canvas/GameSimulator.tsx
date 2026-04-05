import { useTextureStore } from '@/store/textureStore'
import {
  SIMULATOR_WIDTH,
  SIMULATOR_HEIGHT,
  HOTBAR_W,
  HOTBAR_H,
  XP_H,
  ICON_SIZE,
  HEART_COUNT,
  HUNGER_COUNT,
  HOTBAR_LEFT_X,
  HOTBAR_TOP_Y,
  XP_TOP_Y,
  ICONS_TOP_Y,
  HEALTH_START_X,
  HUNGER_END_X,
  HEALTH_TEXTURE_PATH,
  HUNGER_TEXTURE_PATH,
  HOTBAR_TEXTURE_PATH,
  CROSSHAIR_TEXTURE_PATH,
} from '@/constants/guiLayouts'

export function GameSimulator() {
  const textures = useTextureStore((s) => s.textures)

  const heartTex    = textures[HEALTH_TEXTURE_PATH]?.dataURL   ?? null
  const hungerTex   = textures[HUNGER_TEXTURE_PATH]?.dataURL   ?? null
  const hotbarTex   = textures[HOTBAR_TEXTURE_PATH]?.dataURL   ?? null
  const crosshairTex = textures[CROSSHAIR_TEXTURE_PATH]?.dataURL ?? null

  return (
    <div className="flex flex-col items-center justify-center h-full bg-mc-bg-dark p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-mc-text-muted text-xs">게임 미리보기</span>
        <span className="text-mc-text-muted text-xs">·</span>
        <span className="text-mc-text-muted text-xs font-mono">{SIMULATOR_WIDTH}×{SIMULATOR_HEIGHT}</span>
      </div>

      <div
        className="relative overflow-hidden rounded shadow-2xl border border-mc-border flex-shrink-0"
        style={{ width: SIMULATOR_WIDTH, height: SIMULATOR_HEIGHT }}
      >
        {/* ── 배경 ── */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, #5B9BD6 0%, #8BC5E8 55%, #5D8A35 55%, #866043 75%)' }}
        />
        <div className="absolute bg-yellow-300 rounded-sm" style={{ width: 32, height: 32, top: 50, right: 100 }} />
        {Array.from({ length: 21 }, (_, i) => i * 32).map((x) => (
          <div key={x} className="absolute" style={{ left: x, top: SIMULATOR_HEIGHT * 0.55 - 20, width: 20, height: 20, background: '#5D8A35' }} />
        ))}

        {/* ── 조준선 ── */}
        {crosshairTex ? (
          <img
            src={crosshairTex}
            alt="조준선"
            style={{
              position: 'absolute',
              left: SIMULATOR_WIDTH / 2 - 12,
              top: SIMULATOR_HEIGHT / 2 - 12,
              width: 24,
              height: 24,
              imageRendering: 'pixelated',
            }}
          />
        ) : (
          <div
            className="absolute pointer-events-none"
            style={{ left: SIMULATOR_WIDTH / 2 - 11, top: SIMULATOR_HEIGHT / 2 - 11 }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22">
              <line x1="11" y1="2" x2="11" y2="20" stroke="white" strokeWidth="2" opacity="0.85" />
              <line x1="2" y1="11" x2="20" y2="11" stroke="white" strokeWidth="2" opacity="0.85" />
            </svg>
          </div>
        )}

        {/* ── 체력 하트 바 (왼쪽) ── */}
        <HealthBar heartTex={heartTex} />

        {/* ── 배고픔 아이콘 바 (오른쪽) ── */}
        <HungerBar hungerTex={hungerTex} />

        {/* ── XP 바 ── */}
        <div
          className="absolute"
          style={{
            left: HOTBAR_LEFT_X,
            top: XP_TOP_Y,
            width: HOTBAR_W,
            height: XP_H,
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
          }}
        >
          <div style={{ width: '40%', height: '100%', background: '#7CFC00' }} />
        </div>

        {/* ── 핫바 ── */}
        {hotbarTex ? (
          /* 업로드된 widgets.png의 핫바 영역(0,0~182×22)만 2× 스케일로 표시 */
          <div
            className="absolute"
            style={{
              left: HOTBAR_LEFT_X,
              top: HOTBAR_TOP_Y,
              width: HOTBAR_W,
              height: HOTBAR_H,
              backgroundImage: `url(${hotbarTex})`,
              backgroundSize: `${(HOTBAR_W / 182) * 256}px ${(HOTBAR_H / 22) * 256}px`,
              backgroundPosition: '0 0',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
            }}
          />
        ) : (
          <DefaultHotbar />
        )}
      </div>

      <p className="mt-2 text-mc-text-muted text-xs text-center">
        HUD 탭 → 체력 하트 / 배고픔 아이콘을 업로드하면 각 칸에 바로 적용됩니다
      </p>
    </div>
  )
}

// ── 체력 하트 바 ─────────────────────────────────────────────────────────────
// 10칸, 왼쪽 정렬 (핫바 왼쪽 절반)
function HealthBar({ heartTex }: { heartTex: string | null }) {
  return (
    <div
      className="absolute flex"
      style={{ left: HEALTH_START_X, top: ICONS_TOP_Y, gap: 0 }}
    >
      {Array.from({ length: HEART_COUNT }).map((_, i) => (
        <div key={i} style={{ width: ICON_SIZE, height: ICON_SIZE, flexShrink: 0 }}>
          {heartTex ? (
            <img
              src={heartTex}
              alt={`체력 ${i + 1}`}
              style={{ width: ICON_SIZE, height: ICON_SIZE, imageRendering: 'pixelated', display: 'block' }}
            />
          ) : (
            <DefaultHeart />
          )}
        </div>
      ))}
    </div>
  )
}

// ── 배고픔 아이콘 바 ──────────────────────────────────────────────────────────
// 10칸, 오른쪽 정렬 (핫바 오른쪽 절반), 오른쪽→왼쪽 순서
function HungerBar({ hungerTex }: { hungerTex: string | null }) {
  // 아이콘 10개의 총 너비
  const totalW = HUNGER_COUNT * ICON_SIZE  // 180px

  return (
    <div
      className="absolute"
      style={{
        // 오른쪽 끝을 HUNGER_END_X(=502)에 고정
        left: HUNGER_END_X - totalW,  // 502 - 180 = 322
        top: ICONS_TOP_Y,
        width: totalW,
        display: 'flex',
        flexDirection: 'row',         // 왼쪽부터 오른쪽 순서로 나열 (Minecraft 배고픔 방향)
      }}
    >
      {Array.from({ length: HUNGER_COUNT }).map((_, i) => (
        <div key={i} style={{ width: ICON_SIZE, height: ICON_SIZE, flexShrink: 0 }}>
          {hungerTex ? (
            <img
              src={hungerTex}
              alt={`배고픔 ${i + 1}`}
              style={{ width: ICON_SIZE, height: ICON_SIZE, imageRendering: 'pixelated', display: 'block' }}
            />
          ) : (
            <DefaultHunger />
          )}
        </div>
      ))}
    </div>
  )
}

// ── 기본 핫바 플레이스홀더 ────────────────────────────────────────────────────
function DefaultHotbar() {
  return (
    <div
      className="absolute flex"
      style={{
        left: HOTBAR_LEFT_X,
        top: HOTBAR_TOP_Y,
        width: HOTBAR_W,
        height: HOTBAR_H,
        background: 'rgba(0,0,0,0.6)',
        border: '2px solid rgba(255,255,255,0.25)',
        boxSizing: 'border-box',
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: '100%',
            border: `1px solid rgba(255,255,255,${i === 0 ? 0.7 : 0.15})`,
            boxSizing: 'border-box',
          }}
        />
      ))}
    </div>
  )
}

// ── SVG 플레이스홀더: 하트 ────────────────────────────────────────────────────
function DefaultHeart() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 18 18" style={{ display: 'block' }}>
      {/* 배경(빈 하트 회색) */}
      <path d="M3 4 L6 4 L6 3 L12 3 L12 4 L15 4 L15 9 L9 15 L3 9 Z" fill="#555" />
      {/* 채워진 빨간 하트 */}
      <path d="M3 4 L6 4 L6 3 L12 3 L12 4 L15 4 L15 9 L9 15 L3 9 Z" fill="#FF0000" />
      {/* 하이라이트 */}
      <path d="M5 4 L8 4 L8 3 L11 3 L11 4 L5 4 Z" fill="#FF6666" opacity="0.6" />
    </svg>
  )
}

// ── SVG 플레이스홀더: 닭다리 ──────────────────────────────────────────────────
function DefaultHunger() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 18 18" style={{ display: 'block' }}>
      {/* 배경(빈 닭다리 회색) */}
      <path d="M4 7 L7 5 L11 5 L14 8 L13 13 L11 15 L7 15 L5 13 Z" fill="#555" />
      {/* 채워진 닭다리 갈색 */}
      <path d="M4 7 L7 5 L11 5 L14 8 L13 13 L11 15 L7 15 L5 13 Z" fill="#C87137" />
      <path d="M6 6 L10 5.5 L12 8 L11 12 L9 14 L7 12 Z" fill="#E8963A" />
      {/* 뼈 끝 */}
      <rect x="11" y="2" width="5" height="4" rx="1" fill="#D4B483" />
    </svg>
  )
}
