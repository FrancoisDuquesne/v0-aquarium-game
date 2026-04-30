# Aquarium Game

Idle clicker aquarium game. Buy fish, feed them, collect coin drops. No backend — client-side only, state persisted in `localStorage`.

## Stack

- **Nuxt 4.1** + **Vue 3** (Composition API, `<script setup>`)
- **Pinia** (`@pinia/nuxt`) — single store `app/stores/game.ts`
- **Nuxt UI 3** (UButton, UModal, UTabs, UBadge, UCard) + TailwindCSS
- **VueUse** (`useIntervalFn`, `useNow`)
- **TypeScript** strict mode, no shims
- `nuxt dev` to run

## File Map

```
app/
  stores/game.ts          723 lines — all game state & logic (Pinia)
  utils/game-config.ts    374 lines — ALL constants, shop items, thresholds
  utils/fish-config.ts    26  lines — Levy flight helpers (generateWaypoint)
  utils/economy.ts        14  lines — coinRateFor(), nextCollectorLevel()
  components/
    AquariumDisplay.vue   534 lines — RAF animation loop, fish physics, flakes, coin drops
    GameUI.vue            217 lines — HUD, modal tabs, tool selector, boost timers
    FishControlled.vue    57  lines — fish wrapper: hunger dot, feed ping animation
    FishSvg.vue           118 lines — SVG for 11 fish species
    FlakeSvg.vue          13  lines — food flake SVG
    BubblesLayer.vue      20  lines — ambient bubbles
    inventory/modal/
      index.vue           modal wrapper with 3 tabs
      Store.vue           shop (fish, upgrades, decor, power-ups)
      Inventory.vue       fish list + tools panel
      Aquarium.vue        background gallery
public/backgrounds/       0–10.webp (no 8.webp)
```

## Game Mechanics

### Hunger & Feeding
- Tick every 5s (store `tick()`), decay `BASE_HUNGER_DECAY = 0.5` per tick
- `CARE_THRESHOLD = 60` — below: no coins, care streak resets, fish dies at 0
- `HAPPY_THRESHOLD = 80` — above: 1.35× hunger multiplier, care streaks earned
- Feeding: `+FEED_AMOUNT (20)` hunger; care streak triggers bonus coin drop
- Gourmet Feed upgrade: `−0.15` decay, `+5` feed bonus, `+15` auto-feeder amount

### Coin Economy
- Base rate per fish type: `COIN_RATE` map (0.33–2.0 coins/tick)
- Stacked multipliers: `hungerMult × streakBonus × luxeDecor(1.15×) × activeBoosts`
- Max stacked: `~3.22×` (all upgrades + boosts + full streak)
- `CoinDrop` types: coin (1–4), stack (5–11), bill (12+)
- Drop lifetime: `BASE_DROP_LIFETIME = 22s` (+4s with Clarity Filters)
- Max simultaneous drops: `DROP_MAX = 36`

### Animation Loop (AquariumDisplay.vue)
- `requestAnimationFrame` loop, skips when `document.hidden`
- Fish positions tracked in `Map<id, {x,y}>` (percent coordinates)
- Levy flight waypoints (`generateWaypoint`), soft-target smoothing (tau=0.4)
- Fish chase flakes within `DETECT_RADIUS = 16%`, eat at `EAT_RADIUS = 3%`
- Flakes sink at `SINK_SPEED_PER_S = 6%/s`, rest `5s` at floor, then disappear
- Coin fall animation via CSS custom props `--drop-start-top/--drop-end-top/--drop-fall-duration`
- `dropAnchors` Map caches per-drop layout (prevents jitter on re-render)

### Persistence
- `save()` called after every mutation; `load()` on app mount
- Offline coins: `0.25×` baseline rate, capped at 24h
- Background path migration: old `/images/background-*.png` → `/backgrounds/*.webp`

## Equipment costs
`SPOON_COST = 200` and `AUTO_FEEDER_COST = 500` are exported from `game-config.ts`. All buy calls use these constants.

## Architecture Notes

- All game constants live in `game-config.ts` — always check there before hardcoding
- `AquariumDisplay` drives visuals only; hunger/feeding logic lives in the store
- Auto-feeder flakes are triggered via `watch(() => game.autoFeeder.lastFeedTime)` in the display component (decoupled)
- Shop items are data arrays (`FISH_SHOP_ITEMS`, `TANK_UPGRADES`, etc.) — add new items without code changes
- `clamp()` helper is defined both in `game.ts` and `AquariumDisplay.vue` (minor duplication)
