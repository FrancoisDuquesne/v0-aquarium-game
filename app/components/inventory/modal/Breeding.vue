<script setup lang="ts">
import {
  INCUBATOR_COST,
  BREEDING_COOLDOWN_MS,
  MIN_PARENT_HEALTH,
  MIN_PARENT_HUNGER,
  MUTATION_DEFINITIONS,
  FISH_SHOP_ITEMS,
  type MutationType,
} from "~/utils/game-config";

const emit = defineEmits<{ (e: "go-to-shop"): void }>();
const game = useGameStore();

// Selection state
const selectedParent1 = ref<number | null>(null);
const selectedParent2 = ref<number | null>(null);
const showResultModal = ref(false);

// Computed states
const cooldownRemaining = computed(() => {
  if (!game.incubator.lastBreedTime) return 0;
  const elapsed = Date.now() - game.incubator.lastBreedTime;
  return Math.max(0, BREEDING_COOLDOWN_MS - elapsed);
});

const isOnCooldown = computed(() => cooldownRemaining.value > 0);

const cooldownText = computed(() => {
  const secs = Math.ceil(cooldownRemaining.value / 1000);
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return mins > 0 ? `${mins}m ${remainingSecs}s` : `${secs}s`;
});

const breedingProgress = computed(() => game.getBreedingProgress());

const progressPercent = computed(() => 
  breedingProgress.value ? Math.round(breedingProgress.value.progress * 100) : 0
);

const remainingTime = computed(() => {
  if (!breedingProgress.value) return "";
  const secs = Math.ceil(breedingProgress.value.remainingMs / 1000);
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return mins > 0 ? `${mins}m ${remainingSecs}s` : `${secs}s`;
});

const parent1Fish = computed(() => 
  selectedParent1.value ? game.fish.find(f => f.id === selectedParent1.value) : null
);

const parent2Fish = computed(() => 
  selectedParent2.value ? game.fish.find(f => f.id === selectedParent2.value) : null
);

const eligibleForParent1 = computed(() => 
  game.fish.filter(f => 
    f.health >= MIN_PARENT_HEALTH && 
    f.hunger >= MIN_PARENT_HUNGER &&
    f.id !== selectedParent2.value
  )
);

const eligibleForParent2 = computed(() => {
  if (!selectedParent1.value) return [];
  return game.getEligibleBreedingPartners(selectedParent1.value)
    .filter(f => f.id !== selectedParent1.value);
});

const canStartBreeding = computed(() => {
  if (!selectedParent1.value || !selectedParent2.value) return false;
  const check = game.canBreed(selectedParent1.value, selectedParent2.value);
  return check.valid;
});

const breedingError = computed(() => {
  if (!selectedParent1.value || !selectedParent2.value) return null;
  const check = game.canBreed(selectedParent1.value, selectedParent2.value);
  return check.valid ? null : check.reason;
});

const breedingParent1 = computed(() => 
  game.incubator.breeding 
    ? game.fish.find(f => f.id === game.incubator.breeding?.parent1Id) 
    : null
);

const breedingParent2 = computed(() => 
  game.incubator.breeding 
    ? game.fish.find(f => f.id === game.incubator.breeding?.parent2Id) 
    : null
);

// Watch for breeding results
watch(() => game.pendingBreedingResult, (result) => {
  if (result) {
    showResultModal.value = true;
  }
});

// Helper functions
const shopNameMap = Object.fromEntries(FISH_SHOP_ITEMS.map((item) => [item.type, item.name]));
function fishName(type: string): string {
  return shopNameMap[type] ?? type;
}

function selectParent1(id: number) {
  if (selectedParent1.value === id) {
    selectedParent1.value = null;
  } else {
    selectedParent1.value = id;
    // Clear parent 2 if it's no longer eligible
    if (selectedParent2.value) {
      const stillEligible = eligibleForParent2.value.some(f => f.id === selectedParent2.value);
      if (!stillEligible) selectedParent2.value = null;
    }
  }
}

function selectParent2(id: number) {
  selectedParent2.value = selectedParent2.value === id ? null : id;
}

function handleStartBreeding() {
  if (!selectedParent1.value || !selectedParent2.value) return;
  const result = game.startBreeding(selectedParent1.value, selectedParent2.value);
  if (result.success) {
    selectedParent1.value = null;
    selectedParent2.value = null;
  }
}

function handleBuyIncubator() {
  game.buyIncubator();
}

function handleCancelBreeding() {
  game.cancelBreeding();
}

function handleCloseResult() {
  game.clearBreedingResult();
  showResultModal.value = false;
}

function getMutationInfo(mutation?: MutationType) {
  if (!mutation) return null;
  return MUTATION_DEFINITIONS[mutation];
}

// Update cooldown display
const cooldownInterval = ref<ReturnType<typeof setInterval> | null>(null);
onMounted(() => {
  cooldownInterval.value = setInterval(() => {
    // Force reactivity update for cooldown
  }, 1000);
});
onUnmounted(() => {
  if (cooldownInterval.value) clearInterval(cooldownInterval.value);
});
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Not owned state -->
    <div v-if="!game.incubator.owned" class="flex-1 flex flex-col items-center justify-center p-6 gap-4">
      <div class="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
        style="background: linear-gradient(135deg, rgba(236,72,153,0.2), rgba(168,85,247,0.2)); border: 2px solid rgba(236,72,153,0.3);">
        🥚
      </div>
      <div class="text-center">
        <h3 class="text-lg font-semibold text-white mb-1">Incubator Required</h3>
        <p class="text-sm text-white/50 max-w-xs">
          Purchase an incubator to breed your fish and create unique offspring with inherited traits!
        </p>
      </div>
      <div class="flex flex-col items-center gap-2">
        <UButton
          color="primary"
          size="lg"
          :disabled="game.coins < INCUBATOR_COST"
          @click="handleBuyIncubator">
          <span class="mr-2">🥚</span>
          Buy Incubator
          <span class="ml-2 text-yellow-300">{{ INCUBATOR_COST }} coins</span>
        </UButton>
        <p v-if="game.coins < INCUBATOR_COST" class="text-xs text-red-400">
          Need {{ INCUBATOR_COST - Math.floor(game.coins) }} more coins
        </p>
      </div>
    </div>

    <!-- Breeding in progress -->
    <div v-else-if="game.incubator.breeding" class="flex-1 flex flex-col p-6">
      <div class="text-center mb-6">
        <h3 class="text-lg font-semibold text-white mb-1">Incubating...</h3>
        <p class="text-sm text-white/50">Your baby fish is on the way!</p>
      </div>

      <!-- Parents display -->
      <div class="flex items-center justify-center gap-4 mb-6">
        <div class="flex flex-col items-center gap-2">
          <div class="w-16 h-16 rounded-xl flex items-center justify-center"
            style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);">
            <FishSvg v-if="breedingParent1" :type="breedingParent1.type" :width="40" :height="28" />
            <span v-else class="text-2xl">🐟</span>
          </div>
          <span class="text-xs text-white/50">{{ breedingParent1?.name || 'Parent 1' }}</span>
        </div>
        <div class="text-2xl text-pink-400 animate-pulse">❤️</div>
        <div class="flex flex-col items-center gap-2">
          <div class="w-16 h-16 rounded-xl flex items-center justify-center"
            style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);">
            <FishSvg v-if="breedingParent2" :type="breedingParent2.type" :width="40" :height="28" />
            <span v-else class="text-2xl">🐟</span>
          </div>
          <span class="text-xs text-white/50">{{ breedingParent2?.name || 'Parent 2' }}</span>
        </div>
      </div>

      <!-- Egg animation -->
      <div class="flex justify-center mb-6">
        <div class="relative w-24 h-28">
          <div class="absolute inset-0 flex items-center justify-center text-6xl animate-bounce"
            style="animation-duration: 2s;">
            🥚
          </div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-20 h-20 rounded-full animate-ping opacity-20"
              style="background: radial-gradient(circle, rgba(236,72,153,0.5), transparent);"></div>
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="mb-4">
        <div class="flex justify-between text-xs text-white/50 mb-1">
          <span>Progress</span>
          <span>{{ remainingTime }} remaining</span>
        </div>
        <div class="h-3 rounded-full overflow-hidden" style="background: rgba(255,255,255,0.1);">
          <div class="h-full rounded-full transition-all duration-1000"
            style="background: linear-gradient(90deg, #ec4899, #a855f7);"
            :style="{ width: progressPercent + '%' }"></div>
        </div>
        <p class="text-center text-sm text-white/70 mt-2">{{ progressPercent }}% complete</p>
      </div>

      <!-- Baby preview -->
      <div class="rounded-xl p-4 mb-4" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
        <p class="text-xs text-white/50 mb-2">Expected offspring:</p>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: rgba(255,255,255,0.06);">
            <FishSvg :type="game.incubator.breeding.babyType" :width="28" :height="20" />
          </div>
          <div>
            <p class="text-sm font-medium text-white">{{ game.incubator.breeding.babyName }}</p>
            <p class="text-xs text-white/50">{{ fishName(game.incubator.breeding.babyType) }}</p>
          </div>
        </div>
      </div>

      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        block
        @click="handleCancelBreeding">
        Cancel Breeding
      </UButton>
    </div>

    <!-- Selection mode -->
    <div v-else class="flex flex-col h-full">
      <!-- Header -->
      <div class="sticky top-0 z-10 px-4 pt-3 pb-3"
        style="background: rgba(2,6,23,0.97); border-bottom: 1px solid rgba(255,255,255,0.06);">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-white">Select Parents</h3>
          <div v-if="isOnCooldown" class="flex items-center gap-1.5 text-xs text-orange-400">
            <span>Cooldown:</span>
            <span class="font-mono">{{ cooldownText }}</span>
          </div>
        </div>
        
        <!-- Selected parents preview -->
        <div class="flex items-center gap-3 p-3 rounded-xl" 
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
          <div class="flex-1 flex items-center gap-2">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
              :class="selectedParent1 ? 'border-2 border-pink-500' : ''"
              style="background: rgba(255,255,255,0.06);">
              <FishSvg v-if="parent1Fish" :type="parent1Fish.type" :width="32" :height="22" />
              <span v-else class="text-white/30 text-xs">P1</span>
            </div>
            <div v-if="parent1Fish" class="min-w-0">
              <p class="text-xs font-medium text-white truncate">{{ parent1Fish.name }}</p>
              <p class="text-xs text-white/40 truncate">{{ fishName(parent1Fish.type) }}</p>
            </div>
          </div>
          
          <div class="text-xl" :class="selectedParent1 && selectedParent2 ? 'text-pink-400' : 'text-white/20'">
            ❤️
          </div>
          
          <div class="flex-1 flex items-center gap-2 justify-end">
            <div v-if="parent2Fish" class="min-w-0 text-right">
              <p class="text-xs font-medium text-white truncate">{{ parent2Fish.name }}</p>
              <p class="text-xs text-white/40 truncate">{{ fishName(parent2Fish.type) }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
              :class="selectedParent2 ? 'border-2 border-pink-500' : ''"
              style="background: rgba(255,255,255,0.06);">
              <FishSvg v-if="parent2Fish" :type="parent2Fish.type" :width="32" :height="22" />
              <span v-else class="text-white/30 text-xs">P2</span>
            </div>
          </div>
        </div>

        <!-- Start button or error -->
        <div class="mt-3">
          <UButton
            v-if="canStartBreeding"
            color="primary"
            size="sm"
            block
            :disabled="isOnCooldown"
            @click="handleStartBreeding">
            <span class="mr-1">🥚</span> Start Breeding
          </UButton>
          <p v-else-if="breedingError" class="text-xs text-center text-orange-400 py-2">
            {{ breedingError }}
          </p>
          <p v-else class="text-xs text-center text-white/40 py-2">
            Select two fish of the same species to breed
          </p>
        </div>
      </div>

      <!-- Fish selection grid -->
      <div class="flex-1 overflow-y-auto p-4">
        <!-- Parent 1 selection -->
        <div class="mb-4">
          <p class="text-xs text-white/50 mb-2 font-medium">
            {{ selectedParent1 ? 'Parent 1 Selected' : 'Choose Parent 1' }}
          </p>
          <div v-if="eligibleForParent1.length" 
            class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            <button
              v-for="f in eligibleForParent1"
              :key="f.id"
              class="relative rounded-xl p-2 flex flex-col items-center gap-1 transition-all"
              :class="selectedParent1 === f.id 
                ? 'ring-2 ring-pink-500 bg-pink-500/10' 
                : 'hover:bg-white/5'"
              style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);"
              @click="selectParent1(f.id)">
              <div class="w-10 h-8 flex items-center justify-center">
                <FishSvg :type="f.type" :width="28" :height="20" />
              </div>
              <p class="text-xs text-white truncate w-full text-center">{{ f.name }}</p>
              <div class="flex gap-1">
                <span v-if="f.genetics?.mutation" class="text-xs" :title="getMutationInfo(f.genetics.mutation)?.label">
                  {{ getMutationInfo(f.genetics.mutation)?.icon }}
                </span>
                <span v-if="f.generation" class="text-xs text-purple-400">G{{ f.generation }}</span>
              </div>
            </button>
          </div>
          <p v-else class="text-xs text-white/30 text-center py-4">
            No eligible fish (need {{ MIN_PARENT_HEALTH }}+ health, {{ MIN_PARENT_HUNGER }}+ hunger)
          </p>
        </div>

        <!-- Parent 2 selection (only show when parent 1 selected) -->
        <div v-if="selectedParent1">
          <p class="text-xs text-white/50 mb-2 font-medium">
            {{ selectedParent2 ? 'Parent 2 Selected' : 'Choose Parent 2' }}
            <span class="text-white/30">(same species)</span>
          </p>
          <div v-if="eligibleForParent2.length" 
            class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            <button
              v-for="f in eligibleForParent2"
              :key="f.id"
              class="relative rounded-xl p-2 flex flex-col items-center gap-1 transition-all"
              :class="selectedParent2 === f.id 
                ? 'ring-2 ring-pink-500 bg-pink-500/10' 
                : 'hover:bg-white/5'"
              style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);"
              @click="selectParent2(f.id)">
              <div class="w-10 h-8 flex items-center justify-center">
                <FishSvg :type="f.type" :width="28" :height="20" />
              </div>
              <p class="text-xs text-white truncate w-full text-center">{{ f.name }}</p>
              <div class="flex gap-1">
                <span v-if="f.genetics?.mutation" class="text-xs" :title="getMutationInfo(f.genetics.mutation)?.label">
                  {{ getMutationInfo(f.genetics.mutation)?.icon }}
                </span>
                <span v-if="f.generation" class="text-xs text-purple-400">G{{ f.generation }}</span>
              </div>
            </button>
          </div>
          <div v-else class="text-center py-6">
            <p class="text-xs text-white/30 mb-2">No compatible fish found</p>
            <p class="text-xs text-white/20">You need another {{ fishName(parent1Fish?.type || '') }} with good health</p>
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              class="mt-3"
              @click="emit('go-to-shop')">
              Buy More Fish
            </UButton>
          </div>
        </div>

        <!-- Info section -->
        <div class="mt-6 p-4 rounded-xl" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);">
          <p class="text-xs text-white/50 font-medium mb-2">Breeding Tips</p>
          <ul class="text-xs text-white/30 space-y-1">
            <li>- Parents must be the same species</li>
            <li>- Health {{ MIN_PARENT_HEALTH }}+ and Hunger {{ MIN_PARENT_HUNGER }}+ required</li>
            <li>- Babies inherit traits from parents with some variation</li>
            <li>- Rare mutations can occur (both good and bad!)</li>
            <li>- 5-minute cooldown between breeding sessions</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Result Modal -->
    <UModal v-model:open="showResultModal">
      <template #content>
        <div class="p-6 text-center">
          <template v-if="game.pendingBreedingResult?.success && game.pendingBreedingResult?.baby">
            <div class="text-5xl mb-4 animate-bounce">🎉</div>
            <h3 class="text-xl font-bold text-white mb-2">Baby Hatched!</h3>
            
            <div class="my-6 p-4 rounded-xl inline-block" 
              style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);">
              <div class="w-20 h-16 mx-auto mb-2 flex items-center justify-center">
                <FishSvg :type="game.pendingBreedingResult.baby.type" :width="56" :height="40" />
              </div>
              <p class="text-lg font-semibold text-white">{{ game.pendingBreedingResult.baby.name }}</p>
              <p class="text-sm text-white/50">{{ fishName(game.pendingBreedingResult.baby.type) }}</p>
              <p v-if="game.pendingBreedingResult.baby.generation" class="text-xs text-purple-400 mt-1">
                Generation {{ game.pendingBreedingResult.baby.generation }}
              </p>
            </div>

            <!-- Mutation display -->
            <div v-if="game.pendingBreedingResult.baby.genetics?.mutation" 
              class="mb-4 p-3 rounded-lg"
              :class="getMutationInfo(game.pendingBreedingResult.baby.genetics.mutation)?.isNegative 
                ? 'bg-red-500/10 border border-red-500/30' 
                : 'bg-green-500/10 border border-green-500/30'">
              <p class="text-sm font-medium" 
                :class="getMutationInfo(game.pendingBreedingResult.baby.genetics.mutation)?.isNegative 
                  ? 'text-red-400' 
                  : 'text-green-400'">
                {{ getMutationInfo(game.pendingBreedingResult.baby.genetics.mutation)?.icon }}
                {{ getMutationInfo(game.pendingBreedingResult.baby.genetics.mutation)?.label }} Mutation!
              </p>
              <p class="text-xs text-white/50 mt-1">
                {{ getMutationInfo(game.pendingBreedingResult.baby.genetics.mutation)?.description }}
              </p>
            </div>

            <!-- Stats preview -->
            <div class="text-xs text-white/40 space-y-1 mb-4">
              <p v-if="game.pendingBreedingResult.baby.genetics">
                Speed: {{ Math.round((game.pendingBreedingResult.baby.genetics.speedMod || 1) * 100) }}% |
                Coins: {{ Math.round((game.pendingBreedingResult.baby.genetics.coinMod || 1) * 100) }}% |
                Metabolism: {{ Math.round((game.pendingBreedingResult.baby.genetics.hungerMod || 1) * 100) }}%
              </p>
            </div>
          </template>

          <template v-else-if="!game.pendingBreedingResult?.success">
            <div class="text-5xl mb-4">💔</div>
            <h3 class="text-xl font-bold text-white mb-2">Breeding Failed</h3>
            <p class="text-sm text-white/50 mb-4">
              {{ game.pendingBreedingResult?.deathReason || 'The baby did not survive...' }}
            </p>
          </template>

          <UButton color="primary" block @click="handleCloseResult">
            {{ game.pendingBreedingResult?.success ? 'Welcome to the Tank!' : 'Try Again' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
