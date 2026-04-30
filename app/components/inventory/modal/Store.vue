<script setup lang="ts">
const game = useGameStore();

type Category = "fish" | "upgrades" | "tank" | "decor" | "powerups";
const activeCategory = ref<Category>("fish");

const categories: { id: Category; icon: string; label: string }[] = [
  { id: "fish",     icon: "🐠", label: "Fish"      },
  { id: "upgrades", icon: "⚙️", label: "Upgrades"  },
  { id: "tank",     icon: "📦", label: "Tank"      },
  { id: "decor",    icon: "🪸", label: "Décor"     },
  { id: "powerups", icon: "⚡", label: "Power-ups" },
];

const ownedUpgrades = computed(() => {
  const owned = new Set<UpgradeId>();
  (Object.keys(game.upgrades) as UpgradeId[]).forEach((key) => {
    if ((game.upgrades as Record<UpgradeId, boolean>)[key]) owned.add(key);
  });
  return owned;
});
const ownedDecor = computed(() => new Set(game.decorations));
const activeBoosts = computed(() => new Set(game.activeBoosts.map((b) => b.id)));

function coinsPerMinute(type: string) {
  return Math.round(coinsPerMinuteFor(type) * 10) / 10;
}

const tankFull = computed(() => game.fish.length >= game.tankCapacity);
</script>

<template>
  <div class="flex flex-col h-full">

    <!-- Sticky category strip -->
    <div class="sticky top-0 z-10 flex gap-2 px-4 py-3 overflow-x-auto"
      style="background: rgba(2,6,23,0.97); border-bottom: 1px solid rgba(255,255,255,0.06);">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all focus:outline-none"
        :class="activeCategory === cat.id
          ? 'bg-cyan-500 text-slate-950'
          : 'bg-white/8 text-white/50 hover:bg-white/12 hover:text-white/70'"
        @click="activeCategory = cat.id">
        <span>{{ cat.icon }}</span>
        <span>{{ cat.label }}</span>
      </button>
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
                <p class="text-[10px] text-yellow-400/90 font-medium">{{ item.cost }} coins</p>
                <p class="text-[10px] text-emerald-400/80">+{{ coinsPerMinute(item.type) }}/min</p>
              </div>
            </div>
            <p class="text-[10px] text-white/35 leading-snug">{{ item.desc }}</p>
            <button
              class="w-full py-1.5 rounded-lg text-xs font-semibold transition-all focus:outline-none"
              :class="tankFull || game.coins < item.cost
                ? 'bg-white/5 text-white/25 cursor-not-allowed'
                : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/25'"
              :disabled="tankFull || game.coins < item.cost"
              @click="game.buyFish(item.type, item.cost)">
              {{ tankFull ? 'Tank Full' : 'Buy' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Upgrades -->
      <div v-else-if="activeCategory === 'upgrades'">
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
                  <p class="text-[10px] text-yellow-400/90 font-medium">{{ item.cost }} coins</p>
                </div>
              </div>
              <span
                v-if="ownedUpgrades.has(item.id)"
                class="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                ✓ Owned
              </span>
              <button
                v-else
                class="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all focus:outline-none"
                :class="game.coins < item.cost
                  ? 'bg-white/5 text-white/25 cursor-not-allowed'
                  : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/25'"
                :disabled="game.coins < item.cost"
                @click="game.buyUpgrade(item.id, item.cost)">
                Buy
              </button>
            </div>
            <p class="text-[10px] text-white/35 leading-snug">{{ item.desc }}</p>
            <p class="text-[10px] text-emerald-400/70">{{ item.effect }}</p>
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
                  <p class="text-[10px] text-yellow-400/90 font-medium">{{ item.cost.toLocaleString() }} coins</p>
                  <p class="text-[10px] text-emerald-400/80">+{{ item.slots }} slots</p>
                </div>
              </div>
              <span
                v-if="game.purchasedExpansions.includes(item.id)"
                class="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                ✓ Owned
              </span>
              <button
                v-else
                class="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all focus:outline-none"
                :class="game.coins < item.cost
                  ? 'bg-white/5 text-white/25 cursor-not-allowed'
                  : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/25'"
                :disabled="game.coins < item.cost"
                @click="game.buyTankExpansion(item.id, item.cost, item.slots)">
                Buy
              </button>
            </div>
            <p class="text-[10px] text-white/35 leading-snug">{{ item.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Decor -->
      <div v-else-if="activeCategory === 'decor'">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="item in DECOR_ITEMS"
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
                  <p class="text-[10px] text-yellow-400/90 font-medium">{{ item.cost }} coins</p>
                </div>
              </div>
              <span
                v-if="ownedDecor.has(item.id)"
                class="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                ✓ Owned
              </span>
              <button
                v-else
                class="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all focus:outline-none"
                :class="game.coins < item.cost
                  ? 'bg-white/5 text-white/25 cursor-not-allowed'
                  : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/25'"
                :disabled="game.coins < item.cost"
                @click="game.buyDecoration(item.id, item.cost)">
                Buy
              </button>
            </div>
            <p class="text-[10px] text-white/35 leading-snug">{{ item.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Power-ups -->
      <div v-else-if="activeCategory === 'powerups'">
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
                  <p class="text-[10px] text-yellow-400/90 font-medium">{{ item.cost }} coins</p>
                  <p class="text-[10px] text-white/35">{{ item.duration }}</p>
                </div>
              </div>
              <span
                v-if="activeBoosts.has(item.id)"
                class="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                Active
              </span>
              <button
                v-else
                class="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all focus:outline-none"
                :class="game.coins < item.cost
                  ? 'bg-white/5 text-white/25 cursor-not-allowed'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25'"
                :disabled="game.coins < item.cost"
                @click="game.activateBoost(item.id, item.cost)">
                Activate
              </button>
            </div>
            <p class="text-[10px] text-white/35 leading-snug">{{ item.desc }}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
