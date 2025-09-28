<script setup lang="ts">
const game = useGameStore();

const container = ref<HTMLElement | null>(null);
const size = ref({ w: 0, h: 0 });
const fishEls = new Map<number, HTMLElement>();
const positions = new Map<number, { x: number; y: number }>();
const velocities = new Map<number, { vx: number; vy: number }>();
const targets = new Map<number, { x: number; y: number }>();
const faces = new Map<number, 1 | -1>();
const softTargets = new Map<number, { x: number; y: number }>();
const nextWaypointAt = new Map<number, number>();

type Flake = {
  id: number;
  x: number;
  y: number;
  state: "sinking" | "resting";
  createdAt: number;
  restStart?: number;
};
const flakeIds = ref<number[]>([]);
const flakeEls = new Map<number, HTMLElement>();
const flakes = new Map<number, Flake>();
const lastHandledAutoFeed = ref<number | null>(null);
const dropAnchors = new Map<
  number,
  { left: number; startTop: number; endTop: number; duration: number }
>();

const activeFishIds = new Set<number>();
const fishHunger = new Map<number, number>();
const flakesToRemove: number[] = [];
let frameHandle: number | null = null;

const backgroundImage = computed(() => game.background);

type CoinDropView = {
  id: number;
  value: number;
  x: number;
  y: number;
  spawnY: number;
  fallDurationMs: number;
  fishId: number | null;
  type: "coin" | "stack" | "bill";
  source: string;
};

const placedDecorations = computed(
  () =>
    game.decorations
      .map((id) => {
        const preset = DECORATION_PRESETS[id];
        if (!preset) return null;
        return {
          id,
          label: preset.label,
          emoji: preset.emoji,
          style: {
            left: preset.left,
            bottom: preset.bottom,
            transform: `translate(-50%, 0) scale(${preset.scale})`,
          },
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      label: string;
      emoji: string;
      style: Record<string, string>;
    }>
);

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

onMounted(() => {
  const ro = new ResizeObserver(() => {
    if (!container.value) return;
    const r = container.value.getBoundingClientRect();
    size.value = { w: r.width, h: r.height };
  });
  if (container.value) {
    const r = container.value.getBoundingClientRect();
    size.value = { w: r.width, h: r.height };
    ro.observe(container.value);
  }
  const loop = (ts: number) => {
    tick(ts);
    frameHandle = requestAnimationFrame(loop);
  };
  frameHandle = requestAnimationFrame(loop);
  onBeforeUnmount(() => {
    ro.disconnect();
    if (frameHandle != null) {
      cancelAnimationFrame(frameHandle);
      frameHandle = null;
    }
  });
});

function pctToPx(xPct: number, yPct: number) {
  return { x: (xPct / 100) * size.value.w, y: (yPct / 100) * size.value.h };
}
function setNodeTransform(
  node: HTMLElement,
  xPct: number,
  yPct: number,
  face: 1 | -1
) {
  const { x, y } = pctToPx(xPct, yPct);
  node.style.transform = `translate3d(${x}px, ${y}px, 0) scaleX(${face})`;
}

let lastTs = performance.now();
function tick(ts: number) {
  const dt = ts - lastTs;
  lastTs = ts;

  if (typeof document !== "undefined" && document.hidden) {
    return;
  }

  const dtSec = Math.max(0.001, dt / 1000);
  const now = ts;

  activeFishIds.clear();
  fishHunger.clear();

  game.fish.forEach((f) => {
    activeFishIds.add(f.id);
    fishHunger.set(f.id, f.hunger);
    if (!positions.has(f.id)) positions.set(f.id, { x: f.x, y: f.y });
    if (!velocities.has(f.id))
      velocities.set(f.id, {
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
      });
    if (!targets.has(f.id)) targets.set(f.id, { x: f.x, y: f.y });
    if (!softTargets.has(f.id)) softTargets.set(f.id, { x: f.x, y: f.y });
    if (!nextWaypointAt.has(f.id))
      nextWaypointAt.set(
        f.id,
        now +
          (FISH_CONFIG.WAYPOINT_MIN_INTERVAL +
            Math.random() *
              (FISH_CONFIG.WAYPOINT_MAX_INTERVAL -
                FISH_CONFIG.WAYPOINT_MIN_INTERVAL))
      );
    if (!faces.has(f.id)) faces.set(f.id, 1);
  });

  for (const id of positions.keys()) {
    if (!activeFishIds.has(id)) {
      positions.delete(id);
      velocities.delete(id);
      targets.delete(id);
      softTargets.delete(id);
      nextWaypointAt.delete(id);
      faces.delete(id);
      fishEls.delete(id);
    }
  }

  flakesToRemove.length = 0;
  flakes.forEach((flake, id) => {
    if (flake.state === "sinking") {
      flake.y = Math.min(FLOOR_Y, flake.y + (SINK_SPEED_PER_S * dt) / 1000);
      if (flake.y >= FLOOR_Y) {
        flake.state = "resting";
        flake.restStart = now;
      }
    } else if (
      flake.state === "resting" &&
      flake.restStart &&
      now - flake.restStart >= REST_DURATION_MS
    ) {
      flakesToRemove.push(id);
    }

    const el = flakeEls.get(id);
    if (el) {
      const { x, y } = pctToPx(flake.x, flake.y);
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  });

  if (flakesToRemove.length) {
    flakesToRemove.forEach((id) => {
      flakes.delete(id);
      flakeEls.delete(id);
    });
    flakeIds.value = flakeIds.value.filter((i) => !flakesToRemove.includes(i));
  }

  positions.forEach((pos, id) => {
    let chasingSinkingFlake = false;
    const dueAt = nextWaypointAt.get(id) || now;
    if (now >= dueAt) {
      const next = generateWaypoint(pos.x, pos.y, FISH_CONFIG.LEVY_MU);
      targets.set(id, next);
      const delay =
        FISH_CONFIG.WAYPOINT_MIN_INTERVAL +
        Math.random() *
          (FISH_CONFIG.WAYPOINT_MAX_INTERVAL -
            FISH_CONFIG.WAYPOINT_MIN_INTERVAL);
      nextWaypointAt.set(id, now + delay);
      faces.set(id, next.x > pos.x ? 1 : -1);
    }

    let base = targets.get(id) || pos;

    let nearest: Flake | null = null;
    let nearestDist = Infinity;
    const hunger = fishHunger.get(id) ?? 100;
    const isHungry = hunger < 100;

    if (isHungry && flakes.size) {
      flakes.forEach((fl) => {
        const dx = fl.x - pos.x;
        const dy = fl.y - pos.y;
        const d = Math.hypot(dx, dy);
        if (d < nearestDist) {
          nearest = fl;
          nearestDist = d;
        }
      });
    }

    if (nearest && nearestDist <= DETECT_RADIUS) {
      base = { x: nearest.x, y: nearest.y };
      targets.set(id, base);
      chasingSinkingFlake = nearest.state === "sinking";
      if (nearestDist <= EAT_RADIUS) {
        game.feedFish(id, FEED_AMOUNT);
        flakes.delete(nearest.id);
        flakeEls.delete(nearest.id);
        flakeIds.value = flakeIds.value.filter((i) => i !== nearest!.id);
      }
    }

    const soft = softTargets.get(id) || { x: pos.x, y: pos.y };
    const tau = 0.4;
    const alpha = 1 - Math.exp(-dtSec / tau);
    const softX = soft.x + (base.x - soft.x) * alpha;
    const softY = soft.y + (base.y - soft.y) * alpha;
    softTargets.set(id, { x: softX, y: softY });

    const vel = velocities.get(id) || { vx: 0, vy: 0 };
    const dx = softX - pos.x;
    const dy = softY - pos.y;
    const dist = Math.hypot(dx, dy) || 1;
    const maxSpeed = 16;
    const slowRadius = 8;
    const minSpeed = chasingSinkingFlake ? maxSpeed * 0.6 : 0;
    const desiredSpeed = Math.min(
      maxSpeed,
      Math.max(minSpeed, maxSpeed * (dist / slowRadius))
    );
    let ax = (dx / dist) * desiredSpeed - vel.vx;
    let ay = (dy / dist) * desiredSpeed - vel.vy;
    const maxAcc = 50 * dtSec;
    const aLen = Math.hypot(ax, ay);
    if (aLen > maxAcc) {
      ax = (ax / aLen) * maxAcc;
      ay = (ay / aLen) * maxAcc;
    }
    vel.vx += ax;
    vel.vy += ay;
    const vLen = Math.hypot(vel.vx, vel.vy);
    if (vLen > maxSpeed) {
      vel.vx = (vel.vx / vLen) * maxSpeed;
      vel.vy = (vel.vy / vLen) * maxSpeed;
    }
    pos.x += vel.vx * dtSec;
    pos.y += vel.vy * dtSec;
    pos.x = Math.max(
      FISH_CONFIG.BOUNDARY_LEFT,
      Math.min(FISH_CONFIG.BOUNDARY_RIGHT, pos.x)
    );
    pos.y = Math.max(
      FISH_CONFIG.BOUNDARY_TOP,
      Math.min(FISH_CONFIG.BOUNDARY_BOTTOM, pos.y)
    );
    velocities.set(id, vel);

    const node = fishEls.get(id);
    if (node) {
      const face = vel.vx >= 0 ? 1 : -1;
      const prev = faces.get(id) || 1;
      if (face !== prev) {
        const inner = node.querySelector(".fish-inner") as HTMLElement | null;
        if (inner) {
          inner.classList.remove("flip-once");
          void (inner as any).offsetWidth;
          inner.classList.add("flip-once");
          setTimeout(() => inner.classList.remove("flip-once"), 180);
        }
      }
      faces.set(id, face as 1 | -1);
      setNodeTransform(node, pos.x, pos.y, face as 1 | -1);
    }
  });
}

function setFishRef(id: number) {
  return (el: Element | ComponentPublicInstance | null) => {
    const node = (el as any)?.$el ?? (el as HTMLElement);
    if (node) {
      fishEls.set(id, node as HTMLElement);
      const p = positions.get(id);
      const face = faces.get(id) || 1;
      if (p) setNodeTransform(node as HTMLElement, p.x, p.y, face);
    } else {
      fishEls.delete(id);
    }
  };
}

function addFlakeAtPercent(xPct: number, yPct: number) {
  const id = Date.now() + Math.random();
  const fl: Flake = {
    id,
    x: Math.max(0, Math.min(100, xPct)),
    y: Math.max(0, Math.min(100, yPct)),
    state: "sinking",
    createdAt: performance.now(),
  };
  flakes.set(id, fl);
  flakeIds.value = [...flakeIds.value, id].slice(-MAX_FLAKES);
}

function addFlakeAt(clientX: number, clientY: number) {
  if (!container.value) return;
  const rect = container.value.getBoundingClientRect();
  const xPct = ((clientX - rect.left) / rect.width) * 100;
  const yPct = ((clientY - rect.top) / rect.height) * 100;
  addFlakeAtPercent(xPct, yPct);
}

function dispenseAutoFeederFlakes(quantity = AUTO_FEEDER_DISPENSE_COUNT) {
  for (let i = 0; i < quantity; i++) {
    const xPct = Math.random() * 100;
    const yPct = Math.random() * AUTO_FEEDER_DISPENSE_TOP_RANGE;
    addFlakeAtPercent(xPct, yPct);
  }
}

watch(
  () => game.coinDrops.map((drop) => drop.id),
  (ids) => {
    const keep = new Set(ids);
    Array.from(dropAnchors.keys()).forEach((id) => {
      if (!keep.has(id)) dropAnchors.delete(id);
    });
  }
);

function coinStyle(drop: CoinDropView) {
  let anchor = dropAnchors.get(drop.id);
  if (!anchor) {
    const fishPos =
      drop.fishId != null ? positions.get(drop.fishId) : undefined;
    const baseX = typeof fishPos?.x === "number" ? fishPos.x : drop.x;
    const baseY =
      typeof fishPos?.y === "number" ? fishPos.y : drop.spawnY ?? drop.y;
    const startTop = clamp(baseY, 10, 88);
    const endTop = clamp(
      Math.max(drop.y, startTop + Math.random() * 8),
      startTop,
      COIN_FLOOR_Y
    );
    const left = clamp(baseX + (Math.random() - 0.5) * 6, 6, 94);
    const fallDistance = Math.max(0, endTop - startTop);
    const duration = Math.max(
      450,
      Math.round(
        drop.fallDurationMs ||
          COIN_FALL_MIN_MS + fallDistance * COIN_FALL_PER_PCT
      )
    );
    anchor = { left, startTop, endTop, duration };
    dropAnchors.set(drop.id, anchor);
  }
  return {
    left: `${anchor.left}%`,
    top: `${anchor.endTop}%`,
    "--drop-start-top": `${anchor.startTop}%`,
    "--drop-end-top": `${anchor.endTop}%`,
    "--drop-fall-duration": `${anchor.duration}ms`,
  };
}

function dropIcon(type: CoinDropView["type"]) {
  if (type === "bill") return "💵";
  if (type === "stack") return "💰";
  return "🪙";
}

function collectDrop(id: number) {
  game.collectCoinDrop(id);
}

function onClick(e: MouseEvent) {
  if (game.selectedTool === "spoon") {
    const cx = e.clientX,
      cy = e.clientY;
    for (let i = 0; i < SPOON_SCATTER_COUNT; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * SPOON_SCATTER_RADIUS;
      addFlakeAt(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
    }
  } else addFlakeAt(e.clientX, e.clientY);
}

watch(
  () => game.autoFeeder.lastFeedTime,
  (newVal) => {
    if (!game.autoFeeder.active) return;
    if (!newVal) return;
    if (lastHandledAutoFeed.value === newVal) return;
    if (lastHandledAutoFeed.value !== null || newVal !== 0) {
      dispenseAutoFeederFlakes();
    }
    lastHandledAutoFeed.value = newVal;
  },
  { immediate: true }
);
</script>

<template>
  <div
    ref="container"
    class="absolute inset-0 overflow-hidden"
    @click="onClick">
    <img
      :src="backgroundImage"
      alt="Aquarium background"
      class="absolute inset-0 w-full h-full object-cover md:object-fill xl:object-cover xl:object-bottom"
      aria-hidden="true" />
    <div
      class="absolute inset-0 bg-gradient-to-t from-blue-900/20 via-transparent to-cyan-100/10 pointer-events-none" />

    <FishControlled
      v-for="f in game.fish"
      :key="f.id"
      :fish-id="f.id"
      :type="f.type"
      :hunger="f.hunger"
      :is-being-fed="game.feedingFishId === f.id"
      :ref="setFishRef(f.id)" />

    <div
      v-for="id in flakeIds"
      :key="id"
      class="absolute pointer-events-none"
      :ref="(el:any)=>{ if(el) flakeEls.set(id, el); else flakeEls.delete(id) }"
      style="will-change: transform; z-index: 5">
      <FlakeSvg />
    </div>

    <TransitionGroup tag="div" name="coin-drop" class="absolute inset-0">
      <button
        v-for="drop in game.coinDrops as CoinDropView[]"
        :key="drop.id"
        class="coin-drop absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-yellow-200/60"
        :style="coinStyle(drop)"
        :title="`Collect ${drop.value} coins`"
        @click.stop="collectDrop(drop.id)">
        <span class="text-base leading-none">{{ dropIcon(drop.type) }}</span>
        <span>{{ drop.value }}</span>
      </button>
    </TransitionGroup>

    <div
      v-for="decor in placedDecorations"
      :key="decor.id"
      class="absolute pointer-events-none select-none drop-shadow-lg"
      :style="decor.style"
      :aria-label="decor.label"
      :title="decor.label">
      <span class="text-5xl md:text-6xl">{{ decor.emoji }}</span>
    </div>

    <BubblesLayer />
    <div
      class="absolute inset-0 bg-gradient-to-br from-cyan-100/3 via-transparent to-blue-100/3 pointer-events-none animate-pulse"
      style="animation-duration: 4s" />
  </div>
</template>

<style scoped>
.coin-drop {
  --drop-start-top: 90%;
  --drop-end-top: 94%;
  --drop-fall-duration: 1200ms;
  animation-name: coin-fall;
  animation-duration: var(--drop-fall-duration);
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  animation-fill-mode: forwards;
}

.coin-drop-enter-active,
.coin-drop-leave-active {
  transition: opacity 0.2s ease;
}

.coin-drop-enter-from,
.coin-drop-leave-to {
  opacity: 0;
}

.coin-drop-leave-active {
  pointer-events: none;
}

@keyframes coin-fall {
  from {
    top: var(--drop-start-top);
  }
  to {
    top: var(--drop-end-top);
  }
}

@media (prefers-reduced-motion: reduce) {
  .coin-drop {
    animation-duration: 1ms;
    animation-timing-function: linear;
  }
}
</style>
