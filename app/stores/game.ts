import { defineStore } from "pinia";
import {
  coinRateFor,
  COIN_COLLECTOR_LEVELS,
  OFFLINE_INTERVAL_MS,
  OFFLINE_MAX_MS,
  nextCollectorLevel,
} from "~/utils/economy";

type ToolType = "flake" | "spoon";

interface FishData {
  id: number;
  type: string;
  x: number;
  y: number;
  hunger: number;
  speed: number;
  coinProgress: number;
  careStreak: number;
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

type CoinDropType = "coin" | "stack" | "bill";

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
  coins: number;
  fish: FishData[];
  lastSaveTime: number;
  autoFeeder: AutoFeeder;
  tools: Tools;
  selectedTool: ToolType;
  feedingFishId: number | null;
  hasEverFed: boolean;
  background: string;
  coinCollector: CoinCollectorState;
  upgrades: UpgradesState;
  decorations: string[];
  activeBoosts: ActiveBoost[];
}

const DEFAULT_AUTO_FEEDER: AutoFeeder = {
  owned: false,
  active: false,
  lastFeedTime: 0,
  feedInterval: 30_000,
};

const DEFAULT_TOOLS: Tools = { spoonOwned: false };
const DEFAULT_COIN_COLLECTOR: CoinCollectorState = { level: 0, lastSweep: 0 };
const DEFAULT_UPGRADES: UpgradesState = {
  gourmetFeed: false,
  luxeDecor: false,
  clarityFilters: false,
};
const DEFAULT_DECORATIONS: string[] = [];
const DEFAULT_BOOSTS: ActiveBoost[] = [];

const dropTimers = new Set<number>();

const DROP_MAX = 36;
const DROP_FLOOR_Y = 94;
const DROP_FALL_DURATION_MIN = 20_000;
const DROP_FALL_DURATION_PER_PCT = 22;
const BASE_DROP_LIFETIME = 22_000;
const CARE_STREAK_MAX = 5;
const BASE_HUNGER_DECAY = 0.5;
const CARE_THRESHOLD = 60;
const HAPPY_THRESHOLD = 80;

const BOOST_DEFINITIONS: Record<
  string,
  { label: string; durationMs: number; multiplier: number }
> = {
  "treasure-frenzy": {
    label: "Treasure Frenzy",
    durationMs: 120_000,
    multiplier: 1.75,
  },
  "lunar-tide": {
    label: "Lunar Tide", // gentle bonus for long sessions
    durationMs: 300_000,
    multiplier: 1.35,
  },
};

function normalizeBackgroundPath(path: unknown): string {
  if (typeof path !== "string" || !path.length) return DEFAULT_BACKGROUND;
  let normalized = path;
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized.replace(/^\/?/, "")}`;
  }
  if (normalized.startsWith("/images/background-")) {
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

function resolveDecorations(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_DECORATIONS];
  return value
    .map((entry) => (typeof entry === "string" ? entry : ""))
    .filter(Boolean);
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeFish(entry: Partial<FishData>): FishData {
  return {
    id: typeof entry.id === "number" ? entry.id : Date.now(),
    type: entry.type ?? "goldfish",
    x: typeof entry.x === "number" ? entry.x : 50,
    y: typeof entry.y === "number" ? entry.y : 50,
    hunger: typeof entry.hunger === "number" ? entry.hunger : 80,
    speed: typeof entry.speed === "number" ? entry.speed : 2,
    coinProgress:
      typeof entry.coinProgress === "number" ? entry.coinProgress : 0,
    careStreak: typeof entry.careStreak === "number" ? entry.careStreak : 0,
  };
}

function collectorStats(level: number) {
  return (
    COIN_COLLECTOR_LEVELS.find((entry) => entry.level === level) ||
    COIN_COLLECTOR_LEVELS[0]
  );
}

export const useGameStore = defineStore("game", () => {
  const coins = ref(1000);
  const fish = ref<FishData[]>([
    normalizeFish({
      id: 1,
      type: "goldfish",
      x: 20,
      y: 50,
      hunger: 80,
      speed: 2,
      coinProgress: 0,
      careStreak: 0,
    }),
    normalizeFish({
      id: 2,
      type: "angelfish",
      x: 60,
      y: 30,
      hunger: 60,
      speed: 1.5,
      coinProgress: 0,
      careStreak: 0,
    }),
    normalizeFish({
      id: 3,
      type: "neon",
      x: 80,
      y: 70,
      hunger: 90,
      speed: 3,
      coinProgress: 0,
      careStreak: 0,
    }),
  ]);
  const lastSaveTime = ref(Date.now());
  const autoFeeder = reactive<AutoFeeder>({ ...DEFAULT_AUTO_FEEDER });
  const tools = reactive<Tools>({ ...DEFAULT_TOOLS });
  const selectedTool = ref<ToolType>("flake");
  const feedingFishId = ref<number | null>(null);
  const hasEverFed = ref(false);
  const background = ref(DEFAULT_BACKGROUND);
  const coinDrops = ref<CoinDrop[]>([]);
  const coinCollector = reactive<CoinCollectorState>({
    ...DEFAULT_COIN_COLLECTOR,
  });
  const upgrades = reactive<UpgradesState>({ ...DEFAULT_UPGRADES });
  const decorations = ref<string[]>([...DEFAULT_DECORATIONS]);
  const activeBoosts = ref<ActiveBoost[]>([...DEFAULT_BOOSTS]);

  const hungerDecayPerTick = computed(() =>
    Math.max(0.2, BASE_HUNGER_DECAY - (upgrades.gourmetFeed ? 0.15 : 0))
  );
  const feedBonus = computed(() => (upgrades.gourmetFeed ? 5 : 0));
  const dropLifetimeMs = computed(
    () => BASE_DROP_LIFETIME + (upgrades.clarityFilters ? 4_000 : 0)
  );

  const coinMultiplier = computed(() => {
    let multiplier = 1;
    if (upgrades.luxeDecor) multiplier *= 1.15;
    activeBoosts.value.forEach((boost) => {
      multiplier *= boost.multiplier;
    });
    return multiplier;
  });

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
      const resolvedBackground = normalizeBackgroundPath(parsed.background);
      const resolvedCollector = resolveCoinCollector(parsed.coinCollector);
      const resolvedUpgrades = resolveUpgrades(parsed.upgrades);
      const resolvedDecorations = resolveDecorations(parsed.decorations);
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
        resolvedCoins += Math.floor(offlineCoins);
      }

      coins.value = resolvedCoins;
      fish.value = resolvedFish.map((entry) => normalizeFish(entry));
      lastSaveTime.value = now;
      Object.assign(autoFeeder, resolvedAutoFeeder);
      Object.assign(tools, resolvedTools);
      Object.assign(coinCollector, resolvedCollector);
      Object.assign(upgrades, resolvedUpgrades);
      decorations.value = [...resolvedDecorations];
      activeBoosts.value = resolvedBoosts;
      coinDrops.value = [];
      selectedTool.value = resolvedSelectedTool;
      hasEverFed.value = resolvedHasEverFed;
      background.value = resolvedBackground;
    } catch (error) {
      console.warn("[game] Unable to read saved state", error);
    }
  }

  function save() {
    if (!process.client) return;
    const timestamp = Date.now();
    lastSaveTime.value = timestamp;
    const payload: GameState = {
      coins: coins.value,
      fish: fish.value.map((entry) => ({ ...entry })),
      lastSaveTime: timestamp,
      autoFeeder: { ...autoFeeder },
      tools: { ...tools },
      selectedTool: selectedTool.value,
      feedingFishId: feedingFishId.value,
      hasEverFed: hasEverFed.value,
      background: background.value,
      coinCollector: { ...coinCollector },
      upgrades: { ...upgrades },
      decorations: [...decorations.value],
      activeBoosts: [...activeBoosts.value],
    };
    localStorage.setItem("aquarium-game", JSON.stringify(payload));
  }

  function feedFish(id: number, amount = 20) {
    const targetFish = fish.value.find((entry) => entry.id === id);
    if (!targetFish) return;

    const boost = feedBonus.value;
    const prevHunger = targetFish.hunger;
    targetFish.hunger = Math.min(100, targetFish.hunger + amount + boost);
    if (targetFish.hunger >= HAPPY_THRESHOLD && prevHunger < HAPPY_THRESHOLD) {
      targetFish.careStreak = clamp(
        targetFish.careStreak + 1,
        0,
        CARE_STREAK_MAX
      );
      spawnCoinDrop(targetFish, 2 + targetFish.careStreak, "care");
    }
    feedingFishId.value = id;
    hasEverFed.value = true;

    setTimeout(() => {
      if (feedingFishId.value === id) feedingFishId.value = null;
    }, 800);

    save();
  }

  function removeFish(id: number) {
    fish.value = fish.value.filter((entry) => entry.id !== id);
    save();
  }

  function buyFish(type: string, cost: number) {
    if (coins.value < cost) return;
    const id = Date.now();
    coins.value -= cost;
    fish.value.push(
      normalizeFish({
        id,
        type,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        hunger: 100,
        speed: Math.random() * 2 + 1,
      })
    );
    save();
  }

  function dropTypeFor(value: number): CoinDropType {
    if (value >= 12) return "bill";
    if (value >= 5) return "stack";
    return "coin";
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
    source: CoinDrop["source"]
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
      id: now + Math.random(),
      value: adjusted,
      x: clamp(origin.x + jitterX, 6, 94),
      y: landingY,
      spawnY,
      fallDurationMs: Math.round(
        DROP_FALL_DURATION_MIN + fallDistance * DROP_FALL_DURATION_PER_PCT
      ),
      fishId: typeof origin.id === "number" ? origin.id : null,
      type: dropTypeFor(adjusted),
      createdAt: now,
      expiresAt: now + dropLifetimeMs.value,
      source,
    };
    const trimmed = [...coinDrops.value, drop];
    if (trimmed.length > DROP_MAX) trimmed.splice(0, trimmed.length - DROP_MAX);
    coinDrops.value = trimmed;
  }

  function scheduleCoinDrop(
    origin: Pick<FishData, "id" | "x" | "y">,
    amount: number,
    source: CoinDrop["source"]
  ) {
    if (!process.client) {
      spawnCoinDrop(origin, amount, source);
      return;
    }
    const jitterFactor = Math.random();
    const delay = Math.round(jitterFactor * OFFLINE_INTERVAL_MS);
    const timer = window.setTimeout(() => {
      dropTimers.delete(timer);
      spawnCoinDrop(origin, amount, source);
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
    coinDrops.value = [...coinDrops.value];
    coins.value = Math.round((coins.value + drop.value) * 100) / 100;
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

  function buyDecoration(id: string, cost: number) {
    if (decorations.value.includes(id)) return false;
    if (coins.value < cost) return false;
    coins.value -= cost;
    decorations.value = [...decorations.value, id];
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
    }[] = [];
    const updatedFish: FishData[] = [];

    fish.value.forEach((entry) => {
      const origin = { id: entry.id, x: entry.x, y: entry.y };
      const hungerLoss = hungerDecayPerTick.value;
      const nextHunger = Math.max(0, entry.hunger - hungerLoss);
      let careStreak = entry.careStreak;
      if (nextHunger < CARE_THRESHOLD) {
        careStreak = 0;
      }

      let progress = entry.coinProgress;
      if (nextHunger >= CARE_THRESHOLD) {
        const baseRate = coinRateFor(entry.type);
        const hungerMultiplier =
          nextHunger >= HAPPY_THRESHOLD ? 1.35 : 0.75 + nextHunger / 200;
        const streakBonus = 1 + careStreak * 0.12;
        progress += baseRate * hungerMultiplier * streakBonus;
      }

      const payout = Math.floor(progress);
      progress -= payout;
      if (payout > 0) {
        dropsToSpawn.push({ origin, amount: payout });
      }

      updatedFish.push({
        ...entry,
        hunger: nextHunger,
        careStreak,
        coinProgress: progress,
      });
    });

    fish.value = updatedFish.filter((entry) => entry.hunger > 0);

    dropsToSpawn.forEach(({ origin, amount }) =>
      scheduleCoinDrop(origin, amount, "baseline")
    );

    if (autoFeeder.owned && autoFeeder.active) {
      if (now - autoFeeder.lastFeedTime >= autoFeeder.feedInterval) {
        fish.value = fish.value.map((entry) => ({
          ...entry,
          hunger:
            entry.hunger < HAPPY_THRESHOLD
              ? Math.min(100, entry.hunger + 15 + feedBonus.value)
              : entry.hunger,
        }));
        autoFeeder.lastFeedTime = now;
      }
    }

    maybeAutoCollect(now);
    save();
  }

  return {
    coins,
    fish,
    lastSaveTime,
    autoFeeder,
    tools,
    selectedTool,
    feedingFishId,
    hasEverFed,
    background,
    coinDrops,
    coinCollector,
    upgrades,
    decorations,
    activeBoosts,
    coinMultiplier,
    isCollectorReady,
    collectorCapacity,
    averageHunger,
    showHowTo,
    load,
    save,
    feedFish,
    removeFish,
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
    buyDecoration,
    activateBoost,
    tick,
  };
});
