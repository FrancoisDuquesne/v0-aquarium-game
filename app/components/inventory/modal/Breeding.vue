<script setup lang="ts">
import {
  INCUBATOR_COST,
  BREEDING_COOLDOWN_MS,
  INCUBATION_DURATION_MS,
  MIN_PARENT_HEALTH,
  MIN_PARENT_HUNGER,
  MUTATION_DEFINITIONS,
  FISH_SHOP_ITEMS,
  type MutationType,
} from "~/utils/game-config";
import { useIntervalFn } from "@vueuse/core";

const emit = defineEmits<{ (e: "go-to-shop"): void }>();
const game = useGameStore();

// ─── Live clock drives all time-dependent computeds ─────────────────────────
const now = ref(Date.now());
useIntervalFn(() => { now.value = Date.now(); }, 500);

// Selection state
const selectedParent1 = ref<number | null>(null);
const selectedParent2 = ref<number | null>(null);
const showResultModal = ref(false);

// ─── Cooldown ────────────────────────────────────────────────────────────────
const cooldownRemaining = computed(() => {
  if (!game.incubator.lastBreedTime) return 0;
  return Math.max(0, BREEDING_COOLDOWN_MS - (now.value - game.incubator.lastBreedTime));
});
const isOnCooldown = computed(() => cooldownRemaining.value > 0);
const cooldownText = computed(() => {
  const secs = Math.ceil(cooldownRemaining.value / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${secs}s`;
});

// ─── Incubation progress ──────────────────────────────────────────────────────
const progressPercent = computed(() => {
  if (!game.incubator.breeding) return 0;
  const elapsed = now.value - game.incubator.breeding.startedAt;
  return Math.min(100, Math.round((elapsed / INCUBATION_DURATION_MS) * 100));
});
const remainingMs = computed(() => {
  if (!game.incubator.breeding) return 0;
  return Math.max(0, INCUBATION_DURATION_MS - (now.value - game.incubator.breeding.startedAt));
});
const remainingTime = computed(() => {
  const secs = Math.ceil(remainingMs.value / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
});

// ─── Parent computed ──────────────────────────────────────────────────────────
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
  return game.canBreed(selectedParent1.value, selectedParent2.value).valid;
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

watch(() => game.pendingBreedingResult, (result) => {
  if (result) showResultModal.value = true;
});

const shopNameMap = Object.fromEntries(FISH_SHOP_ITEMS.map(item => [item.type, item.name]));
function fishName(type: string) { return shopNameMap[type] ?? type; }

function selectParent1(id: number) {
  if (selectedParent1.value === id) { selectedParent1.value = null; return; }
  selectedParent1.value = id;
  if (selectedParent2.value && !eligibleForParent2.value.some(f => f.id === selectedParent2.value))
    selectedParent2.value = null;
}
function selectParent2(id: number) {
  selectedParent2.value = selectedParent2.value === id ? null : id;
}
function handleStartBreeding() {
  if (!selectedParent1.value || !selectedParent2.value) return;
  const result = game.startBreeding(selectedParent1.value, selectedParent2.value);
  if (result.success) { selectedParent1.value = null; selectedParent2.value = null; }
}
function handleBuyIncubator() { game.buyIncubator(); }
function handleCancelBreeding() { game.cancelBreeding(); }
function handleCloseResult() { game.clearBreedingResult(); showResultModal.value = false; }
function getMutationInfo(mutation?: MutationType) {
  if (!mutation) return null;
  return MUTATION_DEFINITIONS[mutation];
}
</script>

<template>
  <div class="breed-root">

    <!-- ══ NOT OWNED ══════════════════════════════════════════════════════════ -->
    <div v-if="!game.incubator.owned" class="locked-state">
      <div class="locked-egg-wrap">
        <div class="locked-ring r1" /><div class="locked-ring r2" /><div class="locked-ring r3" />
        <span class="locked-egg-emoji">🥚</span>
      </div>
      <h3 class="locked-title">Incubator Required</h3>
      <p class="locked-desc">Unlock the incubator to breed your fish and discover rare genetic mutations.</p>
      <button
        class="unlock-btn"
        :class="{ 'unlock-btn--disabled': game.coins < INCUBATOR_COST }"
        :disabled="game.coins < INCUBATOR_COST"
        @click="handleBuyIncubator">
        <span>🥚</span>
        <span>Unlock Incubator</span>
        <span class="coin-pill">{{ INCUBATOR_COST.toLocaleString() }} 🪙</span>
      </button>
      <p v-if="game.coins < INCUBATOR_COST" class="locked-short">
        {{ (INCUBATOR_COST - Math.floor(game.coins)).toLocaleString() }} more coins needed
      </p>
    </div>

    <!-- ══ INCUBATING ══════════════════════════════════════════════════════════ -->
    <div v-else-if="game.incubator.breeding" class="incubating-view">

      <!-- Parents row -->
      <div class="parents-row">
        <div class="parent-chip">
          <div class="parent-fish-box">
            <FishSvg v-if="breedingParent1" :type="breedingParent1.type" :width="34" :height="24" />
            <span v-else class="text-xl">🐟</span>
          </div>
          <div class="parent-info">
            <p class="parent-name">{{ breedingParent1?.name ?? 'Parent 1' }}</p>
            <p class="parent-species">{{ fishName(breedingParent1?.type ?? '') }}</p>
          </div>
        </div>

        <!-- Animated egg -->
        <div class="egg-hub">
          <div class="egg-ring rg1" /><div class="egg-ring rg2" /><div class="egg-ring rg3" />
          <span class="egg-face">🥚</span>
        </div>

        <div class="parent-chip parent-chip--right">
          <div class="parent-info" style="text-align:right">
            <p class="parent-name">{{ breedingParent2?.name ?? 'Parent 2' }}</p>
            <p class="parent-species">{{ fishName(breedingParent2?.type ?? '') }}</p>
          </div>
          <div class="parent-fish-box">
            <FishSvg v-if="breedingParent2" :type="breedingParent2.type" :width="34" :height="24" />
            <span v-else class="text-xl">🐟</span>
          </div>
        </div>
      </div>

      <!-- Progress card -->
      <div class="progress-card">
        <div class="progress-header">
          <span class="progress-label">INCUBATING</span>
          <span class="countdown">{{ remainingTime }}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }">
            <div class="progress-shimmer" />
          </div>
        </div>
        <div class="progress-footer">
          <span class="pct-text">{{ progressPercent }}% complete</span>
        </div>
      </div>

      <!-- Baby preview -->
      <div class="baby-card">
        <div class="baby-fish-box">
          <FishSvg :type="game.incubator.breeding.babyType" :width="32" :height="22" />
        </div>
        <div class="baby-info">
          <p class="baby-label">Expected offspring</p>
          <p class="baby-name">{{ game.incubator.breeding.babyName }}</p>
          <p class="baby-species">{{ fishName(game.incubator.breeding.babyType) }}</p>
        </div>
        <span class="baby-sparkle">✨</span>
      </div>

      <button class="cancel-btn" @click="handleCancelBreeding">Cancel Breeding</button>
    </div>

    <!-- ══ SELECTION ══════════════════════════════════════════════════════════ -->
    <div v-else class="selection-view">

      <!-- Sticky header -->
      <div class="sel-header">
        <!-- Slots -->
        <div class="slots-row">
          <!-- Slot 1 -->
          <div class="parent-slot" :class="{ 'parent-slot--filled': !!parent1Fish }">
            <template v-if="parent1Fish">
              <div class="slot-fish">
                <FishSvg :type="parent1Fish.type" :width="28" :height="20" />
              </div>
              <div class="slot-text">
                <p class="slot-name">{{ parent1Fish.name }}</p>
                <div class="slot-badges">
                  <span v-if="parent1Fish.genetics?.mutation">{{ getMutationInfo(parent1Fish.genetics.mutation)?.icon }}</span>
                  <span v-if="parent1Fish.generation" class="gen-tag">G{{ parent1Fish.generation }}</span>
                </div>
              </div>
              <button class="slot-x" @click.stop="selectedParent1 = null">✕</button>
            </template>
            <span v-else class="slot-empty">Parent 1</span>
          </div>

          <!-- Heart -->
          <div class="heart-sep" :class="{ 'heart-sep--active': parent1Fish && parent2Fish }">
            {{ parent1Fish && parent2Fish ? '❤️' : '♡' }}
          </div>

          <!-- Slot 2 -->
          <div class="parent-slot parent-slot--right" :class="{ 'parent-slot--filled': !!parent2Fish }">
            <template v-if="parent2Fish">
              <button class="slot-x" @click.stop="selectedParent2 = null">✕</button>
              <div class="slot-text" style="text-align:right">
                <p class="slot-name">{{ parent2Fish.name }}</p>
                <div class="slot-badges" style="justify-content:flex-end">
                  <span v-if="parent2Fish.generation" class="gen-tag">G{{ parent2Fish.generation }}</span>
                  <span v-if="parent2Fish.genetics?.mutation">{{ getMutationInfo(parent2Fish.genetics.mutation)?.icon }}</span>
                </div>
              </div>
              <div class="slot-fish">
                <FishSvg :type="parent2Fish.type" :width="28" :height="20" />
              </div>
            </template>
            <span v-else class="slot-empty">Parent 2</span>
          </div>
        </div>

        <!-- CTA row -->
        <div class="cta-row">
          <button
            v-if="canStartBreeding"
            class="breed-btn"
            :class="{ 'breed-btn--cooldown': isOnCooldown }"
            :disabled="isOnCooldown"
            @click="handleStartBreeding">
            <template v-if="isOnCooldown">
              <span class="cooldown-icon">⏱</span>
              <span class="font-mono">{{ cooldownText }}</span>
            </template>
            <template v-else>
              <span>🥚</span><span>Start Breeding</span>
            </template>
          </button>
          <p v-else-if="breedingError" class="cta-error">{{ breedingError }}</p>
          <p v-else class="cta-hint">Select two fish of the same species</p>

          <div v-if="isOnCooldown && !canStartBreeding" class="cooldown-badge">
            <span class="cooldown-badge-label">Cooldown</span>
            <span class="cooldown-badge-time">{{ cooldownText }}</span>
          </div>
        </div>
      </div>

      <!-- Scrollable fish grid -->
      <div class="fish-scroll">

        <!-- Parent 1 grid -->
        <div class="grid-section">
          <p class="grid-label">
            <span :class="selectedParent1 ? 'text-pink-400' : 'text-white/35'">
              {{ selectedParent1 ? '✓ Parent 1 Selected' : 'Choose Parent 1' }}
            </span>
          </p>
          <div v-if="eligibleForParent1.length" class="fish-grid">
            <button
              v-for="f in eligibleForParent1"
              :key="f.id"
              class="fish-card"
              :class="{ 'fish-card--sel': selectedParent1 === f.id }"
              @click="selectParent1(f.id)">
              <div class="fc-icon"><FishSvg :type="f.type" :width="26" :height="18" /></div>
              <p class="fc-name">{{ f.name }}</p>
              <div class="fc-badges">
                <span v-if="f.genetics?.mutation" class="text-[10px]">{{ getMutationInfo(f.genetics.mutation)?.icon }}</span>
                <span v-if="f.generation" class="gen-dot">G{{ f.generation }}</span>
              </div>
              <div class="fc-bars">
                <div class="fc-bar" :style="{ width: f.health + '%', background: '#22d3ee' }" />
                <div class="fc-bar" :style="{ width: f.hunger + '%', background: '#f59e0b' }" />
              </div>
            </button>
          </div>
          <p v-else class="grid-empty">No eligible fish — need {{ MIN_PARENT_HEALTH }}+ health & {{ MIN_PARENT_HUNGER }}+ hunger</p>
        </div>

        <!-- Parent 2 grid (only when P1 chosen) -->
        <div v-if="selectedParent1" class="grid-section">
          <p class="grid-label">
            <span :class="selectedParent2 ? 'text-pink-400' : 'text-white/35'">
              {{ selectedParent2 ? '✓ Parent 2 Selected' : 'Choose Parent 2' }}
            </span>
            <span class="text-white/20 text-[10px] ml-1">(same species)</span>
          </p>
          <div v-if="eligibleForParent2.length" class="fish-grid">
            <button
              v-for="f in eligibleForParent2"
              :key="f.id"
              class="fish-card"
              :class="{ 'fish-card--sel': selectedParent2 === f.id }"
              @click="selectParent2(f.id)">
              <div class="fc-icon"><FishSvg :type="f.type" :width="26" :height="18" /></div>
              <p class="fc-name">{{ f.name }}</p>
              <div class="fc-badges">
                <span v-if="f.genetics?.mutation" class="text-[10px]">{{ getMutationInfo(f.genetics.mutation)?.icon }}</span>
                <span v-if="f.generation" class="gen-dot">G{{ f.generation }}</span>
              </div>
              <div class="fc-bars">
                <div class="fc-bar" :style="{ width: f.health + '%', background: '#22d3ee' }" />
                <div class="fc-bar" :style="{ width: f.hunger + '%', background: '#f59e0b' }" />
              </div>
            </button>
          </div>
          <div v-else class="no-partner">
            <p class="text-xs text-white/30">No compatible partner found</p>
            <p class="text-[10px] text-white/20 mt-0.5">You need another {{ fishName(parent1Fish?.type || '') }}</p>
            <button class="shop-link" @click="emit('go-to-shop')">Browse Shop →</button>
          </div>
        </div>

        <!-- Tips -->
        <div class="tips-row">
          <span class="tip">🧬 Traits inherit</span>
          <span class="tip">⚡ Rare mutations</span>
          <span class="tip">⏱ 5 min cooldown</span>
          <span class="tip">❤️ Same species only</span>
        </div>
      </div>
    </div>

    <!-- ══ RESULT MODAL ════════════════════════════════════════════════════════ -->
    <UModal v-model:open="showResultModal">
      <template #content>
        <div class="result-wrap">
          <template v-if="game.pendingBreedingResult?.success && game.pendingBreedingResult?.baby">
            <div class="result-glow" />
            <div class="text-4xl mb-2" style="animation: bounce 1s ease infinite">🎉</div>
            <h3 class="result-title">Baby Hatched!</h3>

            <div class="result-fish-card">
              <div style="width:64px;height:48px;display:flex;align-items:center;justify-content:center;margin:0 auto 8px">
                <FishSvg :type="game.pendingBreedingResult.baby.type" :width="52" :height="36" />
              </div>
              <p class="result-fish-name">{{ game.pendingBreedingResult.baby.name }}</p>
              <p class="result-fish-species">{{ fishName(game.pendingBreedingResult.baby.type) }}</p>
              <p v-if="game.pendingBreedingResult.baby.generation" class="result-gen">
                Generation {{ game.pendingBreedingResult.baby.generation }}
              </p>
            </div>

            <div
              v-if="game.pendingBreedingResult.baby.genetics?.mutation"
              class="mutation-card"
              :class="getMutationInfo(game.pendingBreedingResult.baby.genetics.mutation)?.isNegative
                ? 'mutation-card--bad' : 'mutation-card--good'">
              <p class="mutation-name">
                {{ getMutationInfo(game.pendingBreedingResult.baby.genetics.mutation)?.icon }}
                {{ getMutationInfo(game.pendingBreedingResult.baby.genetics.mutation)?.label }} Mutation
              </p>
              <p class="mutation-desc">{{ getMutationInfo(game.pendingBreedingResult.baby.genetics.mutation)?.description }}</p>
            </div>

            <div v-if="game.pendingBreedingResult.baby.genetics" class="stat-row">
              <div class="stat-chip"><span style="color:#22d3ee">⚡</span> {{ Math.round((game.pendingBreedingResult.baby.genetics.speedMod || 1) * 100) }}%</div>
              <div class="stat-chip"><span style="color:#fbbf24">🪙</span> {{ Math.round((game.pendingBreedingResult.baby.genetics.coinMod || 1) * 100) }}%</div>
              <div class="stat-chip"><span style="color:#4ade80">🍽</span> {{ Math.round((game.pendingBreedingResult.baby.genetics.hungerMod || 1) * 100) }}%</div>
            </div>
          </template>

          <template v-else>
            <div class="text-4xl mb-2">💔</div>
            <h3 class="result-title">Breeding Failed</h3>
            <p class="result-fail-msg">{{ game.pendingBreedingResult?.deathReason || 'The baby did not survive...' }}</p>
          </template>

          <button class="breed-btn result-breed-btn" @click="handleCloseResult">
            {{ game.pendingBreedingResult?.success ? 'Welcome to the Tank! 🐟' : 'Try Again' }}
          </button>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
/* ─── Root ─────────────────────────────────────────────────────────────── */
.breed-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: inherit;
}

/* ─── Not-owned / locked state ──────────────────────────────────────────── */
.locked-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  gap: 14px;
  text-align: center;
}
.locked-egg-wrap {
  position: relative;
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.locked-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid;
  animation: ring-breathe 3.2s ease-in-out infinite;
}
.r1 { width: 80px; height: 80px; border-color: rgba(236,72,153,0.22); animation-delay: 0s; }
.r2 { width: 60px; height: 60px; border-color: rgba(168,85,247,0.22); animation-delay: 0.7s; }
.r3 { width: 40px; height: 40px; border-color: rgba(34,211,238,0.18); animation-delay: 1.4s; }
@keyframes ring-breathe {
  0%,100% { opacity:.4; transform:scale(1); }
  50% { opacity:.9; transform:scale(1.07); }
}
.locked-egg-emoji {
  font-size: 30px;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 0 10px rgba(236,72,153,0.4));
}
.locked-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.01em;
}
.locked-desc {
  font-size: 12px;
  color: rgba(255,255,255,0.38);
  max-width: 240px;
  line-height: 1.6;
}
.unlock-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(236,72,153,0.28), rgba(168,85,247,0.28));
  border: 1px solid rgba(236,72,153,0.38);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.unlock-btn:hover:not(.unlock-btn--disabled) {
  background: linear-gradient(135deg, rgba(236,72,153,0.44), rgba(168,85,247,0.44));
  box-shadow: 0 0 18px rgba(236,72,153,0.22);
}
.unlock-btn--disabled { opacity: 0.45; cursor: not-allowed; }
.coin-pill {
  background: rgba(251,191,36,0.15);
  border: 1px solid rgba(251,191,36,0.28);
  color: #fbbf24;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 20px;
  font-weight: 700;
}
.locked-short { font-size: 11px; color: rgba(251,191,36,0.7); }

/* ─── Incubating view ───────────────────────────────────────────────────── */
.incubating-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 14px 14px 16px;
  gap: 10px;
  overflow-y: auto;
}

/* Parents row */
.parents-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.parent-chip {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border-radius: 13px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  min-width: 0;
}
.parent-chip--right { flex-direction: row-reverse; }
.parent-fish-box {
  width: 40px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.06);
  border-radius: 9px;
  flex-shrink: 0;
}
.parent-info { min-width: 0; }
.parent-name { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.parent-species { font-size: 10px; color: rgba(255,255,255,0.32); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Animated egg */
.egg-hub {
  position: relative;
  width: 54px;
  height: 54px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.egg-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid;
  animation: egg-pulse 2.6s ease-out infinite;
}
.rg1 { width: 46px; height: 46px; border-color: rgba(236,72,153,0.55); animation-delay: 0s; }
.rg2 { width: 46px; height: 46px; border-color: rgba(168,85,247,0.45); animation-delay: 0.87s; }
.rg3 { width: 46px; height: 46px; border-color: rgba(34,211,238,0.35); animation-delay: 1.73s; }
@keyframes egg-pulse {
  0%   { transform: scale(1);   opacity: .9; }
  80%  { transform: scale(2.1); opacity: 0; }
  100% { transform: scale(2.1); opacity: 0; }
}
.egg-face {
  position: relative;
  z-index: 2;
  font-size: 24px;
  animation: egg-rock 2.4s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(236,72,153,0.55));
}
@keyframes egg-rock {
  0%,100% { transform: rotate(-5deg) scale(1); }
  30%     { transform: rotate(5deg) scale(1.06); }
  70%     { transform: rotate(-3deg) scale(0.96); }
}

/* Progress card */
.progress-card {
  border-radius: 14px;
  background: rgba(236,72,153,0.07);
  border: 1px solid rgba(236,72,153,0.18);
  padding: 12px 14px;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.progress-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.3);
}
.countdown {
  font-size: 22px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(90deg, #ec4899, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: 'SF Mono', 'Fira Code', ui-monospace, monospace;
  letter-spacing: -0.03em;
}
.progress-track {
  height: 9px;
  border-radius: 99px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
  position: relative;
}
.progress-fill {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #ec4899 0%, #a855f7 55%, #22d3ee 100%);
  position: relative;
  overflow: hidden;
  transition: width 0.5s ease;
  min-width: 4px;
}
.progress-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.38) 50%, transparent 100%);
  animation: shimmer 2s linear infinite;
}
@keyframes shimmer {
  from { transform: translateX(-150%); }
  to   { transform: translateX(350%); }
}
.progress-footer { margin-top: 7px; text-align: center; }
.pct-text { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.55); }

/* Baby card */
.baby-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 13px;
  background: rgba(168,85,247,0.07);
  border: 1px solid rgba(168,85,247,0.2);
}
.baby-fish-box {
  width: 44px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.06);
  border-radius: 9px;
  flex-shrink: 0;
}
.baby-info { flex: 1; min-width: 0; }
.baby-label { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; color: rgba(236,72,153,0.65); text-transform: uppercase; margin-bottom: 2px; }
.baby-name { font-size: 13px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.baby-species { font-size: 10px; color: rgba(255,255,255,0.38); }
.baby-sparkle { font-size: 18px; opacity: 0.55; flex-shrink: 0; animation: sparkle-spin 3s ease-in-out infinite; }
@keyframes sparkle-spin {
  0%,100% { opacity:.4; transform:scale(1) rotate(0deg); }
  50% { opacity:.8; transform:scale(1.15) rotate(20deg); }
}

/* Cancel */
.cancel-btn {
  width: 100%;
  padding: 9px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.09);
  color: rgba(255,255,255,0.32);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  margin-top: auto;
}
.cancel-btn:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.55); }

/* ─── Selection view ────────────────────────────────────────────────────── */
.selection-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Sticky header */
.sel-header {
  padding: 10px 12px 10px;
  background: rgba(2,6,23,0.97);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  position: sticky;
  top: 0;
  z-index: 10;
}
.slots-row {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 9px;
}
.parent-slot {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 8px 10px;
  min-height: 50px;
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px dashed rgba(255,255,255,0.12);
  transition: all 0.2s;
}
.parent-slot--right { flex-direction: row-reverse; }
.parent-slot--filled {
  background: rgba(236,72,153,0.07);
  border: 1px solid rgba(236,72,153,0.28);
  border-style: solid;
}
.slot-empty { font-size: 11px; color: rgba(255,255,255,0.22); font-weight: 500; }
.slot-fish {
  width: 34px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.06);
  border-radius: 7px;
  flex-shrink: 0;
}
.slot-text { min-width: 0; flex: 1; }
.slot-name { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slot-badges { display: flex; gap: 4px; align-items: center; margin-top: 1px; }
.gen-tag {
  font-size: 9px;
  background: rgba(168,85,247,0.22);
  color: #c084fc;
  border-radius: 4px;
  padding: 0 4px;
  font-weight: 700;
  line-height: 14px;
}
.slot-x {
  font-size: 11px;
  color: rgba(255,255,255,0.28);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 2px;
  flex-shrink: 0;
  transition: color 0.15s;
  line-height: 1;
}
.slot-x:hover { color: rgba(255,255,255,0.65); }

/* Heart separator */
.heart-sep {
  width: 28px;
  flex-shrink: 0;
  text-align: center;
  font-size: 16px;
  opacity: 0.3;
  transition: opacity 0.2s;
}
.heart-sep--active {
  opacity: 1;
  animation: heartbeat 1.4s ease-in-out infinite;
}
@keyframes heartbeat {
  0%,100% { transform: scale(1); }
  20% { transform: scale(1.25); }
  40% { transform: scale(0.94); }
  60% { transform: scale(1.12); }
}

/* CTA row */
.cta-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.breed-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(236,72,153,0.32), rgba(168,85,247,0.32));
  border: 1px solid rgba(236,72,153,0.42);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.breed-btn:hover:not(:disabled):not(.breed-btn--cooldown) {
  background: linear-gradient(135deg, rgba(236,72,153,0.48), rgba(168,85,247,0.48));
  box-shadow: 0 0 16px rgba(236,72,153,0.22);
}
.breed-btn--cooldown { opacity: 0.6; cursor: not-allowed; }
.cooldown-icon { font-size: 12px; }
.cta-error { flex: 1; text-align: center; font-size: 11px; color: rgba(251,191,36,0.78); padding: 2px 0; }
.cta-hint { flex: 1; text-align: center; font-size: 11px; color: rgba(255,255,255,0.28); padding: 2px 0; }
.cooldown-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.2);
  flex-shrink: 0;
}
.cooldown-badge-label { font-size: 9px; color: rgba(245,158,11,0.65); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
.cooldown-badge-time { font-size: 13px; font-weight: 700; color: #f59e0b; font-variant-numeric: tabular-nums; font-family: ui-monospace, monospace; }

/* Fish scroll area */
.fish-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 16px;
}

/* Grid sections */
.grid-section { margin-bottom: 16px; }
.grid-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
  padding-left: 2px;
}
.grid-empty {
  font-size: 11px;
  color: rgba(255,255,255,0.25);
  text-align: center;
  padding: 20px 0;
}
.fish-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
@media (min-width: 400px) { .fish-grid { grid-template-columns: repeat(4, 1fr); } }

/* Fish cards */
.fish-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 6px 7px;
  border-radius: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  cursor: pointer;
  transition: all 0.13s;
  position: relative;
}
.fish-card:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.13);
}
.fish-card--sel {
  background: rgba(236,72,153,0.13) !important;
  border-color: rgba(236,72,153,0.48) !important;
  box-shadow: 0 0 0 1px rgba(236,72,153,0.18) inset;
}
.fc-icon { width: 36px; height: 26px; display: flex; align-items: center; justify-content: center; }
.fc-name { font-size: 10px; color: rgba(255,255,255,0.78); font-weight: 600; text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fc-badges { display: flex; gap: 3px; align-items: center; min-height: 13px; }
.gen-dot {
  font-size: 8px;
  background: rgba(168,85,247,0.22);
  color: #c084fc;
  border-radius: 3px;
  padding: 0 3px;
  font-weight: 700;
  line-height: 13px;
}
.fc-bars { display: flex; flex-direction: column; gap: 2px; width: 100%; padding: 0 2px; }
.fc-bar {
  height: 2px;
  border-radius: 99px;
  opacity: 0.65;
  max-width: 100%;
}

/* No partner */
.no-partner { text-align: center; padding: 20px 0; }
.shop-link {
  font-size: 11px;
  color: rgba(34,211,238,0.7);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  margin-top: 10px;
  display: inline-block;
  transition: color 0.15s;
}
.shop-link:hover { color: #22d3ee; }

/* Tips */
.tips-row { display: flex; flex-wrap: wrap; gap: 5px; padding-top: 4px; }
.tip {
  font-size: 10px;
  color: rgba(255,255,255,0.28);
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
  padding: 3px 8px;
}

/* ─── Result modal ──────────────────────────────────────────────────────── */
.result-wrap {
  padding: 24px 20px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.result-glow {
  position: absolute;
  top: -50px; left: 50%;
  transform: translateX(-50%);
  width: 220px; height: 140px;
  background: radial-gradient(ellipse, rgba(168,85,247,0.22), transparent 70%);
  pointer-events: none;
}
.result-title {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.01em;
  margin: 4px 0 16px;
}
.result-fish-card {
  display: inline-block;
  padding: 16px 28px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 14px;
}
.result-fish-name { font-size: 15px; font-weight: 700; color: #fff; margin-top: 4px; }
.result-fish-species { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; }
.result-gen { font-size: 11px; color: #c084fc; margin-top: 4px; }
.mutation-card {
  padding: 10px 14px;
  border-radius: 11px;
  text-align: left;
  margin-bottom: 12px;
}
.mutation-card--good { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); }
.mutation-card--bad  { background: rgba(239,68,68,0.1);  border: 1px solid rgba(239,68,68,0.25); }
.mutation-name {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}
.mutation-card--good .mutation-name { color: #86efac; }
.mutation-card--bad  .mutation-name { color: #fca5a5; }
.mutation-desc { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 3px; line-height: 1.5; }
.stat-row { display: flex; gap: 7px; justify-content: center; margin-bottom: 16px; }
.stat-chip {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 5px 11px;
  border-radius: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.09);
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.72);
}
.result-fail-msg { font-size: 13px; color: rgba(255,255,255,0.45); margin-bottom: 18px; line-height: 1.6; }
.result-breed-btn { width: 100%; flex: unset; }
</style>
