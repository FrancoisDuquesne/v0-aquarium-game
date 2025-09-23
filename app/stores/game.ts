import { defineStore } from "pinia";

type ToolType = "flake" | "spoon";

interface FishData {
  id: number;
  type: string;
  x: number;
  y: number;
  hunger: number;
  speed: number;
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
}

const DEFAULT_AUTO_FEEDER: AutoFeeder = {
  owned: false,
  active: false,
  lastFeedTime: 0,
  feedInterval: 30_000,
};

const DEFAULT_TOOLS: Tools = { spoonOwned: false };
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

const COIN_RATE: Record<string, number> = {
  neon: 0.5,
  goldfish: 0.33,
  angelfish: 0.67,
  tropical: 1.0,
  shark: 2.0,
};

const OFFLINE_INTERVAL_MS = 5_000;
const OFFLINE_MAX_MS = 24 * 60 * 60 * 1000;

function coinRateFor(type: string) {
  return COIN_RATE[type] ?? 0.33;
}

function resolveAutoFeeder(value: Partial<AutoFeeder> | undefined): AutoFeeder {
  return { ...DEFAULT_AUTO_FEEDER, ...value };
}

function resolveTools(value: Partial<Tools> | undefined): Tools {
  return { ...DEFAULT_TOOLS, ...value };
}

export const useGameStore = defineStore("game", () => {
  const coins = ref(1000);
  const fish = ref<FishData[]>([
    { id: 1, type: "goldfish", x: 20, y: 50, hunger: 80, speed: 2 },
    { id: 2, type: "angelfish", x: 60, y: 30, hunger: 60, speed: 1.5 },
    { id: 3, type: "neon", x: 80, y: 70, hunger: 90, speed: 3 },
  ]);
  const lastSaveTime = ref(Date.now());
  const autoFeeder = reactive<AutoFeeder>({ ...DEFAULT_AUTO_FEEDER });
  const tools = reactive<Tools>({ ...DEFAULT_TOOLS });
  const selectedTool = ref<ToolType>("flake");
  const feedingFishId = ref<number | null>(null);
  const hasEverFed = ref(false);
  const background = ref(DEFAULT_BACKGROUND);

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
          offlineCoins += coinRateFor(entry.type) * intervals;
        });
        resolvedCoins += Math.floor(offlineCoins);
      }

      coins.value = resolvedCoins;
      fish.value = resolvedFish.map((entry) => ({ ...entry }));
      lastSaveTime.value = now;
      Object.assign(autoFeeder, resolvedAutoFeeder);
      Object.assign(tools, resolvedTools);
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
    };
    localStorage.setItem("aquarium-game", JSON.stringify(payload));
  }

  function feedFish(id: number, amount = 20) {
    const targetFish = fish.value.find((entry) => entry.id === id);
    if (!targetFish) return;

    targetFish.hunger = Math.min(100, targetFish.hunger + amount);
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
    fish.value.push({
      id,
      type,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      hunger: 100,
      speed: Math.random() * 2 + 1,
    });
    save();
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
    let coinsDelta = 0;
    fish.value.forEach((entry) => {
      coinsDelta += coinRateFor(entry.type);
    });
    coins.value = Math.round((coins.value + coinsDelta) * 100) / 100;

    fish.value = fish.value
      .map((entry) => ({
        ...entry,
        hunger: Math.max(0, entry.hunger - 0.5),
      }))
      .filter((entry) => entry.hunger > 0);

    if (autoFeeder.owned && autoFeeder.active) {
      const now = Date.now();
      if (now - autoFeeder.lastFeedTime >= autoFeeder.feedInterval) {
        fish.value = fish.value.map((entry) => ({
          ...entry,
          hunger:
            entry.hunger < 80 ? Math.min(100, entry.hunger + 15) : entry.hunger,
        }));
        autoFeeder.lastFeedTime = now;
      }
    }

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
    tick,
  };
});
