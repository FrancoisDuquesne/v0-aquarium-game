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

### 1-E · Remove `deep: true` isn't enough — also fix audio GainNode leak

**File:** `app/composables/useGameAudio.ts:19–23`

```ts
function masterGain(ac: AudioContext): GainNode {
  const g = ac.createGain();      // new node every call
  g.connect(ac.destination);
  return g;
}
```

`masterGain()` is called inside `playFeedSound`, `playCoinSound`, `playStreakSound` — each invocation creates a new `GainNode` that is never disconnected. Oscillators are scheduled to stop but the gain node connection persists. Rapid feeding leaks AudioContext nodes.

**Fix:** Create one master gain node at module level, reuse it:

```ts
let masterGainNode: GainNode | null = null;
function getMasterGain(ac: AudioContext): GainNode {
  if (!masterGainNode) {
    masterGainNode = ac.createGain();
    masterGainNode.gain.value = muted ? 0 : 1;
    masterGainNode.connect(ac.destination);
  }
  return masterGainNode;
}
```

Update `toggleMute` to set `masterGainNode.gain.value` directly.

---

## Work Package 2 — Reactive Array Churn in Hot Paths (medium effort)

Every coin spawn and flake add creates a new array via spread. These run every 5s per fish and at 60fps respectively, putting constant allocation pressure on the GC.

### 2-A · `spawnCoinDrop` — stop spreading the whole array

**File:** `app/stores/game.ts:1273`

```ts
// Before
const trimmed = [...coinDrops.value, drop];
if (trimmed.length > DROP_MAX) trimmed.splice(0, trimmed.length - DROP_MAX);
coinDrops.value = trimmed;

// After
coinDrops.value.push(drop);
if (coinDrops.value.length > DROP_MAX) {
  coinDrops.value.splice(0, coinDrops.value.length - DROP_MAX);
}
```

### 2-B · `addFlakeAtPercent` — stop spreading flakeIds

**File:** `app/components/AquariumDisplay.vue:401`

```ts
// Before
flakeIds.value = [...flakeIds.value, id].slice(-MAX_FLAKES);

// After
flakeIds.value.push(id);
if (flakeIds.value.length > MAX_FLAKES) flakeIds.value.shift();
```

### 2-C · `tick()` — stop rebuilding fish array every tick

**File:** `app/stores/game.ts:1466–1541`

The `updatedFish: FishData[]` accumulator builds a fresh array then assigns `fish.value = updatedFish` every 5 seconds. This copies the entire fish array.

**Fix:** Mutate in place. Iterate `fish.value` by index, update properties directly. Only build a new array for the dying-fish filter (which is already a separate step).

---

## Work Package 3 — Save Strategy (medium effort)

`save()` is called after nearly every mutation including each `tick()` call. The `_flushSave` function spreads/copies every array, builds a full `GameState` object, and calls `JSON.stringify` on it.

### 3-A · Stop calling save() inside tick()

**File:** `app/stores/game.ts:1664`

The `tick()` runs every 5s. Adding a 1s-debounced save on top means a localStorage write fires every ~6s in steady state. Nothing that `tick()` mutates (hunger, health, boredom, coinProgress) is so critical that it can't wait for the next natural save.

**Fix:** Remove `save()` from the end of `tick()`. Rely on the `pagehide` listener (already wired at `game.ts:569`) plus saves triggered by explicit player actions (buy, feed, collect).

### 3-B · Add dirty-flag saves for player actions

After removing save from tick, ensure these call sites still save:
- `feedFish`, `collectCoinDrop`, `collectAll` — keep save
- `buyFish`, `buyUpgrade`, `activateBoost`, `setBackground`, etc. — keep save
- `tick` — remove save

### 3-C · Fix `GameState` interface drift

The save payload is cast as `GameState & { netIncomeHistory: number[] }` because `netIncomeHistory` isn't in `GameState`. Several fields are accessed in `load()` via `(parsed as Record<string, unknown>).market` casts because the interface doesn't include them.

**Fix:** Add `netIncomeHistory`, `market`, `listedFish` to the `GameState` interface. Remove all `Record<string, unknown>` casts in `load()`.

---

## Work Package 4 — RAF Loop Performance (medium effort)

The animation loop in `AquariumDisplay.vue` runs at 60fps and contains O(n×m) work.

### 4-A · Fish × Flake detection is O(n×m) per frame

**File:** `app/components/AquariumDisplay.vue:268–290`

For each fish, the code iterates every flake to find the nearest one within `DETECT_RADIUS`. With 20 fish and 60 flakes this is 1200 distance calculations per frame.

**Fix:** Spatial bucketing. Divide the 100×100 coordinate space into a coarse grid (e.g. 8 cells × 8 cells = 12.5% wide each). When a flake is added/moved, place it in a bucket. For each fish, only query its bucket and adjacent buckets. Reduces comparisons from n×m to ~n×(m/8) in the average case.

### 4-B · Schooling/territorial behavior is O(n²) per waypoint

**File:** `app/components/AquariumDisplay.vue:225–250`

When computing a new waypoint for schooling/territorial fish, the code calls `game.fish.forEach()` inside the outer `positions.forEach()`.

**Fix:** Pre-compute a per-species position map once per tick, outside the fish loop:

```ts
const speciesPositions = new Map<string, {x: number, y: number}[]>();
game.fish.forEach(f => {
  const pos = positions.get(f.id);
  if (!pos) return;
  const arr = speciesPositions.get(f.type) ?? [];
  arr.push(pos);
  speciesPositions.set(f.type, arr);
});
```

Then schooling/territorial logic queries `speciesPositions.get(species)` instead of rescanning all fish.

---

## Work Package 5 — God Store Decomposition (high effort)

`app/stores/game.ts` at 1773 lines is the biggest structural problem. Every feature lives here, making it hard to understand or change any one system without reading the whole file.

### Target structure

```
app/stores/
  game.ts           ~400 lines  (core: fish, coins, tick, persistence)
app/composables/
  useBreeding.ts    ~200 lines  (incubator, genetics, baby generation)
  useFishMarket.ts  ~100 lines  (market pool, listings, buy/sell)
  useAchievements.ts ~80 lines  (definitions, check, unlock queue)
  useDailyMissions.ts ~80 lines (pool, progress, claim, streak)
  usePrestige.ts     ~40 lines  (canPrestige, doPrestige)
  useVisitor.ts      ~60 lines  (spawn, feed, timer)
app/utils/
  breeding.ts        ~80 lines  (pure: inheritTrait, rollMutation, calculateBabyGenetics)
  persistence.ts     ~120 lines (load, save, normalizeBackgroundPath, resolvers)
```

### Extraction order (each step independently testable)

1. **`utils/breeding.ts`** — `inheritTrait`, `rollMutation`, `calculateBabyGenetics`, `checkInbreeding` are pure functions with no store dependency. Extract first.

2. **`composables/useAchievements.ts`** — self-contained: definitions array, `checkAchievements`, `shiftAchievementUnlock`, `pendingAchievementUnlocks`. Reads `fish`, `upgrades`, `autoFeeder`, `purchasedExpansions` from the game store via `useGameStore()`.

3. **`composables/useDailyMissions.ts`** — `generateDailyMissions`, `claimMission`, `updateMissionProgress`, `dailyState`. Self-contained once achievements are extracted.

4. **`composables/useFishMarket.ts`** — `market`, `listedFish`, `getMarketPool`, `buyMarketFish`, `listFishForSale`, `cancelListing`, `checkListings`, `isListed`, `getListingFor`. Minimal deps on core state.

5. **`composables/useBreeding.ts`** — `incubator`, `canBreed`, `startBreeding`, `cancelBreeding`, `checkIncubation`, `spawnQueuedBaby`, `getEligibleBreedingPartners`.

6. **`composables/useVisitor.ts`** — `visitor`, `visitorSpawnAfterMs`, `visitorSessionStartMs`, `lastVisitorDate`, `pendingVisitorArrival`, `feedVisitor`.

7. **`composables/usePrestige.ts`** — `prestigeLevel`, `canPrestige`, `doPrestige`.

8. **`utils/persistence.ts`** — `load`, `_flushSave`, `save`, all `resolve*` helpers, `normalizeBackgroundPath`.

### What stays in `game.ts`

Core game loop: `coins`, `fish`, `coinDrops`, `tick`, `feedFish`, `buyFish`, `removeFish`, `spawnCoinDrop`, `collectCoinDrop`, `collectAll`, `hungerDecayPerTick`, `coinMultiplier`, `livePositions`.

---

## Work Package 6 — `livePositions` Backward Data Flow (medium effort)

**File:** `app/stores/game.ts:347`, `app/components/AquariumDisplay.vue:337`

The display component writes fish positions back to the store every RAF frame via `game.livePositions.set(id, pos)`. The store then reads these in `tick()` to origin coin drops at the fish's visual position.

This is architecturally backward: the view is writing state into the store. It also means positions are always the previous frame's values when `tick()` fires.

**Fix (Option A — minimal change):** Move `livePositions` to a shared composable `useDisplayPositions()` that both the store and display component import. The store no longer "owns" it.

**Fix (Option B — proper):** Pass a position resolver callback into `spawnCoinDrop`:

```ts
function spawnCoinDrop(
  origin: Pick<FishData, 'id' | 'x' | 'y'>,
  ...
) { ... }
```

The store already receives `origin` from the caller. In `tick()`, the caller resolves the live position before passing it:

```ts
const live = livePositions.get(entry.id);
const origin = { id: entry.id, x: live?.x ?? entry.x, y: live?.y ?? entry.y };
```

This is already done at `game.ts:1472`. The issue is that `livePositions` lives on the store. Moving it to the composable is sufficient.

---

## Work Package 7 — Legacy Migration Code Cleanup (low effort, deferred)

`normalizeBackgroundPath()` runs on every `setBackground()` call and during `load()`. It handles the `/images/background-*.png` → `/backgrounds/*.webp` migration.

Once saves have been normalized (all users who still have the old format have loaded and re-saved), this code is dead weight in the hot path.

**Fix:** Add a `saveVersion` field to `GameState`. On load, if `saveVersion < 2`, run the migration once and bump the version. Remove the conversion checks from the normal `normalizeBackgroundPath` code path.

---

## Implementation Notes

- Nuxt auto-imports everything from `~/utils/` and `~/composables/` — no explicit imports needed for extracted files as long as they export named functions
- The `clamp` in `math.ts` is already auto-imported; removing the local copy in `game.ts` requires no import change
- When splitting the store, keep `useGameStore()` as the public API for all composables — components should not need to know about `useBreeding()` etc. Re-export from the store or expose via provide/inject
- All Work Packages are independent and can be done in any order. WP 1 has no risk. WP 2–4 are performance. WP 5–6 are architecture. WP 7 is cleanup.
