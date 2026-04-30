<script setup lang="ts">
const game = useGameStore();
const shopItems = FISH_SHOP_ITEMS;
const upgradeItems = TANK_UPGRADES;
const decorItems = DECOR_ITEMS;
const powerUpItems = POWER_UP_ITEMS;

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
      <h3 class="text-sm mb-2">Buy new fish</h3>
      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <UCard v-for="item in shopItems" :key="item.type">
          <div class="flex items-center gap-2 mb-2">
            <div
              class="w-10 h-8 flex items-center justify-center bg-gray-700/40 rounded">
              <FishSvg
                :type="item.type"
                v-bind="fishPreviewSize(item.type)"
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
          <p class="text-[11px] text-muted mt-2 leading-snug">
            {{ item.desc }}
          </p>
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
          <p class="text-[11px] text-muted mt-2 leading-snug">
            {{ item.desc }}
          </p>
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
          <p class="text-[11px] text-muted mt-2 leading-snug">
            {{ item.desc }}
          </p>
          <p class="text-[10px] text-emerald-300 mt-1">
            Duration: {{ item.duration }}
          </p>
        </UCard>
      </div>
    </div>
  </div>
</template>
