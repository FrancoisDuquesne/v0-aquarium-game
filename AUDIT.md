# Aquarium Game — Architectural Audit

> Generated 2026-05-29. Read this before starting any refactor. Work packages are ordered by priority.

---

## Critical Bug (fix first)

### ~~B-1 · `totalCoinsEarned` undefined reference~~ ✅ DONE

Fixed in commit 5e8d9f3: replaced `totalCoinsEarned` with `totalCoinsCollected` in `sellFishNow`.

---

## Work Package 1 — Quick Wins (< 1h total)

These are isolated, low-risk, high-value changes with no architectural impact.

### 1-A · Remove duplicate `clamp`

`clamp()` is defined in three places:
- `app/utils/math.ts` — canonical export
- `app/stores/game.ts` — local copy (noted in CLAUDE.md as known duplication)
- `app/components/AquariumDisplay.vue` — consumed via Nuxt auto-import from math.ts

**Fix:** Delete the local `clamp` function in `game.ts`. Nuxt auto-imports `~/utils/math.ts`, so it's already available without an explicit import.

---

### ~~1-B · Remove unnecessary `deep: true` watch~~ ✅ DONE

---

### ~~1-C · Fix fragile ID generation~~ ✅ DONE

Monotonic `nextId()` counter added; all fish + coin-drop id sites updated; `_nextId` seeded from max persisted fish id after `load()`.

---

### ~~1-D · `checkAchievements` called on every mutation~~ ✅ DONE

Removed from all scattered call sites; single call added at end of `tick()`.

---

### ~~1-E · Audio GainNode leak~~ ✅ DONE

Singleton `getMasterGain()` replaces per-call `masterGain()`; `toggleMute` updates gain directly.

---

## Work Package 2 — Reactive Array Churn in Hot Paths (medium effort)

Every coin spawn and flake add creates a new array via spread. These run every 5s per fish and at 60fps respectively, putting constant allocation pressure on the GC.

### ~~2-A · `spawnCoinDrop` array spread~~ ✅ DONE
### ~~2-B · `addFlakeAtPercent` array spread~~ ✅ DONE
### ~~2-C · `tick()` fish array rebuild~~ ✅ DONE

Mutate in place; only filter on death.

---

## Work Package 3 — Save Strategy (medium effort)

`save()` is called after nearly every mutation including each `tick()` call. The `_flushSave` function spreads/copies every array, builds a full `GameState` object, and calls `JSON.stringify` on it.

### ~~3-A · Stop calling save() inside tick()~~ ✅ DONE
### ~~3-B · Dirty-flag saves for player actions~~ ✅ DONE (all action saves already in place)
### ~~3-C · Fix `GameState` interface drift~~ ✅ DONE

Added `netIncomeHistory`, `market`, `listedFish` to interface; removed all `Record<string,unknown>` casts; payload now uses `satisfies GameState`.

---

## Work Package 4 — RAF Loop Performance (medium effort)

The animation loop in `AquariumDisplay.vue` runs at 60fps and contains O(n×m) work.

### ~~4-A · Fish × Flake detection O(n×m) per frame~~ ✅ DONE

8×8 spatial grid built per frame; each fish checks 3×3 neighbourhood only.

### ~~4-B · Schooling/territorial O(n²) per waypoint~~ ✅ DONE

Pre-computed `speciesPositions` map built once per frame; schooling/territorial loops now query it.

---

## ~~Work Package 5 — God Store Decomposition~~ ✅ DONE (steps 1–5 extracted)

`game.ts` reduced from 1773 → ~1333 lines. Extracted:
- `utils/breeding.ts` — pure genetics functions (step 1)
- `composables/useAchievements.ts` — checkAchievements, shiftAchievementUnlock (step 2)
- `composables/useDailyMissions.ts` — generateDailyMissions, updateMissionProgress, claimMission (step 3)
- `composables/useFishMarket.ts` — full market/listing system (step 4)
- `composables/useBreeding.ts` — full incubator/breeding system (step 5)

Steps 6 (visitor) and 7 (prestige) kept inline — each is <15 lines and closely coupled to the tick loop.

---

## ~~Work Package 6 — `livePositions` Backward Data Flow~~ ✅ DONE

`livePositions` moved to `composables/useDisplayPositions.ts` (module-level singleton). Both `game.ts` and `AquariumDisplay.vue` call `useDisplayPositions()` — the store no longer owns this map.

---

## ~~Work Package 7 — Legacy Migration Code Cleanup~~ ✅ DONE

`saveVersion` field added to `GameState` (current = 2). Migration path in `normalizeBackgroundPath` is only activated when `saveVersion < 2` during `load()`; `setBackground()` no longer runs migration code.

---

## Implementation Notes

- Nuxt auto-imports everything from `~/utils/` and `~/composables/` — no explicit imports needed for extracted files as long as they export named functions
- The `clamp` in `math.ts` is already auto-imported; removing the local copy in `game.ts` requires no import change
- When splitting the store, keep `useGameStore()` as the public API for all composables — components should not need to know about `useBreeding()` etc. Re-export from the store or expose via provide/inject
- All Work Packages are independent and can be done in any order. WP 1 has no risk. WP 2–4 are performance. WP 5–6 are architecture. WP 7 is cleanup.
