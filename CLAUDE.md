# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Aquarium Game

Idle clicker aquarium game. Buy fish, feed them, collect coin drops. No backend — client-side only, state persisted in `localStorage`.

## Commands

```bash
nuxt dev      # development server
nuxt build    # production build
nuxt preview  # preview production build
```

No test suite, no linter config. TypeScript strict mode catches type errors at build time.

## Stack

- **Nuxt 4.1** + **Vue 3** (Composition API, `<script setup>`)
- **Pinia** (`@pinia/nuxt`) — single store `app/stores/game.ts`
- **Nuxt UI 3** (UButton, UModal, UTabs, UBadge, UCard) + TailwindCSS
- **VueUse** (`useIntervalFn`, `useNow`)
- **TypeScript** strict mode, no shims

## File Map

```
app/
  stores/game.ts          1332 lines — all game state & logic (Pinia)
  utils/game-config.ts     733 lines — ALL constants, shop item arrays, thresholds, fishPreviewSize()
  utils/economy.ts         178 lines — coin rates, lifespan, age ratio, market value, maintenance math
  utils/fish-config.ts      26 lines — Levy flight helpers (generateWaypoint)
  composables/
    useDisplayPositions.ts  — shared reactive Map<id,{x,y}> bridging store ↔ AquariumDisplay
    useGameAudio.ts         — Web Audio API sound effects (feed, coin, streak)
    useAchievements.ts      — achievement unlock checks, called from store tick()
    useDailyMissions.ts     — mission progress tracking
    useBreeding.ts          — incubator breed logic, genetics inheritance
    useFishMarket.ts        — market pool generation, listing, buy/sell
  components/
    AquariumDisplay.vue    901 lines — RAF animation loop, fish physics, flakes, coin drops, vacuum
    GameUI.vue             414 lines — HUD, bottom nav, modals, toasts, tutorial steps
    FishControlled.vue     128 lines — fish wrapper: stat bars, name label, hunger dot
    FishSvg.vue            510 lines — SVG for 11 fish species + genetics CSS filter
    CoinDropSvg.vue        — SVG for 9 coin drop types
    CoinSweeper.vue        — draggable vacuum collector widget
    FeedPanel.vue          — feed/play controls panel
    TankStatsPanel.vue     — maintenance cost breakdown
    ClaimableMissions.vue  — mission claim UI
    BubblesLayer.vue       — ambient bubble animation
    inventory/modal/
      index.vue            — modal wrapper, 3-tab shell (Fish / Shop / Tank)
      Store.vue            — shop tabs: New Fish, Market, Upgrades, Tank, Power-ups
      Inventory.vue        — fish list with filter/sort, feed/list/sell actions
      Aquarium.vue         — background gallery
public/backgrounds/        0–10.webp (no 8.webp)
```

## Game Mechanics

### Hunger & Feeding
- Tick every 5s (store `tick()`), decay `BASE_HUNGER_DECAY = 0.5` per tick
- `CARE_THRESHOLD = 60` — below: no coins, care streak resets; fish dies at 0
- `HAPPY_THRESHOLD = 80` — above: 1.35× coin multiplier, care streaks earned
- Feeding: `+FEED_AMOUNT (20)` hunger; care streak triggers bonus coin drop
- Gourmet Feed upgrade: `−0.15` decay, `+5` feed bonus, `+15` auto-feeder amount

### Coin Economy
- Base rate per fish type: `COIN_RATE` map in `game-config.ts` (0.33–2.0 coins/tick)
- Stacked multipliers: `hungerMult × streakBonus × luxeDecor(1.15×) × activeBoosts × prestigeBonus`
- `CoinDrop` types: copper/silver/gold/note/bundle/silver-bar/gold-bar/chest/crown
- Drop lifetime: `BASE_DROP_LIFETIME = 22s` (+4s with Clarity Filters upgrade)
- Max simultaneous drops: `DROP_MAX = 36`
- Coin Collector (vacuum sweeper): 4 levels, `VACUUM_RADII = [0, 6, 10, 14]` % of tank width

### Fish Lifecycle & Genetics
- Fish have a lifespan (`fishLifespan()` in `economy.ts`), die of old age or starvation
- Bred fish inherit `genetics: { coinMod, speedMod, healthMod, hungerMod, mutation? }`
- Mutations: golden, swift, hardy, voracious (positive), sickly, lethargic (negative)
- `FishSvg` applies a CSS `filter` string derived from genetics for visual differentiation
- Fish size scales with age ratio via `fishSizeMultiplier()` — juveniles start small

### Animation Loop (AquariumDisplay.vue)
- `requestAnimationFrame` loop, pauses when `document.hidden`
- Fish positions tracked in `Map<id, {x,y}>` (percent coordinates), mirrored to `useDisplayPositions` for external reads
- Levy flight waypoints, species-specific depth bias, schooling, and territorial behaviours via `SPECIES_PROFILES`
- Fish chase flakes within `DETECT_RADIUS = 16%`, eat at `EAT_RADIUS = 3%`
- Flakes sink at `SINK_SPEED_PER_S = 6%/s`, rest 5s at floor, then disappear
- Coin fall animation via CSS custom props `--drop-start-top / --drop-end-top / --drop-fall-duration`
- `dropAnchors` Map caches per-drop layout (prevents jitter on re-render)
- Rare visitor fish drift across the tank via CSS animation; rewarded on click

### Daily / Meta Systems
- Daily login bonus + login streak tracked in `dailyState`
- Daily missions: 3 random goals from `MISSION_POOL` (game-config.ts), progress updated in `tick()`
- Achievements: definitions in `ACHIEVEMENT_DEFINITIONS`, checked via `useAchievements` composable
- Prestige: resets fish/coins, increments `prestigeLevel`, adds permanent coin bonus per level
- Fish market: pool of pre-owned fish with real genetics, refreshes every `MARKET_REFRESH_MS`

### Persistence
- `save()` called after every mutation; `load()` on app mount
- Offline coins: `0.25×` baseline rate, capped at 24h
- Background path migration: old `/images/background-*.png` → `/backgrounds/*.webp`

## Architecture Notes

- **All constants live in `game-config.ts`** — always check there before hardcoding any number or threshold. Shop item arrays (`FISH_SHOP_ITEMS`, `TANK_UPGRADES`, `POWER_UP_ITEMS`, etc.) are pure data; adding a new item requires no code change.
- **`AquariumDisplay` is visuals only** — hunger decay, feeding logic, coin spawning all live in the store's `tick()`. The display reacts to store state via watchers and RAF.
- **Auto-feeder decoupling**: display watches `game.autoFeeder.lastFeedTime` to scatter flakes, rather than being called directly by the store.
- **`fishPreviewSize(type)`** (game-config.ts) must return `{ width, height }` — `FishSvg` uses those exact prop names and has `inheritAttrs: false`, so wrong keys are silently dropped.
- **Composables are feature modules** — `useBreeding`, `useFishMarket`, `useAchievements`, `useDailyMissions` each own their slice of logic and are composed into the Pinia store via `setup()` pattern.
- `clamp()` helper is defined both in `game.ts` and `AquariumDisplay.vue` (minor duplication, intentional for isolation).
