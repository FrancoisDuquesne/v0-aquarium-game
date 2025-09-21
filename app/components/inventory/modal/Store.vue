<script setup lang="ts">
const game = useGameStore();
const shopItems = FISH_SHOP_ITEMS;

function getPreview(type: string) {
  const size =
    (FISH_CONFIG.FISH_SIZES as any)[type] || FISH_CONFIG.FISH_SIZES.goldfish;
  return {
    w: Math.min(size.width * 0.8, 48),
    h: Math.min(size.height * 0.8, 32),
  };
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
  </div>
</template>
