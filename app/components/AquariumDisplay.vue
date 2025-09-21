<script setup lang="ts">
const game = useGameStore();
const router = useRouter();

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

function resolveBackgroundPath(path: string | null | undefined) {
  const fallback = "/backgrounds/0.webp";
  if (!path) return router.resolve({ path: fallback }).href;
  let normalized = path;
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized.replace(/^\/?/, "")}`;
  }
  if (normalized.startsWith("/images/background-")) {
    normalized = normalized.replace("/images/background-", "/backgrounds/");
  }
  return router.resolve({ path: normalized }).href;
}

const resolvedBackground = computed(() =>
  resolveBackgroundPath(game.background)
);

const FLOOR_Y = 96;
const SINK_SPEED_PER_S = 6;
const REST_DURATION_MS = 5000;
const DETECT_RADIUS = 16;
const EAT_RADIUS = 3;
const FEED_AMOUNT = 20;
const MAX_FLAKES = 60;

onMounted(() => {
  game.load();
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
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  onBeforeUnmount(() => ro.disconnect());
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
  const dtSec = Math.max(0.001, dt / 1000);
  const now = ts;

  // Ensure maps for current fish list
  const ids = new Set<number>();
  game.fish.forEach((f) => {
    ids.add(f.id);
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
  Array.from(positions.keys()).forEach((id) => {
    if (!ids.has(id)) {
      positions.delete(id);
      velocities.delete(id);
      targets.delete(id);
      softTargets.delete(id);
      nextWaypointAt.delete(id);
      faces.delete(id);
      fishEls.delete(id);
    }
  });

  // Flakes: sink and cull
  const toRemove: number[] = [];
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
    )
      toRemove.push(id);
    const el = flakeEls.get(id);
    if (el) {
      const { x, y } = pctToPx(flake.x, flake.y);
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  });
  if (toRemove.length) {
    toRemove.forEach((id) => {
      flakes.delete(id);
      flakeEls.delete(id);
    });
    flakeIds.value = flakeIds.value.filter((i) => !toRemove.includes(i));
  }

  // Fish steering
  positions.forEach((pos, id) => {
    // Waypoints
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

    // Base target
    let base = targets.get(id) || pos;

    // Flake attraction
    let nearest: Flake | null = null;
    let nearestDist = Infinity;
    const fishState = game.fish.find((f) => f.id === id);
    const isHungry = !fishState || fishState.hunger < 100;
    if (isHungry && flakes.size) {
      flakes.forEach((fl) => {
        const dx = fl.x - pos.x,
          dy = fl.y - pos.y,
          d = Math.hypot(dx, dy);
        if (d < nearestDist) {
          nearest = fl;
          nearestDist = d;
        }
      });
    }
    if (nearest && nearestDist <= DETECT_RADIUS) {
      base = { x: nearest.x, y: nearest.y };
      targets.set(id, base);
      if (nearestDist <= EAT_RADIUS) {
        game.feedFish(id, FEED_AMOUNT);
        flakes.delete(nearest.id);
        flakeEls.delete(nearest.id);
        flakeIds.value = flakeIds.value.filter((i) => i !== nearest!.id);
      }
    }

    // Smooth target
    const soft = softTargets.get(id) || { x: pos.x, y: pos.y };
    const tau = 0.4;
    const alpha = 1 - Math.exp(-dtSec / tau);
    const softX = soft.x + (base.x - soft.x) * alpha;
    const softY = soft.y + (base.y - soft.y) * alpha;
    softTargets.set(id, { x: softX, y: softY });

    // Arrival
    const vel = velocities.get(id) || { vx: 0, vy: 0 };
    const dx = softX - pos.x,
      dy = softY - pos.y;
    const dist = Math.hypot(dx, dy) || 1;
    const maxSpeed = 14,
      slowRadius = 8;
    const desiredSpeed = Math.min(maxSpeed, maxSpeed * (dist / slowRadius));
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

function dispenseAutoFeederFlakes(quantity = 8) {
  for (let i = 0; i < quantity; i++) {
    const xPct = Math.random() * 100;
    const yPct = Math.random() * 6;
    addFlakeAtPercent(xPct, yPct);
  }
}

function onClick(e: MouseEvent) {
  if (game.selectedTool === "spoon") {
    const cx = e.clientX,
      cy = e.clientY;
    for (let i = 0; i < 8; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * 24;
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
      :src="resolvedBackground"
      alt="Aquarium background"
      class="absolute inset-0 w-full h-full object-cover md:object-fill xl:object-cover"
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

    <BubblesLayer />
    <div
      class="absolute inset-0 bg-gradient-to-br from-cyan-100/3 via-transparent to-blue-100/3 pointer-events-none animate-pulse"
      style="animation-duration: 4s" />
  </div>
</template>
