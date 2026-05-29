import { defineStore } from "pinia";
import {
  DEFAULT_BACKGROUND,
  DEFAULT_AUTO_FEEDER,
  DEFAULT_TOOLS,
  DEFAULT_COIN_COLLECTOR,
  DEFAULT_UPGRADES,
  DEFAULT_BOOSTS,
  DEFAULT_INCUBATOR,
  COIN_COLLECTOR_LEVELS,
  BOOST_DEFINITIONS,
  FISH_NAMES,
  PERSONALITY_POOL,
  SICKLY_EARLY_DEATH_CHANCE,
  type GeneticsData,
  type IncubatorState,
  type MarketFish,
  type ListedFish,
} from "~/utils/game-config";
import { fishMarketValue, fishAgeRatio, fishLifespan, fishLifeStage } from "~/utils/economy";
import type { DailyMission, DailyState } from "~/composables/useDailyMissions";

type ToolType = "flake" | "spoon";

interface FishData {
  id: number;
  type: string;
  name: string;
  x: number;
  y: number;
  hunger: number;
  health: number;
  boredom: number;
  speed: number;
  coinProgress: number;
  careStreak: number;
  personality?: string;
  genetics?: GeneticsData;
  generation?: number;
  parentIds?: [number, number];
  sicklyWatchUntil?: number; // For sickly mutation mortality tracking
  bornAt?: number;           // Epoch ms when the fish was "born" / purchased
}

interface VisitorState {
  type: string;
  name: string;
  spawnedAt: number;
  expiresAt: number;
  fed: boolean;
  reward: number;
  y: number; // vertical position % (20–65)
}
interface AutoFeeder {
  owned: boolean;
  active: boolean;
  lastFeedTime: number;
  feedInterval: number;
}
interface Tools {
  spoonOwned: boolean;
}

type CoinDropType =
  | "copper"
  | "silver"
  | "gold"
  | "note"
  | "bundle"
  | "silver-bar"
  | "gold-bar"
  | "chest"
  | "crown";

interface CoinDrop {
  id: number;
  value: number;
  x: number;
  y: number;
  spawnY: number;
  fallDurationMs: number;
  fishId: number | null;
  type: CoinDropType;
  createdAt: number;
  expiresAt: number;
  source: "baseline" | "care" | "boost";
}

interface CoinCollectorState {
  level: number;
  lastSweep: number;
}

interface UpgradesState {
  gourmetFeed: boolean;
  luxeDecor: boolean;
  clarityFilters: boolean;
}

interface ActiveBoost {
  id: string;
  label: string;
  expiresAt: number;
  multiplier: number;
}

interface GameState {
  saveVersion: number;
  coins: number;
  fish: FishData[];
  lastSaveTime: number;
  autoFeeder: AutoFeeder;
  tools: Tools;
  selectedTool: ToolType;
  feedingFishId: number | null;
  hasEverFed: boolean;
  hasEverCollected: boolean;
  background: string;
  coinCollector: CoinCollectorState;
  upgrades: UpgradesState;
  activeBoosts: ActiveBoost[];
  lastMaintenanceTick: number;
  purchasedExpansions: string[];
  unlockedAchievements: string[];
  totalCoinsCollected: number;
  totalFeedCount: number;
  maxCareStreakEver: number;
  dailyState: DailyState;
  lastVisitorDate: string;
  prestigeLevel: number;
  incubator: IncubatorState;
  netIncomeHistory: number[];
  market: { pool: MarketFish[]; lastRefresh: number };
  listedFish: ListedFish[];
}

const dropTimers = new Set<number>();

let _nextId = 1;
function nextId() { return _nextId++; }

const CURRENT_SAVE_VERSION = 2;

function normalizeBackgroundPath(path: unknown, migrate = false): string {
  if (typeof path !== "string" || !path.length) return DEFAULT_BACKGROUND;
  let normalized = path;
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized.replace(/^\/?/, "")}`;
  }
  if (migrate && normalized.startsWith("/images/background-")) {
    normalized = normalized.replace("/images/background-", "/backgrounds/");
    if (normalized.endsWith(".png")) {
      normalized = normalized.replace(/\.png$/i, ".webp");
    }
  }
  return normalized;
}

function resolveAutoFeeder(value: Partial<AutoFeeder> | undefined): AutoFeeder {
  return { ...DEFAULT_AUTO_FEEDER, ...value };
}

function resolveTools(value: Partial<Tools> | undefined): Tools {
  return { ...DEFAULT_TOOLS, ...value };
}

function resolveCoinCollector(
  value: Partial<CoinCollectorState> | undefined
): CoinCollectorState {
  return {
    ...DEFAULT_COIN_COLLECTOR,
    ...value,
    level: Math.max(
      0,
      Math.min(
        COIN_COLLECTOR_LEVELS[COIN_COLLECTOR_LEVELS.length - 1].level,
        value?.level ?? DEFAULT_COIN_COLLECTOR.level
      )
    ),
  };
}

function resolveUpgrades(
  value: Partial<UpgradesState> | undefined
): UpgradesState {
  return { ...DEFAULT_UPGRADES, ...value };
}

function resolveActiveBoosts(value: unknown): ActiveBoost[] {
  if (!Array.isArray(value)) return [...DEFAULT_BOOSTS];
  const now = Date.now();
  return value
    .map((entry) => {
      if (!entry) return null;
      const def = BOOST_DEFINITIONS[(entry as ActiveBoost).id];
      if (!def) return null;
      const expiresAt = (entry as ActiveBoost).expiresAt;
      if (typeof expiresAt !== "number" || expiresAt <= now) return null;
      return {
        id: (entry as ActiveBoost).id,
        label: (entry as ActiveBoost).label ?? def.label,
        expiresAt,
        multiplier:
          typeof (entry as ActiveBoost).multiplier === "number"
            ? (entry as ActiveBoost).multiplier
            : def.multiplier,
      } satisfies ActiveBoost;
    })
    .filter(Boolean) as ActiveBoost[];
}

function randomFishName(excluded: string[] = []): string {
  const pool = excluded.length
    ? FISH_NAMES.filter((n) => !excluded.includes(n))
    : FISH_NAMES;
  const source = pool.length ? pool : FISH_NAMES;
  return source[Math.floor(Math.random() * source.length)];
}

function normalizeFish(entry: Partial<FishData>): FishData {
  return {
    id: typeof entry.id === "number" ? entry.id : Date.now(),
    type: entry.type ?? "goldfish",
    name: typeof entry.name === "string" && entry.name.length ? entry.name : randomFishName(),
    x: typeof entry.x === "number" ? entry.x : 50,
    y: typeof entry.y === "number" ? entry.y : 50,
    hunger: typeof entry.hunger === "number" ? entry.hunger : 80,
    health: typeof entry.health === "number" ? entry.health : 100,
    boredom: typeof entry.boredom === "number" ? entry.boredom : 0,
    speed: typeof entry.speed === "number" ? entry.speed : 2,
    coinProgress:
      typeof entry.coinProgress === "number" ? entry.coinProgress : 0,
    careStreak: typeof entry.careStreak === "number" ? entry.careStreak : 0,
    personality:
      typeof entry.personality === "string" && entry.personality.length
        ? entry.personality
        : PERSONALITY_POOL[Math.floor(Math.random() * PERSONALITY_POOL.length)],
    genetics: entry.genetics ?? undefined,
    generation: typeof entry.generation === "number" ? entry.generation : undefined,
    parentIds: Array.isArray(entry.parentIds) ? entry.parentIds as [number, number] : undefined,
    sicklyWatchUntil: typeof entry.sicklyWatchUntil === "number" ? entry.sicklyWatchUntil : undefined,
    // Default: place fish at start of adulthood so existing saves don't start as tiny juveniles
    bornAt: typeof entry.bornAt === "number"
      ? entry.bornAt
      : Date.now() - Math.round(FISH_LIFESPAN_BASE_MS * LIFE_STAGE_JUVENILE_END),
  };
}

function collectorStats(level: number) {
  return (
    COIN_COLLECTOR_LEVELS.find((entry) => entry.level === level) ||
    COIN_COLLECTOR_LEVELS[0]
  );
}

export const useGameStore = defineStore("game", () => {
  const coins = ref(5000);
  const fish = ref<FishData[]>([
    normalizeFish({ id: 1, type: "goldfish", name: "Goldie", x: 20, y: 50, hunger: 80, speed: 2, coinProgress: 0, careStreak: 0 }),
    normalizeFish({ id: 2, type: "angelfish", name: "Marina", x: 60, y: 30, hunger: 60, speed: 1.5, coinProgress: 0, careStreak: 0 }),
    normalizeFish({ id: 3, type: "neon", name: "Bubbles", x: 80, y: 70, hunger: 90, speed: 3, coinProgress: 0, careStreak: 0 }),
  ]);
  const lastSaveTime = ref(Date.now());
  const autoFeeder = reactive<AutoFeeder>({ ...DEFAULT_AUTO_FEEDER });
  const tools = reactive<Tools>({ ...DEFAULT_TOOLS });
  const selectedTool = ref<ToolType>("flake");
  const feedingFishId = ref<number | null>(null);
  const hasEverFed = ref(false);
  const hasEverCollected = ref(false);
  const pendingDeaths = ref<{ id: number; name: string; type: string }[]>([]);
  const pendingOfflineReward = ref(0);
  const pendingStorageWarning = ref(false);
  const pendingStreakPop = ref<{ fishId: number; fishName: string; streak: number } | null>(null);
  const purchasedExpansions = ref<string[]>([]);
  const tankCapacity = computed(() => {
    const extraSlots = TANK_EXPANSION_ITEMS
      .filter((item) => purchasedExpansions.value.includes(item.id))
      .reduce((sum, item) => sum + item.slots, 0);
    return TANK_CAPACITY_BASE + extraSlots;
  });
  const background = ref(DEFAULT_BACKGROUND);
  const coinDrops = ref<CoinDrop[]>([]);
  const lastMaintenanceTick = ref(Date.now());
  const coinCollector = reactive<CoinCollectorState>({
    ...DEFAULT_COIN_COLLECTOR,
  });
  const upgrades = reactive<UpgradesState>({ ...DEFAULT_UPGRADES });
  const netIncomeHistory = ref<number[]>([]);
  const activeBoosts = ref<ActiveBoost[]>(
    DEFAULT_BOOSTS.map((boost) => ({ ...boost })) as ActiveBoost[]
  );

  const unlockedAchievements = ref<string[]>([]);
  const totalCoinsCollected = ref(0);
  const totalFeedCount = ref(0);
  const maxCareStreakEver = ref(0);
  const dailyState = ref<DailyState>({
    date: new Date().toISOString().slice(0, 10),
    loginStreak: 1,
    bonusClaimed: false,
    missions: generateDailyMissions(),
    feedCount: 0,
    coinsCollected: 0,
    dropsCollected: 0,
  });
  const pendingAchievementUnlocks = ref<string[]>([]);
  const pendingDailyBonus = ref(0);
  const visitor = ref<VisitorState | null>(null);

  // Fish positions written by AquariumDisplay; accessed here only for coin drop origins.
  const livePositions = useDisplayPositions();
  const visitorSpawnAfterMs = ref(0);
  const visitorSessionStartMs = ref(0);
  const lastVisitorDate = ref("");
  const pendingVisitorArrival = ref(false);
  const prestigeLevel = ref(0);

  // Breeding / Incubator state
  const incubator = reactive<IncubatorState>({ ...DEFAULT_INCUBATOR });
  const pendingBreedingResult = ref<{ success: boolean; baby?: FishData; deathReason?: string } | null>(null);

  // Fish Market state
  const market = reactive<{ pool: MarketFish[]; lastRefresh: number }>({ pool: [], lastRefresh: 0 });
  const listedFish = ref<ListedFish[]>([]);

  const backgroundEffect = computed(() => BACKGROUND_EFFECTS[background.value] ?? null);

  const hungerDecayPerTick = computed(() => {
    const bgMod = backgroundEffect.value?.hungerDecayMod ?? 0;
    return Math.max(
      MIN_HUNGER_DECAY,
      BASE_HUNGER_DECAY - (upgrades.gourmetFeed ? GOURMET_DECAY_REDUCTION : 0) - bgMod
    );
  });
  const feedBonus = computed(() =>
    upgrades.gourmetFeed ? GOURMET_FEED_BONUS : 0
  );
  const dropLifetimeMs = computed(
    () =>
      BASE_DROP_LIFETIME +
      (upgrades.clarityFilters ? 4_000 : 0) +
      (backgroundEffect.value?.dropLifetimeBonus ?? 0)
  );

  const coinMultiplier = computed(() => {
    let multiplier = 1;
    if (upgrades.luxeDecor) multiplier *= 1.15;
    multiplier *= 1 + prestigeLevel.value * PRESTIGE_COIN_BONUS_PER_LEVEL;
    activeBoosts.value.forEach((boost) => {
      multiplier *= boost.multiplier;
    });
    return multiplier;
  });

  const canPrestige = computed(
    () => fish.value.length >= PRESTIGE_MIN_FISH && coins.value >= PRESTIGE_MIN_COINS
  );

  const averageHunger = computed(() =>
    fish.value.length
      ? Math.round(
          fish.value.reduce((sum, entry) => sum + entry.hunger, 0) /
            fish.value.length
        )
      : 0
  );

  const showHowTo = computed(() => !hasEverFed.value);

  function load() {
    if (!process.client) return;
    const saved = localStorage.getItem("aquarium-game");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Partial<GameState>;
      const now = Date.now();
      const lastSave =
        typeof parsed.lastSaveTime === "number" ? parsed.lastSaveTime : now;

      const resolvedAutoFeeder = resolveAutoFeeder(parsed.autoFeeder);
      const resolvedTools = resolveTools(parsed.tools);
      const resolvedSelectedTool: ToolType =
        parsed.selectedTool === "spoon" && resolvedTools.spoonOwned
          ? "spoon"
          : "flake";
      const resolvedHasEverFed = Boolean(parsed.hasEverFed);
      const resolvedHasEverCollected = Boolean(parsed.hasEverCollected);
      const needsMigration = (parsed.saveVersion ?? 1) < CURRENT_SAVE_VERSION;
      const resolvedBackground = normalizeBackgroundPath(parsed.background, needsMigration);
      const resolvedCollector = resolveCoinCollector(parsed.coinCollector);
      const resolvedUpgrades = resolveUpgrades(parsed.upgrades);
      const resolvedBoosts = resolveActiveBoosts(parsed.activeBoosts);

      let resolvedCoins =
        typeof parsed.coins === "number" ? parsed.coins : coins.value;
      const resolvedFish =
        Array.isArray(parsed.fish) && parsed.fish.length
          ? parsed.fish
          : fish.value;

      const offlineTime = Math.min(Math.max(0, now - lastSave), OFFLINE_MAX_MS);
      const intervals = Math.floor(offlineTime / OFFLINE_INTERVAL_MS);
      if (intervals > 0) {
        let offlineCoins = 0;
        resolvedFish.forEach((entry) => {
          offlineCoins += coinRateFor(entry.type) * intervals * 0.25;
        });
        const earned = Math.floor(offlineCoins);
        resolvedCoins += earned;
        if (offlineTime > 5 * 60 * 1000 && earned > 0) {
          pendingOfflineReward.value = earned;
        }
      }

      const offlineMaintIntervals = Math.floor(offlineTime / MAINTENANCE_INTERVAL_MS);
      if (offlineMaintIntervals > 0 && resolvedFish.length > 0) {
        const maintCost = calculateMaintenance(resolvedFish, resolvedUpgrades);
        const offlineMaint = Math.floor(maintCost * offlineMaintIntervals * 0.25);
        resolvedCoins = Math.max(MAINTENANCE_GRACE_LIMIT, resolvedCoins - offlineMaint);
      }

      coins.value = resolvedCoins;
      fish.value = resolvedFish.map((entry) => normalizeFish(entry));
      lastSaveTime.value = now;
      Object.assign(autoFeeder, resolvedAutoFeeder);
      Object.assign(tools, resolvedTools);
      Object.assign(coinCollector, resolvedCollector);
      Object.assign(upgrades, resolvedUpgrades);
      activeBoosts.value = resolvedBoosts;
      netIncomeHistory.value = Array.isArray(parsed.netIncomeHistory)
        ? parsed.netIncomeHistory.filter((n) => typeof n === "number").slice(-30)
        : [];
      coinDrops.value = [];
      selectedTool.value = resolvedSelectedTool;
      hasEverFed.value = resolvedHasEverFed;
      hasEverCollected.value = resolvedHasEverCollected;
      background.value = resolvedBackground;
      lastMaintenanceTick.value =
        typeof parsed.lastMaintenanceTick === "number"
          ? parsed.lastMaintenanceTick
          : now;
      purchasedExpansions.value = Array.isArray(parsed.purchasedExpansions)
        ? parsed.purchasedExpansions.filter((id) => typeof id === "string")
        : [];

      // ── Achievements & stats ────────────────────────────────────────────────
      unlockedAchievements.value = Array.isArray(parsed.unlockedAchievements)
        ? (parsed.unlockedAchievements as unknown[]).filter((id): id is string => typeof id === "string")
        : [];
      totalCoinsCollected.value = typeof parsed.totalCoinsCollected === "number" ? parsed.totalCoinsCollected : 0;
      totalFeedCount.value = typeof parsed.totalFeedCount === "number" ? parsed.totalFeedCount : 0;
      maxCareStreakEver.value = typeof parsed.maxCareStreakEver === "number" ? parsed.maxCareStreakEver : 0;

      // ── Daily state ─────────────────────────────────────────────────────────
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();
      const savedDaily = parsed.dailyState as Partial<DailyState> | undefined;

      if (!savedDaily?.date) {
        // First ever load — welcome bonus
        dailyState.value = { date: today, loginStreak: 1, bonusClaimed: true, missions: generateDailyMissions(), feedCount: 0, coinsCollected: 0, dropsCollected: 0 };
        const bonus = LOGIN_BONUS_BASE;
        resolvedCoins += bonus;
        pendingDailyBonus.value = bonus;
      } else if (savedDaily.date === today) {
        // Same day — restore as-is
        dailyState.value = {
          date: today,
          loginStreak: savedDaily.loginStreak ?? 1,
          bonusClaimed: savedDaily.bonusClaimed ?? false,
          missions: Array.isArray(savedDaily.missions)
            ? savedDaily.missions.map((m) => ({ id: m.id, progress: m.progress ?? 0, claimed: m.claimed ?? false }))
            : generateDailyMissions(),
          feedCount: savedDaily.feedCount ?? 0,
          coinsCollected: savedDaily.coinsCollected ?? 0,
          dropsCollected: savedDaily.dropsCollected ?? 0,
        };
      } else {
        // New day — streak and bonus
        const prevStreak = savedDaily.loginStreak ?? 0;
        const newStreak = savedDaily.date === yesterday ? prevStreak + 1 : 1;
        const bonus = Math.min(100, LOGIN_BONUS_BASE + Math.floor((newStreak - 1) / 3) * 10);
        dailyState.value = { date: today, loginStreak: newStreak, bonusClaimed: true, missions: generateDailyMissions(), feedCount: 0, coinsCollected: 0, dropsCollected: 0 };
        resolvedCoins += bonus;
        pendingDailyBonus.value = bonus;
      }
      coins.value = resolvedCoins;

      // ── Visitor & prestige ───────────────────────────────────────────────────
      lastVisitorDate.value = typeof parsed.lastVisitorDate === "string" ? parsed.lastVisitorDate : "";
      prestigeLevel.value = typeof parsed.prestigeLevel === "number" ? Math.max(0, parsed.prestigeLevel) : 0;
      // Schedule visitor spawn for this session
      visitorSessionStartMs.value = now;
      visitorSpawnAfterMs.value =
        VISITOR_SPAWN_DELAY_MIN_MS +
        Math.random() * (VISITOR_SPAWN_DELAY_MAX_MS - VISITOR_SPAWN_DELAY_MIN_MS);
      visitor.value = null; // don't persist visitors across sessions

      // ── Incubator / Breeding ─────────────────────────────────────────────────
      const savedIncubator = parsed.incubator as Partial<IncubatorState> | undefined;
      if (savedIncubator) {
        incubator.owned = Boolean(savedIncubator.owned);
        incubator.lastBreedTime = typeof savedIncubator.lastBreedTime === "number" ? savedIncubator.lastBreedTime : 0;
        incubator.breeding = savedIncubator.breeding ?? null;
        incubator.queuedBaby = savedIncubator.queuedBaby ?? null;
      }

      // ── Fish Market ───────────────────────────────────────────────────────────
      const savedMarket = parsed.market;
      if (savedMarket) {
        market.pool = Array.isArray(savedMarket.pool) ? savedMarket.pool : [];
        market.lastRefresh = typeof savedMarket.lastRefresh === "number" ? savedMarket.lastRefresh : 0;
      }
      const savedListings = parsed.listedFish;
      if (Array.isArray(savedListings)) {
        const loadNow = Date.now();
        // Resolve any listings that expired while offline
        const expired = savedListings.filter(l => loadNow >= l.sellsByMs);
        if (expired.length) {
          coins.value += expired.reduce((sum, l) => sum + l.price, 0);
          const expiredIds = new Set(expired.map(l => l.fishId));
          fish.value = fish.value.filter(f => !expiredIds.has(f.id));
        }
        listedFish.value = savedListings.filter(l => loadNow < l.sellsByMs);
      }

      // Retroactively unlock state-based achievements on first load
      checkAchievements();

      // Seed monotonic counter above highest persisted id to avoid collisions
      const maxFishId = fish.value.reduce((m, f) => Math.max(m, f.id), 0);
      _nextId = Math.max(_nextId, maxFishId + 1);
    } catch (error) {
      console.warn("[game] Unable to read saved state", error);
    }

    window.addEventListener("pagehide", _flushSave);
  }

  let _saveTimer: ReturnType<typeof setTimeout> | null = null;

  function _flushSave() {
    if (!process.client) return;
    if (_saveTimer !== null) { clearTimeout(_saveTimer); _saveTimer = null; }
    const timestamp = Date.now();
    lastSaveTime.value = timestamp;
    const payload: GameState = {
      saveVersion: CURRENT_SAVE_VERSION,
      coins: coins.value,
      fish: fish.value.map((entry) => ({ ...entry })),
      lastSaveTime: timestamp,
      autoFeeder: { ...autoFeeder },
      tools: { ...tools },
      selectedTool: selectedTool.value,
      feedingFishId: feedingFishId.value,
      hasEverFed: hasEverFed.value,
      hasEverCollected: hasEverCollected.value,
      background: background.value,
      coinCollector: { ...coinCollector },
      upgrades: { ...upgrades },
      activeBoosts: [...activeBoosts.value],
      lastMaintenanceTick: lastMaintenanceTick.value,
      purchasedExpansions: [...purchasedExpansions.value],
      unlockedAchievements: [...unlockedAchievements.value],
      totalCoinsCollected: totalCoinsCollected.value,
      totalFeedCount: totalFeedCount.value,
      maxCareStreakEver: maxCareStreakEver.value,
      dailyState: {
        ...dailyState.value,
        missions: dailyState.value.missions.map((m) => ({ ...m })),
      },
      lastVisitorDate: lastVisitorDate.value,
      prestigeLevel: prestigeLevel.value,
      netIncomeHistory: [...netIncomeHistory.value],
      incubator: {
        owned: incubator.owned,
        breeding: incubator.breeding ? { ...incubator.breeding } : null,
        lastBreedTime: incubator.lastBreedTime,
        queuedBaby: incubator.queuedBaby ? { ...incubator.queuedBaby } : null,
      },
      market: { pool: market.pool.map(m => ({ ...m })), lastRefresh: market.lastRefresh },
      listedFish: listedFish.value.map(l => ({ ...l })),
    } satisfies GameState;
    try {
      localStorage.setItem("aquarium-game", JSON.stringify(payload));
    } catch (e) {
      if (e instanceof DOMException && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED")) {
        pendingStorageWarning.value = true;
      }
    }
  }

  function save() {
    if (!process.client) return;
    if (_saveTimer !== null) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(_flushSave, 1000);
  }

  const { updateMissionProgress, claimMission } = setupDailyMissions({ dailyState, coins, save });

  const {
    canBreed, buyIncubator, startBreeding, cancelBreeding, getBreedingProgress,
    checkIncubation, spawnQueuedBaby, getEligibleBreedingPartners, clearBreedingResult,
  } = setupBreeding({ incubator, pendingBreedingResult, fish, coins, tankCapacity, normalizeFish, nextId, save });

  const {
    getMarketPool, buyMarketFish, listFishForSale, cancelListing,
    sellFishNow, checkListings, isListed, getListingFor,
  } = setupFishMarket({
    market, listedFish, fish, coins, totalCoinsCollected,
    tankCapacity, purchasedExpansions, normalizeFish, nextId,
    removeFish: (id: number) => removeFish(id),
    save,
  });

  const { checkAchievements, shiftAchievementUnlock: _shiftAchievement } = setupAchievements({
    fish, upgrades, autoFeeder, purchasedExpansions, tankCapacity,
    totalCoinsCollected, maxCareStreakEver, totalFeedCount,
    unlockedAchievements, pendingAchievementUnlocks,
  });

  function shiftAchievementUnlock(): string | null {
    return _shiftAchievement();
  }

  function clearDailyBonus() {
    pendingDailyBonus.value = 0;
  }

  function feedVisitor(): number {
    if (!visitor.value || visitor.value.fed) return 0;
    const reward = visitor.value.reward;
    visitor.value.fed = true;
    visitor.value.expiresAt = Date.now() + 4000; // linger briefly after feeding
    coins.value += reward;
    save();
    return reward;
  }

  function buyMedicine(): boolean {
    if (coins.value < MEDICINE_COST || !fish.value.length) return false;
    coins.value -= MEDICINE_COST;
    fish.value = fish.value.map((f) => ({
      ...f,
      health: Math.min(100, f.health + MEDICINE_HEAL_AMOUNT),
    }));
    save();
    return true;
  }

  function doPrestige(): boolean {
    if (!canPrestige.value) return false;
    prestigeLevel.value++;
    fish.value = [];
    coinDrops.value = [];
    coins.value = PRESTIGE_START_COINS + (prestigeLevel.value - 1) * PRESTIGE_START_BONUS;
    save();
    return true;
  }

  function clearVisitorArrival() {
    pendingVisitorArrival.value = false;
  }

  // ── Breeding — see composables/useBreeding.ts ────────────────────────────────

  function chargeFlake() {
    coins.value = Math.max(MAINTENANCE_GRACE_LIMIT, coins.value - FLAKE_COST);
  }

  function feedFish(id: number, amount = FEED_AMOUNT) {
    const targetFish = fish.value.find((entry) => entry.id === id);
    if (!targetFish) return;

    const boost = feedBonus.value;
    const prevHunger = targetFish.hunger;
    targetFish.hunger = Math.min(100, targetFish.hunger + amount + boost);
    targetFish.boredom = clamp(targetFish.boredom - BOREDOM_FEED_BONUS, 0, 100);
    if (targetFish.hunger >= HAPPY_THRESHOLD && prevHunger < HAPPY_THRESHOLD) {
      targetFish.careStreak = clamp(
        targetFish.careStreak + 1,
        0,
        CARE_STREAK_MAX
      );
      spawnCoinDrop(targetFish, 2 + targetFish.careStreak, "care");
      pendingStreakPop.value = {
        fishId: targetFish.id,
        fishName: targetFish.name,
        streak: targetFish.careStreak,
      };
      if (targetFish.careStreak > maxCareStreakEver.value) {
        maxCareStreakEver.value = targetFish.careStreak;
      }
    }
    feedingFishId.value = id;
    hasEverFed.value = true;
    totalFeedCount.value++;
    dailyState.value.feedCount++;
    updateMissionProgress("feed", dailyState.value.feedCount);

    setTimeout(() => {
      if (feedingFishId.value === id) feedingFishId.value = null;
    }, 800);

    save();
  }

  function playWithFish(id: number) {
    const targetFish = fish.value.find((entry) => entry.id === id);
    if (!targetFish) return;
    targetFish.boredom = clamp(targetFish.boredom - 20, 0, 100);
    feedingFishId.value = id;
    setTimeout(() => {
      if (feedingFishId.value === id) feedingFishId.value = null;
    }, 600);
    save();
  }

  function removeFish(id: number) {
    fish.value = fish.value.filter((entry) => entry.id !== id);
    save();
  }

  // ── Fish Market — see composables/useFishMarket.ts ──────────────────────────

  function buyFish(type: string, cost: number) {
    if (coins.value < cost) return;
    if (fish.value.length >= tankCapacity.value) return;
    const id = nextId();
    coins.value -= cost;
    fish.value.push(
      normalizeFish({
        id,
        type,
        name: randomFishName(fish.value.map((f) => f.name)),
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        hunger: 100,
        speed: Math.random() * 2 + 1,
        bornAt: Date.now(),
      })
    );
    save();
  }

  function buyTankExpansion(id: string, cost: number, slots: number) {
    if (coins.value < cost) return false;
    if (purchasedExpansions.value.includes(id)) return false;
    coins.value -= cost;
    purchasedExpansions.value = [...purchasedExpansions.value, id];
    save();
    return true;
  }

  function clearPendingDeaths() {
    pendingDeaths.value = [];
  }

  function clearOfflineReward() {
    pendingOfflineReward.value = 0;
  }

  function clearStorageWarning() {
    pendingStorageWarning.value = false;
  }

  function clearStreakPop() {
    pendingStreakPop.value = null;
  }

  function collectAll() {
    pruneCoinDrops();
    const dropCountBefore = coinDrops.value.length;
    const total = collectDrops(Infinity);
    if (total > 0) {
      if (!hasEverCollected.value) hasEverCollected.value = true;
      totalCoinsCollected.value += total;
      dailyState.value.coinsCollected += total;
      dailyState.value.dropsCollected += dropCountBefore;
      updateMissionProgress("collect-coins", dailyState.value.coinsCollected);
      updateMissionProgress("collect-drops", dailyState.value.dropsCollected);
      save();
    }
    return total;
  }

  function dropTypeFor(value: number): CoinDropType {
    if (value >= 1000) return "crown";
    if (value >= 500) return "chest";
    if (value >= 250) return "gold-bar";
    if (value >= 100) return "silver-bar";
    if (value >= 50) return "bundle";
    if (value >= 20) return "note";
    if (value >= 10) return "gold";
    if (value >= 5) return "silver";
    return "copper";
  }

  function pruneCoinDrops(now = Date.now()) {
    const before = coinDrops.value.length;
    if (!before) return;
    const filtered = coinDrops.value.filter((drop) => drop.expiresAt > now);
    if (filtered.length !== before) coinDrops.value = filtered;
  }

  function spawnCoinDrop(
    origin: Pick<FishData, "id" | "x" | "y">,
    amount: number,
    source: CoinDrop["source"],
    qualityFactor = 1.0
  ) {
    const now = Date.now();
    pruneCoinDrops(now);
    const adjusted = Math.max(1, Math.round(amount * coinMultiplier.value));
    const jitterX = (Math.random() - 0.5) * 12;
    const jitterY = (Math.random() - 0.5) * 10;
    const spawnY = clamp(origin.y + jitterY, 12, 85);
    const landingY = Math.min(
      DROP_FLOOR_Y,
      Math.max(spawnY, DROP_FLOOR_Y - Math.random() * 4)
    );
    const fallDistance = Math.max(0, landingY - spawnY);
    const drop: CoinDrop = {
      id: nextId(),
      value: adjusted,
      x: clamp(origin.x + jitterX, 6, 94),
      y: landingY,
      spawnY,
      fallDurationMs: Math.round(
        DROP_FALL_DURATION_MIN + fallDistance * DROP_FALL_DURATION_PER_PCT
      ),
      fishId: typeof origin.id === "number" ? origin.id : null,
      type: dropTypeFor(adjusted * qualityFactor),
      createdAt: now,
      expiresAt: now + dropLifetimeMs.value,
      source,
    };
    coinDrops.value.push(drop);
    if (coinDrops.value.length > DROP_MAX) {
      coinDrops.value.splice(0, coinDrops.value.length - DROP_MAX);
    }
  }

  function scheduleCoinDrop(
    origin: Pick<FishData, "id" | "x" | "y">,
    amount: number,
    source: CoinDrop["source"],
    qualityFactor = 1.0
  ) {
    if (!process.client) {
      spawnCoinDrop(origin, amount, source, qualityFactor);
      return;
    }
    const jitterFactor = Math.random();
    const delay = Math.round(jitterFactor * OFFLINE_INTERVAL_MS);
    const timer = window.setTimeout(() => {
      dropTimers.delete(timer);
      spawnCoinDrop(origin, amount, source, qualityFactor);
    }, delay);
    dropTimers.add(timer);
  }

  function collectDrops(limit = Infinity, now = Date.now()) {
    pruneCoinDrops(now);
    if (!coinDrops.value.length) return 0;
    const sorted = [...coinDrops.value].sort((a, b) => b.value - a.value);
    const toCollect = sorted.slice(0, Math.min(sorted.length, limit));
    if (!toCollect.length) return 0;
    const collectedIds = new Set(toCollect.map((drop) => drop.id));
    const remaining = coinDrops.value.filter(
      (drop) => !collectedIds.has(drop.id)
    );
    coinDrops.value = remaining;
    const total = toCollect.reduce((sum, drop) => sum + drop.value, 0);
    coins.value = Math.round((coins.value + total) * 100) / 100;
    return total;
  }

  function collectCoinDrop(id: number) {
    pruneCoinDrops();
    const index = coinDrops.value.findIndex((drop) => drop.id === id);
    if (index === -1) return;
    const [drop] = coinDrops.value.splice(index, 1);
    coins.value = Math.round((coins.value + drop.value) * 100) / 100;
    if (!hasEverCollected.value) hasEverCollected.value = true;
    totalCoinsCollected.value += drop.value;
    dailyState.value.coinsCollected += drop.value;
    dailyState.value.dropsCollected++;
    updateMissionProgress("collect-coins", dailyState.value.coinsCollected);
    updateMissionProgress("collect-drops", dailyState.value.dropsCollected);
    save();
  }

  function collectorCooldown(level = coinCollector.level) {
    return collectorStats(level).cooldown;
  }

  function collectorCapacity(level = coinCollector.level) {
    return collectorStats(level).capacity;
  }

  function maybeAutoCollect(now: number) {
    if (coinCollector.level <= 0) return;
    const cooldown = collectorCooldown();
    if (!Number.isFinite(cooldown)) return;
    if (now - coinCollector.lastSweep < cooldown) return;
    const total = collectDrops(collectorCapacity(), now);
    if (total > 0) {
      coinCollector.lastSweep = now;
      save();
    }
  }

  function isCollectorReady() {
    if (coinCollector.level <= 0) return false;
    const cooldown = collectorCooldown();
    if (!Number.isFinite(cooldown)) return false;
    return Date.now() - coinCollector.lastSweep >= cooldown;
  }

  function manualCollectorSweep() {
    if (!isCollectorReady()) return false;
    const total = collectDrops(collectorCapacity());
    if (total > 0) {
      coinCollector.lastSweep = Date.now();
      save();
      return true;
    }
    return false;
  }

  function buyCoinCollectorUpgrade() {
    const next = nextCollectorLevel(coinCollector.level);
    if (!next) return false;
    if (coins.value < next.cost) return false;
    coins.value -= next.cost;
    coinCollector.level = next.level;
    coinCollector.lastSweep = Date.now();
    save();
    return true;
  }

  function buyUpgrade(id: keyof UpgradesState, cost: number) {
    if (upgrades[id]) return false;
    if (coins.value < cost) return false;
    coins.value -= cost;
    upgrades[id] = true;
    save();
    return true;
  }

  function isBoostActive(id: string) {
    const now = Date.now();
    return activeBoosts.value.some(
      (boost) => boost.id === id && boost.expiresAt > now
    );
  }

  function activateBoost(id: string, cost: number) {
    const def = BOOST_DEFINITIONS[id];
    if (!def) return false;
    const now = Date.now();
    if (isBoostActive(id)) return false;
    if (coins.value < cost) return false;
    coins.value -= cost;
    activeBoosts.value = [
      ...activeBoosts.value.filter((boost) => boost.expiresAt > now),
      {
        id,
        label: def.label,
        expiresAt: now + def.durationMs,
        multiplier: def.multiplier,
      },
    ];
    save();
    return true;
  }

  function buySpoon(cost: number) {
    if (coins.value < cost || tools.spoonOwned) return;
    coins.value -= cost;
    tools.spoonOwned = true;
    selectedTool.value = "spoon";
    save();
  }

  function buyAutoFeeder(cost: number) {
    if (coins.value < cost || autoFeeder.owned) return;
    coins.value -= cost;
    autoFeeder.owned = true;
    autoFeeder.active = true;
    autoFeeder.lastFeedTime = Date.now();
    save();
  }

  function toggleAutoFeeder() {
    if (!autoFeeder.owned) return;
    autoFeeder.active = !autoFeeder.active;
    if (autoFeeder.active) {
      autoFeeder.lastFeedTime = Date.now();
    }
    save();
  }

  function selectTool(tool: ToolType) {
    if (tool === "spoon" && !tools.spoonOwned) return;
    selectedTool.value = tool;
    save();
  }

  function setBackground(image: string) {
    background.value = normalizeBackgroundPath(image);
    save();
  }

  function tick() {
    const now = Date.now();
    pruneCoinDrops(now);
    const active = activeBoosts.value.filter((boost) => boost.expiresAt > now);
    if (active.length !== activeBoosts.value.length) {
      activeBoosts.value = active;
    }

    const dropsToSpawn: {
      origin: Pick<FishData, "id" | "x" | "y">;
      amount: number;
      qualityFactor: number;
    }[] = [];
    const dyingIds = new Set<number>();

    const defaultBornAt = now - Math.round(FISH_LIFESPAN_BASE_MS * LIFE_STAGE_JUVENILE_END);
    const friendCountCapped = Math.min(2, fish.value.length - 1);

    fish.value.forEach((entry) => {
      const live = livePositions.get(entry.id);
      const origin = { id: entry.id, x: live?.x ?? entry.x, y: live?.y ?? entry.y };
      const hungerLoss = hungerDecayPerTick.value;
      const nextHunger = Math.max(0, entry.hunger - hungerLoss);
      let careStreak = entry.careStreak;
      if (nextHunger < CARE_THRESHOLD) {
        careStreak = 0;
      }

      // Health
      let healthDelta = 0;
      if (nextHunger < CARE_THRESHOLD) {
        healthDelta = -HEALTH_DECAY_RATE * (1 - nextHunger / CARE_THRESHOLD);
      } else if (nextHunger >= HAPPY_THRESHOLD) {
        healthDelta = HEALTH_REGEN_RATE;
      }
      const nextHealth = clamp(entry.health + healthDelta, 0, 100);

      // Boredom — floored at 20% of base rate to prevent permanent nullification
      const personalityMod = entry.personality
        ? (PERSONALITY_PROFILES[entry.personality as PersonalityType]?.boredomMod ?? 1.0)
        : 1.0;
      const boredNet = BOREDOM_BASE_RATE - friendCountCapped * BOREDOM_FRIEND_REDUCTION;
      const boredRate = Math.max(BOREDOM_BASE_RATE * 0.2, boredNet) * personalityMod;
      const nextBoredom = clamp(entry.boredom + boredRate, 0, 100);

      // Coins (with background ecosystem bonus)
      let progress = entry.coinProgress;
      if (nextHunger >= CARE_THRESHOLD) {
        const baseRate = coinRateFor(entry.type);
        const hungerMultiplier =
          nextHunger >= HAPPY_THRESHOLD ? 1.35 : 0.75 + nextHunger / 200;
        const streakBonus = 1 + careStreak * 0.12;
        const boredMult = nextBoredom > BOREDOM_HIGH_THRESHOLD ? 0.7 : nextBoredom > 50 ? 0.85 : 1.0;
        const healthMult = nextHealth < HEALTH_LOW_THRESHOLD ? Math.max(0, nextHealth / HEALTH_LOW_THRESHOLD) : 1.0;
        const bgFx = backgroundEffect.value;
        const bgMult = bgFx?.coinMult
          ? (!bgFx.fishType || bgFx.fishType === entry.type ? bgFx.coinMult : 1.0)
          : 1.0;
        progress += baseRate * hungerMultiplier * streakBonus * boredMult * healthMult * bgMult;
      }

      const payout = Math.floor(progress);
      progress -= payout;
      if (payout > 0) {
        const ageRatio  = fishAgeRatio(entry.bornAt ?? defaultBornAt, entry.type, entry.genetics);
        const lifeStage = fishLifeStage(ageRatio);
        // Age scales the economic value — adults are genuinely worth more
        const stageMult = lifeStage === "juvenile" ? 1.0 : lifeStage === "adult" ? 5.0 : 2.5;
        // Mood + health boost the visual tier (on top of the scaled value)
        const moodMult = nextHunger >= HAPPY_THRESHOLD ? 2.0 : 1.0;
        const hpMult   = nextHealth >= HEALTH_HIGH_THRESHOLD ? 1.5
                       : nextHealth <  HEALTH_LOW_THRESHOLD  ? 0.5
                       : 1.0;
        dropsToSpawn.push({
          origin,
          amount: Math.max(1, Math.round(payout * stageMult)),
          qualityFactor: moodMult * hpMult,
        });
      }

      // Mutate in place
      entry.hunger = nextHunger;
      entry.health = nextHealth;
      entry.boredom = nextBoredom;
      entry.careStreak = careStreak;
      entry.coinProgress = progress;

      // Collect dying fish ids
      if (nextHealth <= 0) {
        dyingIds.add(entry.id);
        pendingDeaths.value.push({ id: entry.id, name: entry.name, type: entry.type });
      } else if ((now - (entry.bornAt ?? defaultBornAt)) >= fishLifespan(entry.type, entry.genetics)) {
        dyingIds.add(entry.id);
        pendingDeaths.value.push({ id: entry.id, name: entry.name, type: entry.type });
      }
    });

    if (dyingIds.size) {
      fish.value = fish.value.filter((entry) => !dyingIds.has(entry.id));
    }

    dropsToSpawn.forEach(({ origin, amount, qualityFactor }) =>
      scheduleCoinDrop(origin, amount, "baseline", qualityFactor)
    );

    if (autoFeeder.owned && autoFeeder.active) {
      if (now - autoFeeder.lastFeedTime >= autoFeeder.feedInterval) {
        const hungryCount = fish.value.filter((e) => e.hunger < HAPPY_THRESHOLD).length;
        fish.value = fish.value.map((entry) => ({
          ...entry,
          hunger:
            entry.hunger < HAPPY_THRESHOLD
              ? Math.min(
                  100,
                  entry.hunger + AUTO_FEEDER_FEED_AMOUNT + feedBonus.value
                )
              : entry.hunger,
          boredom: clamp(entry.boredom - BOREDOM_FEED_BONUS, 0, 100),
        }));
        if (hungryCount > 0) {
          coins.value = Math.max(
            MAINTENANCE_GRACE_LIMIT,
            coins.value - AUTO_FEEDER_COST_PER_USE
          );
        }
        autoFeeder.lastFeedTime = now;
      }
    }

    if (now - lastMaintenanceTick.value >= MAINTENANCE_INTERVAL_MS) {
      const cost = calculateMaintenance(fish.value, upgrades);
      coins.value = Math.max(MAINTENANCE_GRACE_LIMIT, coins.value - cost);
      lastMaintenanceTick.value = now;
      const incomePerMin = fish.value.reduce((sum, f) => sum + coinsPerMinuteFor(f.type), 0);
      const net = Math.round((incomePerMin - cost) * 10) / 10;
      const updated = [...netIncomeHistory.value, net];
      if (updated.length > 30) updated.splice(0, updated.length - 30);
      netIncomeHistory.value = updated;
    }

    // ── Visitor logic ───────────────────────────────────────────────────────
    const todayStr = new Date().toISOString().slice(0, 10);
    if (visitor.value) {
      if (now >= visitor.value.expiresAt) visitor.value = null;
    } else if (
      lastVisitorDate.value !== todayStr &&
      visitorSpawnAfterMs.value > 0 &&
      now - visitorSessionStartMs.value >= visitorSpawnAfterMs.value
    ) {
      const type = VISITOR_SPECIES[Math.floor(Math.random() * VISITOR_SPECIES.length)];
      const name = VISITOR_NAMES[Math.floor(Math.random() * VISITOR_NAMES.length)];
      visitor.value = {
        type,
        name,
        spawnedAt: now,
        expiresAt: now + VISITOR_DURATION_MS,
        fed: false,
        reward: VISITOR_REWARD_BASE + Math.floor(Math.random() * VISITOR_REWARD_BASE),
        y: 20 + Math.random() * 45,
      };
      lastVisitorDate.value = todayStr;
      pendingVisitorArrival.value = true;
    }

    // ── Market listing resolution ────────────────────────────────────────────
    checkListings();

    // ── Breeding / Incubation logic ─────────────────────────────────────────
    if (incubator.breeding) {
      const result = checkIncubation();
      if (result) {
        if (result.died) {
          pendingBreedingResult.value = { success: false, deathReason: result.deathReason };
        } else if (result.baby) {
          pendingBreedingResult.value = { success: true, baby: result.baby };
        }
      }
    }

    // Check for sickly fish early death
    const sicklyDying: FishData[] = [];
    fish.value.forEach((f) => {
      if (f.sicklyWatchUntil && now < f.sicklyWatchUntil) {
        // Roll for early death each tick (very low chance per tick, ~30% over 5 min)
        const ticksRemaining = (f.sicklyWatchUntil - now) / 5000;
        const deathChancePerTick = SICKLY_EARLY_DEATH_CHANCE / Math.max(1, ticksRemaining * 12);
        if (Math.random() < deathChancePerTick) {
          sicklyDying.push(f);
        }
      }
    });
    if (sicklyDying.length) {
      pendingDeaths.value = [
        ...pendingDeaths.value,
        ...sicklyDying.map((e) => ({ id: e.id, name: e.name, type: e.type })),
      ];
      fish.value = fish.value.filter((f) => !sicklyDying.some((s) => s.id === f.id));
    }

    // Spawn queued baby if space available
    if (incubator.queuedBaby && fish.value.length < tankCapacity.value) {
      const baby = spawnQueuedBaby();
      if (baby) {
        pendingBreedingResult.value = { success: true, baby };
      }
    }

    checkAchievements();
  }

  function resetGame() {
    if (!process.client) return;
    localStorage.removeItem("aquarium-game");
    window.location.reload();
  }

  // Load saved state synchronously so the very first render has correct data.
  // Runs during store construction, before any component mounts.
  load();

  return {
    coins,
    fish,
    lastSaveTime,
    lastMaintenanceTick,
    autoFeeder,
    tools,
    selectedTool,
    feedingFishId,
    hasEverFed,
    purchasedExpansions,
    tankCapacity,
    hasEverCollected,
    pendingDeaths,
    pendingOfflineReward,
    pendingStorageWarning,
    pendingStreakPop,
    background,
    coinDrops,
    coinCollector,
    upgrades,
    activeBoosts,
    netIncomeHistory,
    coinMultiplier,
    isCollectorReady,
    collectorCapacity,
    averageHunger,
    hungerDecayPerTick,
    showHowTo,
    load,
    save,
    resetGame,
    chargeFlake,
    feedFish,
    playWithFish,
    removeFish,
    sellFishNow,
    buyFish,
    buySpoon,
    buyAutoFeeder,
    toggleAutoFeeder,
    selectTool,
    setBackground,
    collectCoinDrop,
    manualCollectorSweep,
    buyCoinCollectorUpgrade,
    buyUpgrade,
    activateBoost,
    buyTankExpansion,
    clearPendingDeaths,
    clearOfflineReward,
    clearStorageWarning,
    clearStreakPop,
    collectAll,
    tick,
    unlockedAchievements,
    totalCoinsCollected,
    totalFeedCount,
    maxCareStreakEver,
    dailyState,
    pendingAchievementUnlocks,
    pendingDailyBonus,
    shiftAchievementUnlock,
    clearDailyBonus,
    claimMission,
    visitor,
    pendingVisitorArrival,
    prestigeLevel,
    canPrestige,
    backgroundEffect,
    feedVisitor,
    buyMedicine,
    doPrestige,
    clearVisitorArrival,
    // Breeding / Incubator
    incubator,
    pendingBreedingResult,
    buyIncubator,
    startBreeding,
    cancelBreeding,
    getBreedingProgress,
    canBreed,
    getEligibleBreedingPartners,
    clearBreedingResult,
    // Fish Market
    market,
    listedFish,
    getMarketPool,
    buyMarketFish,
    listFishForSale,
    cancelListing,
    isListed,
    getListingFor,
    fishMarketValue,
  };
});
