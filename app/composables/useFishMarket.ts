import {
  MARKET_REFRESH_MS,
  LISTING_DURATION_MS,
  type MarketFish,
  type ListedFish,
} from "~/utils/game-config";
import { fishMarketValue, generateMarketPool } from "~/utils/economy";
import type { Ref, ComputedRef } from "vue";

type FishEntry = {
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
  generation?: number;
  genetics?: import("~/utils/game-config").GeneticsData;
  [key: string]: unknown;
};

type MarketState = { pool: MarketFish[]; lastRefresh: number };

export function setupFishMarket(deps: {
  market: MarketState;
  listedFish: Ref<ListedFish[]>;
  fish: Ref<FishEntry[]>;
  coins: Ref<number>;
  totalCoinsCollected: Ref<number>;
  tankCapacity: ComputedRef<number>;
  purchasedExpansions: Ref<string[]>;
  normalizeFish: (entry: Partial<FishEntry>) => FishEntry;
  nextId: () => number;
  removeFish: (id: number) => void;
  save: () => void;
}) {
  const {
    market, listedFish, fish, coins, totalCoinsCollected,
    tankCapacity, purchasedExpansions, normalizeFish, nextId, removeFish, save,
  } = deps;

  function refreshMarketIfStale() {
    const now = Date.now();
    if (now - market.lastRefresh >= MARKET_REFRESH_MS) {
      const seed = Math.floor(now / MARKET_REFRESH_MS);
      const tankLevel = purchasedExpansions.value.length + 1;
      market.pool = generateMarketPool(tankLevel, seed);
      market.lastRefresh = now;
    }
  }

  function getMarketPool(): MarketFish[] {
    refreshMarketIfStale();
    return market.pool;
  }

  function buyMarketFish(uid: string) {
    refreshMarketIfStale();
    const entry = market.pool.find(m => m.uid === uid);
    if (!entry) return;
    if (coins.value < entry.price) return;
    if (fish.value.length >= tankCapacity.value) return;
    coins.value -= entry.price;
    fish.value.push(
      normalizeFish({
        id: nextId(),
        type: entry.type,
        name: entry.name,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        hunger: 80,
        speed: Math.random() * 2 + 1,
        generation: entry.generation,
        genetics: { ...entry.genetics },
        bornAt: Date.now(),
      })
    );
    market.pool = market.pool.filter(m => m.uid !== uid);
    save();
  }

  function listFishForSale(fishId: number) {
    if (listedFish.value.some(l => l.fishId === fishId)) return;
    const f = fish.value.find(f => f.id === fishId);
    if (!f) return;
    const price = fishMarketValue(f);
    const now = Date.now();
    listedFish.value.push({ fishId, price, listedAt: now, sellsByMs: now + LISTING_DURATION_MS });
    save();
  }

  function cancelListing(fishId: number) {
    listedFish.value = listedFish.value.filter(l => l.fishId !== fishId);
    save();
  }

  function sellFishNow(fishId: number) {
    if (isListed(fishId)) return;
    const f = fish.value.find(f => f.id === fishId);
    if (!f) return;
    const price = Math.round(fishMarketValue(f) * 0.6);
    coins.value += price;
    totalCoinsCollected.value += price;
    removeFish(fishId);
  }

  function checkListings() {
    const now = Date.now();
    const expired = listedFish.value.filter(l => now >= l.sellsByMs);
    if (!expired.length) return;
    const expiredIds = new Set(expired.map(l => l.fishId));
    coins.value += expired.reduce((sum, l) => sum + l.price, 0);
    fish.value = fish.value.filter(f => !expiredIds.has(f.id));
    listedFish.value = listedFish.value.filter(l => !expiredIds.has(l.fishId));
  }

  function isListed(fishId: number): boolean {
    return listedFish.value.some(l => l.fishId === fishId);
  }

  function getListingFor(fishId: number): ListedFish | undefined {
    return listedFish.value.find(l => l.fishId === fishId);
  }

  return {
    getMarketPool, buyMarketFish, listFishForSale, cancelListing,
    sellFishNow, checkListings, isListed, getListingFor,
  };
}
