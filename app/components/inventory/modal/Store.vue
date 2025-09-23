<script setup lang="ts">
import {
  DECOR_ITEMS,
  FISH_SHOP_ITEMS,
  POWER_UP_ITEMS,
  TANK_UPGRADES,
  type UpgradeId,
} from "~/config/shop";
import {
  coinsPerMinuteFor,
  COIN_COLLECTOR_LEVELS,
  nextCollectorLevel,
} from "~/utils/economy";

const game = useGameStore();
const shopItems = FISH_SHOP_ITEMS;
const upgradeItems = TANK_UPGRADES;
const decorItems = DECOR_ITEMS;
const powerUpItems = POWER_UP_ITEMS;

const collectorStats = computed(
  () =>
    COIN_COLLECTOR_LEVELS.find(
      (entry) => entry.level === game.coinCollector.level
    ) ?? COIN_COLLECTOR_LEVELS[0]
);
const nextCollector = computed(() => nextCollectorLevel(game.coinCollector.level));
const collectorDescription = computed(() => {
  const stats = collectorStats.value;
  if (!Number.isFinite(stats.cooldown)) {
    return "Click coins manually to collect them.";
  }
  return `Collects up to ${stats.capacity} drops every ${Math.round(
    stats.cooldown / 1000
  )}s.`;
});

const ownedUpgrades = computed(() => {
  const owned = new Set<UpgradeId>();
  (Object.keys(game.upgrades) as UpgradeId[]).forEach((key) => {
    if ((game.upgrades as Record<UpgradeId, boolean>)[key]) owned.add(key);
  });
  return owned;
});
const ownedDecor = computed(() => new Set(game.decorations));
const activeBoosts = computed(
  () => new Set(game.activeBoosts.map((boost) => boost.id))
);

function coinsPerMinute(type: string) {
  return Math.round(coinsPerMinuteFor(type) * 10) / 10;
}

function getPreview(type: string) {
  const size =
    (FISH_CONFIG.FISH_SIZES as any)[type] || FISH_CONFIG.FISH_SIZES.goldfish;
  return {
    w: Math.min(size.width * 0.8, 48),
    h: Math.min(size.height * 0.8, 32),
  };
}

function buyCollectorUpgrade() {
  game.buyCoinCollectorUpgrade();
}

function buyUpgradeItem(id: UpgradeId, cost: number) {
  game.buyUpgrade(id, cost);
}

function buyDecorItem(id: string, cost: number) {
  game.buyDecoration(id, cost);
}

function activatePowerUp(id: string, cost: number) {
  game.activateBoost(id, cost);
}
</script>

<template>
  <div class="h-full overflow-y-auto p-3 space-y-4">
    <div>
      <h3 class="text-sm mb-2">Equipment</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <UCard>
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div
                class="w-10 h-8 flex items-center justify-center bg-gray-700/40 rounded text-2xl">
                🍽️
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-xs truncate">Flake Feeder</div>
                <div class="text-[10px] text-muted font-medium">
                  Standard tool
                </div>
              </div>
            </div>
            <UButton
              size="xs"
              :color="game.selectedTool === 'flake' ? 'info' : 'neutral'"
              :label="game.selectedTool === 'flake' ? 'Selected' : 'Select'"
              @click="game.selectTool('flake')" />
          </div>
          <p class="text-[11px] text-muted mt-2">
            Sprinkle food at the tap location.
          </p>
        </UCard>
        <UCard>
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div
                class="w-10 h-8 flex items-center justify-center bg-gray-700/40 rounded text-2xl">
                🤖
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-xs truncate">Auto Feeder</div>
                <div class="text-[10px] text-yellow-400 font-semibold">
                  500 coins
                </div>
              </div>
            </div>
            <UButton
              v-if="game.autoFeeder.owned"
              size="xs"
              :color="game.autoFeeder.active ? 'error' : 'success'"
              :label="game.autoFeeder.active ? 'Turn Off' : 'Turn On'"
              @click="game.toggleAutoFeeder()" />
            <UButton
              v-else
              size="xs"
              color="info"
              label="Buy"
              :disabled="game.coins < 500"
              @click="game.buyAutoFeeder(500)" />
          </div>
          <p class="text-[11px] text-muted mt-2">
            Feeds fish automatically every 30s when hungry.
          </p>
        </UCard>
        <UCard>
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div
                class="w-10 h-8 flex items-center justify-center bg-gray-700/40 rounded text-2xl">
                🥄
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-xs truncate">Feeding Spoon</div>
                <div class="text-[10px] text-yellow-400 font-semibold">
                  200 coins
                </div>
              </div>
            </div>
            <UButton
              v-if="!game.tools.spoonOwned"
              size="xs"
              color="info"
              label="Buy"
              :disabled="game.coins < 200"
              @click="game.buySpoon(200)" />
            <UBadge
              v-else
              color="info"
              variant="soft"
              label="Owned"
              class="self-start" />
          </div>
          <p class="text-[11px] text-muted mt-2">
            Drop a handful of flakes with one click.
          </p>
        </UCard>
        <UCard>
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div
                class="w-10 h-8 flex items-center justify-center bg-gray-700/40 rounded text-2xl">
                🧺
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-xs truncate">Coin Collector</div>
                <div class="text-[10px] text-muted">{{ collectorStats.label }}</div>
              </div>
            </div>
            <UButton
              v-if="nextCollector"
              size="xs"
              color="info"
              :label="`Upgrade · ${nextCollector.cost}`"
              :disabled="game.coins < nextCollector.cost"
              @click="buyCollectorUpgrade" />
            <UBadge
              v-else
              color="success"
              variant="soft"
              label="Maxed"
              class="self-start" />
          </div>
          <p class="text-[11px] text-muted mt-2">{{ collectorDescription }}</p>
        </UCard>
      </div>
    </div>

    <div>
      <h3 class="text-sm mb-2">Buy new fish</h3>
      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <UCard v-for="item in shopItems" :key="item.type">
          <div class="flex items-center gap-2 mb-2">
            <div
              class="w-10 h-8 flex items-center justify-center bg-gray-700/40 rounded">
              <FishSvg
                :type="item.type"
                v-bind="getPreview(item.type)"
                class="drop-shadow-sm" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs truncate">
                {{ item.name }}
              </div>
              <div class="text-[10px] text-yellow-400 font-semibold">
                {{ item.cost }} coins
              </div>
              <div class="text-[10px] text-emerald-300 font-semibold">
                Up to {{ coinsPerMinute(item.type) }} coins/min when happy
              </div>
            </div>
          </div>
          <p class="text-[11px] text-muted mb-2 leading-snug">
            {{ item.desc }}
          </p>
          <UButton
            size="xs"
            color="info"
            label="Buy"
            :disabled="game.coins < item.cost"
            @click="game.buyFish(item.type, item.cost)" />
        </UCard>
      </div>
    </div>

    <div>
      <h3 class="text-sm mb-2">Tank upgrades</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <UCard v-for="item in upgradeItems" :key="item.id">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div
                class="w-10 h-8 flex items-center justify-center bg-gray-700/40 rounded text-2xl">
                {{ item.icon }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-xs truncate">{{ item.name }}</div>
                <div class="text-[10px] text-yellow-400 font-semibold">
                  {{ item.cost }} coins
                </div>
              </div>
            </div>
            <UBadge
              v-if="ownedUpgrades.has(item.id)"
              color="info"
              variant="soft"
              label="Owned"
              class="self-start" />
            <UButton
              v-else
              size="xs"
              color="info"
              label="Buy"
              :disabled="game.coins < item.cost"
              @click="buyUpgradeItem(item.id, item.cost)" />
          </div>
          <p class="text-[11px] text-muted mt-2 leading-snug">{{ item.desc }}</p>
          <p class="text-[10px] text-emerald-300 mt-1">{{ item.effect }}</p>
        </UCard>
      </div>
    </div>

    <div>
      <h3 class="text-sm mb-2">Decorations</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <UCard v-for="item in decorItems" :key="item.id">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div
                class="w-10 h-8 flex items-center justify-center bg-gray-700/40 rounded text-2xl">
                {{ item.icon }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-xs truncate">{{ item.name }}</div>
                <div class="text-[10px] text-yellow-400 font-semibold">
                  {{ item.cost }} coins
                </div>
              </div>
            </div>
            <UBadge
              v-if="ownedDecor.has(item.id)"
              color="info"
              variant="soft"
              label="Owned"
              class="self-start" />
            <UButton
              v-else
              size="xs"
              color="info"
              label="Buy"
              :disabled="game.coins < item.cost"
              @click="buyDecorItem(item.id, item.cost)" />
          </div>
          <p class="text-[11px] text-muted mt-2 leading-snug">{{ item.desc }}</p>
        </UCard>
      </div>
    </div>

    <div>
      <h3 class="text-sm mb-2">Power-ups</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <UCard v-for="item in powerUpItems" :key="item.id">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div
                class="w-10 h-8 flex items-center justify-center bg-gray-700/40 rounded text-2xl">
                {{ item.icon }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-xs truncate">{{ item.name }}</div>
                <div class="text-[10px] text-yellow-400 font-semibold">
                  {{ item.cost }} coins
                </div>
              </div>
            </div>
            <UBadge
              v-if="activeBoosts.has(item.id)"
              color="success"
              variant="soft"
              label="Active"
              class="self-start" />
            <UButton
              v-else
              size="xs"
              color="success"
              label="Activate"
              :disabled="game.coins < item.cost"
              @click="activatePowerUp(item.id, item.cost)" />
          </div>
          <p class="text-[11px] text-muted mt-2 leading-snug">{{ item.desc }}</p>
          <p class="text-[10px] text-emerald-300 mt-1">Duration: {{ item.duration }}</p>
        </UCard>
      </div>
    </div>
  </div>
</template>
