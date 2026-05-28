<script setup lang="ts">
const game = useGameStore();

type Category = "fish" | "upgrades" | "tank" | "powerups";
const activeCategory = ref<Category>("fish");

const categories: { id: Category; icon: string; label: string }[] = [
  { id: "fish",     icon: "🐠", label: "Fish"      },
  { id: "upgrades", icon: "⚙️", label: "Upgrades"  },
  { id: "tank",     icon: "📦", label: "Tank"      },
  { id: "powerups", icon: "⚡", label: "Power-ups" },
];

const ownedUpgrades = computed(() => {
  const owned = new Set<UpgradeId>();
  (Object.keys(game.upgrades) as UpgradeId[]).forEach((key) => {
    if ((game.upgrades as Record<UpgradeId, boolean>)[key]) owned.add(key);
  });
  return owned;
});
const activeBoosts = computed(() => new Set(game.activeBoosts.map((b) => b.id)));

function coinsPerMinute(type: string) {
  return Math.round(coinsPerMinuteFor(type) * 10) / 10;
}

function fishUptakeCost(type: string) {
  const water = MAINTENANCE_WATER_COST[type] ?? 0.5;
  return Math.round((water + FOOD_PER_FISH) * 10) / 10;
}

const tankFull = computed(() => game.fish.length >= game.tankCapacity);

const collectorStats = computed(
  () => COIN_COLLECTOR_LEVELS.find((e) => e.level === game.coinCollector.level) ?? COIN_COLLECTOR_LEVELS[0]
);
const nextCollector = computed(() => nextCollectorLevel(game.coinCollector.level));
</script>

<template>
  <div class="flex flex-col h-full">

    <!-- Sticky category strip -->
    <div class="sticky top-0 z-10 flex gap-2 px-4 py-3 overflow-x-auto"
      style="background: rgba(2,6,23,0.97); border-bottom: 1px solid rgba(255,255,255,0.06);">
      <UButton
        v-for="cat in categories"
        :key="cat.id"
        size="sm"
        :color="activeCategory === cat.id ? 'primary' : 'neutral'"
        :variant="activeCategory === cat.id ? 'soft' : 'ghost'"
        class="shrink-0 rounded-full"
        @click="activeCategory = cat.id">
        <span>{{ cat.icon }}</span>
        <span>{{ cat.label }}</span>
      </UButton>
    </div>

    <!-- Section content -->
    <div class="flex-1 overflow-y-auto p-4">

      <!-- Fish -->
      <div v-if="activeCategory === 'fish'">
        <div v-if="tankFull" class="mb-3 rounded-xl px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>Tank is full ({{ game.fish.length }}/{{ game.tankCapacity }}). Buy a Tank expansion to add more.</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div
            v-for="item in FISH_SHOP_ITEMS"
            :key="item.type"
            class="rounded-xl p-3 flex flex-col gap-2"
            style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
            <div class="flex items-center gap-2">
              <div class="w-10 h-8 flex items-center justify-center rounded-lg shrink-0"
                style="background: rgba(255,255,255,0.06);">
                <FishSvg :type="item.type" v-bind="fishPreviewSize(item.type)" class="drop-shadow-sm" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold text-white truncate">{{ item.name }}</p>
                <p class="text-xs text-yellow-400/90 font-medium">{{ item.cost }} coins</p>
                <p class="text-xs text-emerald-400/80">+{{ coinsPerMinute(item.type) }}/min</p>
                <p class="text-xs text-red-400/60">-{{ fishUptakeCost(item.type) }}/min upkeep</p>
              </div>
            </div>
            <p class="text-xs text-white/55 leading-snug">{{ item.desc }}</p>
            <p v-if="SPECIES_LORE[item.type]" class="text-xs text-white/35 leading-snug italic">{{ SPECIES_LORE[item.type] }}</p>
            <UButton
              color="primary"
              variant="soft"
              size="sm"
              :label="tankFull ? 'Tank Full' : 'Buy'"
              :disabled="tankFull || game.coins < item.cost"
              block
              @click="game.buyFish(item.type, item.cost)" />
          </div>
        </div>
      </div>

      <!-- Upgrades -->
      <div v-else-if="activeCategory === 'upgrades'">

        <!-- Feed Upgrade (Scatter Spoon) -->
        <div class="rounded-xl p-3 flex flex-col gap-2 mb-3"
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div class="w-10 h-10 flex items-center justify-center rounded-lg text-xl shrink-0"
                style="background: rgba(255,255,255,0.06);">🥄</div>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-white truncate">Scatter Feed</p>
                <p v-if="!game.tools.spoonOwned" class="text-xs text-yellow-400/90 font-medium">{{ SPOON_COST }} coins</p>
                <p v-else class="text-xs text-white/40">Owned</p>
              </div>
            </div>
            <UBadge v-if="game.tools.spoonOwned" color="primary" variant="soft" label="✓ Owned" class="shrink-0" />
            <UButton
              v-else
              color="primary"
              variant="soft"
              size="sm"
              label="Buy"
              :disabled="game.coins < SPOON_COST"
              class="shrink-0"
              @click="game.buySpoon(SPOON_COST)" />
          </div>
          <p class="text-xs text-white/50 leading-snug">Upgrades your click to scatter 5 flakes at once — much faster feeding.</p>
        </div>

        <!-- Auto Feeder -->
        <div class="rounded-xl p-3 flex flex-col gap-2 mb-3"
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div class="w-10 h-10 flex items-center justify-center rounded-lg text-xl shrink-0"
                style="background: rgba(255,255,255,0.06);">🤖</div>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-white truncate">Auto Feeder</p>
                <p v-if="!game.autoFeeder.owned" class="text-xs text-yellow-400/90 font-medium">{{ AUTO_FEEDER_COST }} coins</p>
                <p v-else class="text-xs" :class="game.autoFeeder.active ? 'text-emerald-400' : 'text-white/40'">
                  {{ game.autoFeeder.active ? 'Active' : 'Owned · Paused' }}
                </p>
              </div>
            </div>
            <UButton
              v-if="game.autoFeeder.owned"
              size="sm"
              :color="game.autoFeeder.active ? 'success' : 'primary'"
              :variant="game.autoFeeder.active ? 'soft' : 'soft'"
              :label="game.autoFeeder.active ? 'Pause' : 'Enable'"
              class="shrink-0"
              @click="game.toggleAutoFeeder()" />
            <UButton
              v-else
              color="primary"
              variant="soft"
              size="sm"
              label="Buy"
              :disabled="game.coins < AUTO_FEEDER_COST"
              class="shrink-0"
              @click="game.buyAutoFeeder(AUTO_FEEDER_COST)" />
          </div>
          <p class="text-xs text-white/50 leading-snug">Feeds all hungry fish every 30 seconds automatically.</p>
        </div>

        <!-- Coin Collector — shown first since it's the most impactful early upgrade -->
        <div class="rounded-xl p-3 flex flex-col gap-2 mb-3"
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div class="w-10 h-10 flex items-center justify-center rounded-lg text-xl shrink-0"
                style="background: rgba(255,255,255,0.06);">🧺</div>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-white truncate">Coin Collector</p>
                <p class="text-xs text-white/40 mt-0.5">{{ collectorStats.label }}</p>
                <p v-if="nextCollector" class="text-xs text-yellow-400/90 font-medium">{{ nextCollector.cost }} coins</p>
              </div>
            </div>
            <UButton
              v-if="nextCollector"
              color="primary"
              variant="soft"
              size="sm"
              label="Upgrade"
              :disabled="game.coins < nextCollector.cost"
              class="shrink-0"
              @click="game.buyCoinCollectorUpgrade()" />
            <UBadge v-else color="primary" variant="soft" label="✓ Maxed" class="shrink-0" />
          </div>
          <p class="text-xs text-white/35 leading-snug">{{ collectorStats.description }}</p>
          <p v-if="nextCollector" class="text-xs text-emerald-400/70">Next: {{ nextCollector.description }}</p>
        </div>

        <!-- Incubator -->
        <div class="rounded-xl p-3 flex flex-col gap-2 mb-3"
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div class="w-10 h-10 flex items-center justify-center rounded-lg text-xl shrink-0"
                style="background: rgba(255,255,255,0.06);">🥚</div>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-white truncate">Incubator</p>
                <p v-if="!game.incubator.owned" class="text-xs text-yellow-400/90 font-medium">{{ INCUBATOR_COST }} coins</p>
                <p v-else class="text-xs text-white/40">Owned</p>
              </div>
            </div>
            <UBadge v-if="game.incubator.owned" color="primary" variant="soft" label="✓ Owned" class="shrink-0" />
            <UButton
              v-else
              color="primary"
              variant="soft"
              size="sm"
              label="Buy"
              :disabled="game.coins < INCUBATOR_COST"
              class="shrink-0"
              @click="game.buyIncubator()" />
          </div>
          <p class="text-xs text-white/50 leading-snug">Breed two fish of the same species to create unique offspring with inherited traits.</p>
          <p class="text-xs text-emerald-400/70">Babies may have improved stats or rare mutations!</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="item in TANK_UPGRADES"
            :key="item.id"
            class="rounded-xl p-3 flex flex-col gap-2"
            style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <div class="w-10 h-10 flex items-center justify-center rounded-lg text-xl shrink-0"
                  style="background: rgba(255,255,255,0.06);">
                  {{ item.icon }}
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-white truncate">{{ item.name }}</p>
                  <p class="text-xs text-yellow-400/90 font-medium">{{ item.cost }} coins</p>
                </div>
              </div>
              <UBadge
                v-if="ownedUpgrades.has(item.id)"
                color="primary"
                variant="soft"
                label="✓ Owned"
                class="shrink-0" />
              <UButton
                v-else
                color="primary"
                variant="soft"
                size="sm"
                label="Buy"
                :disabled="game.coins < item.cost"
                class="shrink-0"
                @click="game.buyUpgrade(item.id, item.cost)" />
            </div>
            <p class="text-xs text-white/35 leading-snug">{{ item.desc }}</p>
            <p class="text-xs text-emerald-400/70">{{ item.effect }}</p>
          </div>
        </div>
      </div>

      <!-- Tank capacity -->
      <div v-else-if="activeCategory === 'tank'">
        <p class="text-xs text-white/40 mb-3">{{ game.fish.length }} / {{ game.tankCapacity }} slots used</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="item in TANK_EXPANSION_ITEMS"
            :key="item.id"
            class="rounded-xl p-3 flex flex-col gap-2"
            style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <div class="w-10 h-10 flex items-center justify-center rounded-lg text-xl shrink-0"
                  style="background: rgba(255,255,255,0.06);">
                  {{ item.icon }}
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-white truncate">{{ item.name }}</p>
                  <p class="text-xs text-yellow-400/90 font-medium">{{ item.cost.toLocaleString() }} coins</p>
                  <p class="text-xs text-emerald-400/80">+{{ item.slots }} slots</p>
                </div>
              </div>
              <UBadge
                v-if="game.purchasedExpansions.includes(item.id)"
                color="primary"
                variant="soft"
                label="✓ Owned"
                class="shrink-0" />
              <UButton
                v-else
                color="primary"
                variant="soft"
                size="sm"
                label="Buy"
                :disabled="game.coins < item.cost"
                class="shrink-0"
                @click="game.buyTankExpansion(item.id, item.cost, item.slots)" />
            </div>
            <p class="text-xs text-white/35 leading-snug">{{ item.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Power-ups -->
      <div v-else-if="activeCategory === 'powerups'">
        <!-- Medicine — one-shot heal for all fish -->
        <div class="rounded-xl p-3 flex flex-col gap-2 mb-3"
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div class="w-10 h-10 flex items-center justify-center rounded-lg text-xl shrink-0"
                style="background: rgba(255,255,255,0.06);">💊</div>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-white truncate">Medicine</p>
                <p class="text-xs text-yellow-400/90 font-medium">{{ MEDICINE_COST }} coins</p>
                <p class="text-xs text-white/35">Instant effect</p>
              </div>
            </div>
            <UButton
              color="error"
              variant="soft"
              size="sm"
              label="Heal All"
              :disabled="game.coins < MEDICINE_COST || !game.fish.length"
              class="shrink-0"
              @click="game.buyMedicine()" />
          </div>
          <p class="text-xs text-white/35 leading-snug">Restores +{{ MEDICINE_HEAL_AMOUNT }} health to all fish in your tank.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="item in POWER_UP_ITEMS"
            :key="item.id"
            class="rounded-xl p-3 flex flex-col gap-2"
            style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <div class="w-10 h-10 flex items-center justify-center rounded-lg text-xl shrink-0"
                  style="background: rgba(255,255,255,0.06);">
                  {{ item.icon }}
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-white truncate">{{ item.name }}</p>
                  <p class="text-xs text-yellow-400/90 font-medium">{{ item.cost }} coins</p>
                  <p class="text-xs text-white/35">{{ item.duration }}</p>
                </div>
              </div>
              <UBadge
                v-if="activeBoosts.has(item.id)"
                color="success"
                variant="soft"
                label="Active"
                class="shrink-0" />
              <UButton
                v-else
                color="success"
                variant="soft"
                size="sm"
                label="Activate"
                :disabled="game.coins < item.cost"
                class="shrink-0"
                @click="game.activateBoost(item.id, item.cost)" />
            </div>
            <p class="text-xs text-white/35 leading-snug">{{ item.desc }}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
