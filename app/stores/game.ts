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
const DEFAULT_BACKGROUND = "/backgrounds/0.webp";

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

export const useGameStore = defineStore("game", {
  state: (): GameState => ({
    coins: 1000,
    fish: [
      { id: 1, type: "goldfish", x: 20, y: 50, hunger: 80, speed: 2 },
      { id: 2, type: "angelfish", x: 60, y: 30, hunger: 60, speed: 1.5 },
      { id: 3, type: "neon", x: 80, y: 70, hunger: 90, speed: 3 },
    ],
    lastSaveTime: Date.now(),
    autoFeeder: { ...DEFAULT_AUTO_FEEDER },
    tools: { ...DEFAULT_TOOLS },
    selectedTool: "flake",
    feedingFishId: null,
    hasEverFed: false,
    background: DEFAULT_BACKGROUND,
  }),
  getters: {
    averageHunger: (state) =>
      state.fish.length
        ? Math.round(
            state.fish.reduce((sum, f) => sum + f.hunger, 0) / state.fish.length
          )
        : 0,
    showHowTo: (state) => !state.hasEverFed,
  },
  actions: {
    load() {
      if (!process.client) return;
      const saved = localStorage.getItem("aquarium-game");
      if (!saved) return;

      try {
        const parsed = JSON.parse(saved) as Partial<GameState>;
        const now = Date.now();
        const lastSave =
          typeof parsed.lastSaveTime === "number" ? parsed.lastSaveTime : now;

        const autoFeeder = resolveAutoFeeder(parsed.autoFeeder);
        const tools = resolveTools(parsed.tools);
        const selectedTool: ToolType =
          parsed.selectedTool === "spoon" && tools.spoonOwned
            ? "spoon"
            : "flake";
        const hasEverFed = Boolean(parsed.hasEverFed);
        const background = normalizeBackgroundPath(parsed.background);

        let coins =
          typeof parsed.coins === "number" ? parsed.coins : this.coins;
        const fish =
          Array.isArray(parsed.fish) && parsed.fish.length
            ? parsed.fish
            : this.fish;

        const offlineTime = Math.min(
          Math.max(0, now - lastSave),
          OFFLINE_MAX_MS
        );
        const intervals = Math.floor(offlineTime / OFFLINE_INTERVAL_MS);
        if (intervals > 0) {
          let offlineCoins = 0;
          fish.forEach((f) => {
            offlineCoins += coinRateFor(f.type) * intervals;
          });
          coins += Math.floor(offlineCoins);
        }

        this.$patch({
          coins,
          fish,
          lastSaveTime: now,
          autoFeeder,
          tools,
          selectedTool,
          hasEverFed,
          background,
        });
      } catch (error) {
        console.warn("[game] Unable to read saved state", error);
      }
    },
    save() {
      if (!process.client) return;
      const payload = {
        ...this.$state,
        lastSaveTime: Date.now(),
      };
      localStorage.setItem("aquarium-game", JSON.stringify(payload));
    },
    feedFish(id: number, amount = 20) {
      const fish = this.fish.find((entry) => entry.id === id);
      if (!fish) return;

      fish.hunger = Math.min(100, fish.hunger + amount);
      this.feedingFishId = id;
      this.hasEverFed = true;

      setTimeout(() => {
        if (this.feedingFishId === id) this.feedingFishId = null;
      }, 800);

      this.save();
    },
    removeFish(id: number) {
      this.fish = this.fish.filter((fish) => fish.id !== id);
      this.save();
    },
    buyFish(type: string, cost: number) {
      if (this.coins < cost) return;
      const id = Date.now();
      this.coins -= cost;
      this.fish.push({
        id,
        type,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        hunger: 100,
        speed: Math.random() * 2 + 1,
      });
      this.save();
    },
    buySpoon(cost: number) {
      if (this.coins < cost || this.tools.spoonOwned) return;
      this.coins -= cost;
      this.tools.spoonOwned = true;
      this.selectedTool = "spoon";
      this.save();
    },
    buyAutoFeeder(cost: number) {
      if (this.coins < cost || this.autoFeeder.owned) return;
      this.coins -= cost;
      this.autoFeeder.owned = true;
      this.autoFeeder.active = true;
      this.autoFeeder.lastFeedTime = Date.now();
      this.save();
    },
    toggleAutoFeeder() {
      if (!this.autoFeeder.owned) return;
      this.autoFeeder.active = !this.autoFeeder.active;
      if (this.autoFeeder.active) {
        this.autoFeeder.lastFeedTime = Date.now();
      }
      this.save();
    },
    selectTool(tool: ToolType) {
      if (tool === "spoon" && !this.tools.spoonOwned) return;
      this.selectedTool = tool;
      this.save();
    },
    setBackground(image: string) {
      this.background = normalizeBackgroundPath(image);
      this.save();
    },
    tick() {
      let coinsDelta = 0;
      this.fish.forEach((fish) => {
        coinsDelta += coinRateFor(fish.type);
      });
      this.coins = Math.round((this.coins + coinsDelta) * 100) / 100;

      this.fish = this.fish
        .map((fish) => ({
          ...fish,
          hunger: Math.max(0, fish.hunger - 0.5),
        }))
        .filter((fish) => fish.hunger > 0);

      if (this.autoFeeder.owned && this.autoFeeder.active) {
        const now = Date.now();
        if (
          now - this.autoFeeder.lastFeedTime >=
          this.autoFeeder.feedInterval
        ) {
          this.fish = this.fish.map((fish) => ({
            ...fish,
            hunger:
              fish.hunger < 80 ? Math.min(100, fish.hunger + 15) : fish.hunger,
          }));
          this.autoFeeder.lastFeedTime = now;
        }
      }

      this.save();
    },
  },
});
