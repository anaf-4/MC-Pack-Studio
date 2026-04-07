// Minecraft HUD layout at 2× GUI scale, rendered in a 640×360 simulator

export const SIMULATOR_WIDTH  = 640
export const SIMULATOR_HEIGHT = 360

// ── 2× GUI scale values ──────────────────────────────────────────────────────
// Minecraft 1× base: hotbar=182×22, icon=9×9, xpbar=182×5
// All multiplied by 2 below.

export const HOTBAR_W   = 364  // 182 × 2
export const HOTBAR_H   = 44   // 22  × 2
export const XP_H       = 10   // 5   × 2
export const ICON_SIZE  = 18   // 9   × 2
export const HEART_COUNT  = 10
export const HUNGER_COUNT = 10

// ── X positions (hotbar centered at x=320) ───────────────────────────────────
export const HOTBAR_LEFT_X  = SIMULATOR_WIDTH / 2 - HOTBAR_W / 2   // 138
export const HOTBAR_RIGHT_X = SIMULATOR_WIDTH / 2 + HOTBAR_W / 2   // 502

// Health starts at hotbar left edge
export const HEALTH_START_X = HOTBAR_LEFT_X  // 138
// Hunger ends at hotbar right edge (icons rendered right→left)
export const HUNGER_END_X   = HOTBAR_RIGHT_X // 502

// ── Y positions (stacked from bottom up) ─────────────────────────────────────
// Hotbar:   bottom of screen
export const HOTBAR_TOP_Y = SIMULATOR_HEIGHT - HOTBAR_H       // 316

// XP bar:   4px gap above hotbar
export const XP_TOP_Y     = HOTBAR_TOP_Y - 4 - XP_H           // 302

// Icons:    2px gap above XP bar
export const ICONS_TOP_Y  = XP_TOP_Y - 2 - ICON_SIZE          // 282

// ── Texture paths (1.21+ sprites) ────────────────────────────────────────────
export const HEALTH_TEXTURE_PATH    = 'assets/minecraft/textures/gui/sprites/hud/heart/full.png'
export const HUNGER_TEXTURE_PATH    = 'assets/minecraft/textures/gui/sprites/hud/food_full.png'
export const HOTBAR_TEXTURE_PATH    = 'assets/minecraft/textures/gui/sprites/hud/hotbar.png'
export const CROSSHAIR_TEXTURE_PATH = 'assets/minecraft/textures/gui/sprites/hud/crosshair.png'
