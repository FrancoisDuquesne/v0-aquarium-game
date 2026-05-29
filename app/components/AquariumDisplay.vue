<script setup lang="ts">
import { fishSizeMultiplier, fishAgeRatio } from "~/utils/economy";

const game = useGameStore();
const livePositions = useDisplayPositions();

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

const coinPopups = ref<{ id: number; value: number; x: number; y: number }[]>([]);
const deathAnims = ref<{ id: number; type: string; x: number; y: number }[]>([]);
const screenFlash = ref(false);

const { playFeedSound } = useGameAudio();

const activeFishIds = new Set<number>();
const fishHunger = new Map<number, number>();
const fishTypes = new Map<number, string>();
const flakesToRemove: number[] = [];
let frameHandle: number | null = null;

// Vacuum system — shared with CoinSweeper via provide/inject
const collectorX = ref(50);
provide('collectorX', collectorX);
const vacuumedDropIds = new Set<number>();
const vacuumedDropPositions = new Map<number, number>();
// Vacuum radius (% of tank width) by collector level
const VACUUM_RADII = [0, 6, 10, 14];

const backgroundImage = computed(() => game.background);

type CoinDropView = {
  id: number;
  value: number;
  x: number;
  y: number;
  spawnY: number;
  fallDurationMs: number;
  fishId: number | null;
  type: "copper" | "silver" | "gold" | "note" | "bundle" | "silver-bar" | "gold-bar" | "chest" | "crown";
  source: string;
};



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
    // Pre-position fish before the first RAF fires so they never flash at (0,0).
    // fishEls is already populated because child components mount before parent onMounted.
    game.fish.forEach((f) => {
      if (!positions.has(f.id)) positions.set(f.id, { x: f.x, y: f.y });
      if (!faces.has(f.id)) faces.set(f.id, 1);
    });
    fishEls.forEach((node, id) => {
      const p = positions.get(id);
      const face = faces.get(id) ?? 1;
      if (p) setNodeTransform(node, p.x, p.y, face);
    });
  }
  const loop = (ts: number) => {
    try {
      tick(ts);
    } catch (err) {
      console.error("[AquariumDisplay] RAF tick error:", err);
    }
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
  node.style.setProperty('--face', String(face));
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
  fishTypes.clear();

  game.fish.forEach((f) => {
    activeFishIds.add(f.id);
    fishHunger.set(f.id, f.hunger);
    fishTypes.set(f.id, f.type);
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
      fishTypes.delete(id);
      livePositions.delete(id);
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

  // Spatial grid for flake detection — bucket size matches DETECT_RADIUS so checking
  // 3×3 neighbourhood guarantees we see all flakes within detection range (O(n+m) not O(n×m))
  const BUCKET_SIZE = 12.5; // 8 columns × 8 rows over the 100×100 % space
  const flakeBuckets = new Map<string, Flake[]>();
  flakes.forEach((fl) => {
    const col = Math.floor(fl.x / BUCKET_SIZE);
    const row = Math.floor(fl.y / BUCKET_SIZE);
    const key = `${col}_${row}`;
    const bucket = flakeBuckets.get(key);
    if (bucket) bucket.push(fl); else flakeBuckets.set(key, [fl]);
  });

  // Pre-compute per-species positions once so schooling/territorial loops are O(n) not O(n²)
  const speciesPositions = new Map<string, { id: number; x: number; y: number }[]>();
  game.fish.forEach((f) => {
    const p = positions.get(f.id);
    if (!p) return;
    const arr = speciesPositions.get(f.type);
    if (arr) arr.push({ id: f.id, x: p.x, y: p.y });
    else speciesPositions.set(f.type, [{ id: f.id, x: p.x, y: p.y }]);
  });

  positions.forEach((pos, id) => {
    let chasingSinkingFlake = false;
    const species = fishTypes.get(id) ?? "goldfish";
    const profile = SPECIES_PROFILES[species] ?? SPECIES_PROFILES.goldfish;
    const dueAt = nextWaypointAt.get(id) || now;
    if (now >= dueAt) {
      let next = generateWaypoint(pos.x, pos.y, profile.levyMu);

      // Depth bias — nudge waypoint toward species' preferred depth
      if (profile.depthBias !== undefined) {
        next.y = next.y * 0.5 + profile.depthBias * 0.5;
        next.y = clamp(next.y, FISH_CONFIG.BOUNDARY_TOP, FISH_CONFIG.BOUNDARY_BOTTOM);
      }

      // Schooling — neons, guppies, cherry-barbs, tiger-barbs drift toward nearby same-species
      if (profile.schooling) {
        let sx = 0, sy = 0, count = 0;
        speciesPositions.get(species)?.forEach((fp) => {
          if (fp.id === id) return;
          const d = Math.hypot(fp.x - pos.x, fp.y - pos.y);
          if (d < 28) { sx += fp.x; sy += fp.y; count++; }
        });
        if (count > 0) {
          next.x = next.x * 0.55 + (sx / count) * 0.45;
          next.y = next.y * 0.55 + (sy / count) * 0.45;
        }
      }

      // Territorial — bettas and jewel-cichlids steer away from same-species
      if (profile.territorial) {
        speciesPositions.get(species)?.forEach((fp) => {
          if (fp.id === id) return;
          const d = Math.hypot(fp.x - pos.x, fp.y - pos.y);
          if (d < 22) {
            const awayX = pos.x + (pos.x - fp.x) * 0.6;
            const awayY = pos.y + (pos.y - fp.y) * 0.6;
            next.x = clamp(awayX, FISH_CONFIG.BOUNDARY_LEFT, FISH_CONFIG.BOUNDARY_RIGHT);
            next.y = clamp(awayY, FISH_CONFIG.BOUNDARY_TOP, FISH_CONFIG.BOUNDARY_BOTTOM);
          }
        });
      }

      targets.set(id, next);
      const wMin = profile.waypointMin ?? FISH_CONFIG.WAYPOINT_MIN_INTERVAL;
      const wMax = profile.waypointMax ?? FISH_CONFIG.WAYPOINT_MAX_INTERVAL;
      nextWaypointAt.set(id, now + wMin + Math.random() * (wMax - wMin));
      faces.set(id, next.x > pos.x ? 1 : -1);
    }

    let base = targets.get(id) || pos;

    let nearest: Flake | null = null;
    let nearestDist = Infinity;
    const hunger = fishHunger.get(id) ?? 100;
    const isHungry = hunger < 100;

    if (isHungry && flakes.size) {
      const fc = Math.floor(pos.x / BUCKET_SIZE);
      const fr = Math.floor(pos.y / BUCKET_SIZE);
      for (let dc = -1; dc <= 1; dc++) {
        for (let dr = -1; dr <= 1; dr++) {
          const bucket = flakeBuckets.get(`${fc + dc}_${fr + dr}`);
          if (!bucket) continue;
          for (const fl of bucket) {
            const dx = fl.x - pos.x;
            const dy = fl.y - pos.y;
            if (Math.abs(dx) > nearestDist || Math.abs(dy) > nearestDist) continue;
            const d = Math.hypot(dx, dy);
            if (d < nearestDist) { nearest = fl; nearestDist = d; }
          }
        }
      }
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
    const maxSpeed = 16 * (profile.speedScale ?? 1);
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
    livePositions.set(id, { x: pos.x, y: pos.y });

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

  // Vacuum: sweeper sucks up coins it passes over
  const vacLevel = game.coinCollector.level;
  if (vacLevel > 0 && game.coinDrops.length > 0) {
    const radius = VACUUM_RADII[vacLevel] ?? 0;
    const cx = collectorX.value;
    const toVacuum: number[] = [];
    for (const drop of game.coinDrops as CoinDropView[]) {
      if (vacuumedDropIds.has(drop.id)) continue;
      const anchor = dropAnchors.get(drop.id);
      if (!anchor) continue;
      if (Math.abs(anchor.left - cx) <= radius) {
        toVacuum.push(drop.id);
      }
    }
    for (const id of toVacuum) {
      vacuumCollectDrop(id);
    }
  }
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

function addFlakeAtPercent(xPct: number, yPct: number, chargeCoins = true) {
  const id = Date.now() + Math.random();
  const fl: Flake = {
    id,
    x: Math.max(0, Math.min(100, xPct)),
    y: Math.max(0, Math.min(100, yPct)),
    state: "sinking",
    createdAt: performance.now(),
  };
  flakes.set(id, fl);
  flakeIds.value.push(id);
  if (flakeIds.value.length > MAX_FLAKES) flakeIds.value.shift();
  if (chargeCoins) {
    game.chargeFlake();
    playFeedSound();
  }
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
    addFlakeAtPercent(xPct, yPct, false); // cost already charged in store tick()
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

// Death animations — capture position before fish is cleaned from positions Map
watch(
  () => game.pendingDeaths.length,
  () => {
    game.pendingDeaths.forEach((d) => {
      if (deathAnims.value.some((a) => a.id === d.id)) return;
      const pos = positions.get(d.id);
      const x = pos?.x ?? 50;
      const y = pos?.y ?? 50;
      deathAnims.value = [...deathAnims.value, { id: d.id, type: d.type, x, y }];
      setTimeout(() => {
        deathAnims.value = deathAnims.value.filter((a) => a.id !== d.id);
      }, 2200);
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
  const lifetimeMs = drop.expiresAt - drop.createdAt;
  return {
    left: `${anchor.left}%`,
    top: `${anchor.endTop}%`,
    "--drop-start-top": `${anchor.startTop}%`,
    "--drop-end-top": `${anchor.endTop}%`,
    "--drop-fall-duration": `${anchor.duration}ms`,
    "--drop-lifetime": `${lifetimeMs}ms`,
  };
}

function popupClass(value: number) {
  if (value >= 500) return "text-3xl font-extrabold text-yellow-100 drop-shadow-lg";
  if (value >= 100) return "text-2xl font-extrabold text-yellow-200 drop-shadow-lg";
  if (value >= 50) return "text-lg font-bold text-yellow-300 drop-shadow";
  if (value >= 10) return "text-base font-bold text-yellow-300 drop-shadow";
  return "text-sm font-semibold text-yellow-400";
}

function collectDrop(id: number) {
  const drop = game.coinDrops.find((d) => d.id === id);
  if (drop) {
    coinPopups.value.push({ id: drop.id, value: drop.value, x: drop.x, y: drop.y });
    setTimeout(() => {
      coinPopups.value = coinPopups.value.filter((p) => p.id !== id);
    }, 900);
    if (drop.type === "crown" || drop.type === "chest") {
      screenFlash.value = true;
      setTimeout(() => { screenFlash.value = false; }, 350);
    }
  }
  game.collectCoinDrop(id);
}

function vacuumCollectDrop(id: number) {
  const drop = (game.coinDrops as CoinDropView[]).find((d) => d.id === id);
  if (!drop) return;
  vacuumedDropIds.add(id);
  vacuumedDropPositions.set(id, collectorX.value);
  coinPopups.value.push({ id: drop.id, value: drop.value, x: collectorX.value, y: 88 });
  setTimeout(() => {
    coinPopups.value = coinPopups.value.filter((p) => p.id !== id);
  }, 900);
  game.coinCollector.lastSweep = Date.now();
  game.collectCoinDrop(id);
}

function onCoinEnter(el: Element, done: () => void) {
  const e = el as HTMLElement;
  e.style.opacity = '0';
  requestAnimationFrame(() => {
    e.style.transition = 'opacity 0.15s ease';
    e.style.opacity = '1';
    setTimeout(done, 160);
  });
}

function onCoinLeave(el: Element, done: () => void) {
  const e = el as HTMLElement;
  const id = Number(e.dataset.dropId);
  e.style.pointerEvents = 'none';
  e.style.animation = 'none';

  if (vacuumedDropIds.has(id) && container.value) {
    const sweepXPct = vacuumedDropPositions.get(id) ?? collectorX.value;
    vacuumedDropIds.delete(id);
    vacuumedDropPositions.delete(id);

    const containerRect = container.value.getBoundingClientRect();
    const rect = e.getBoundingClientRect();
    const coinCenterX = rect.left - containerRect.left + rect.width / 2;
    const coinCenterY = rect.top - containerRect.top + rect.height / 2;
    const sweepXPx = (sweepXPct / 100) * containerRect.width;
    const sweepYPx = containerRect.height * 0.98;
    const deltaX = sweepXPx - coinCenterX;
    const deltaY = sweepYPx - coinCenterY;

    void e.offsetWidth;
    e.style.transition = 'transform 0.22s ease-in, opacity 0.18s ease-in';
    requestAnimationFrame(() => {
      e.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.05)`;
      e.style.opacity = '0';
    });
    setTimeout(done, 240);
  } else {
    vacuumedDropIds.delete(id);
    vacuumedDropPositions.delete(id);
    void e.offsetWidth;
    e.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
    requestAnimationFrame(() => {
      e.style.transform = 'translate(-50%, calc(-50% - 14px)) scale(0.4)';
      e.style.opacity = '0';
    });
    setTimeout(done, 480);
  }
}

function onClick(e: MouseEvent) {
  if (game.tools.spoonOwned) {
    const cx = e.clientX, cy = e.clientY;
    for (let i = 0; i < SPOON_SCATTER_COUNT; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * SPOON_SCATTER_RADIUS;
      addFlakeAt(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
    }
  } else {
    addFlakeAt(e.clientX, e.clientY);
  }
}

function onPlayWithFish(fishId: number) {
  game.playWithFish(fishId);
}

function collectVisitor() {
  if (!game.visitor || game.visitor.fed) return;
  const reward = game.feedVisitor();
  if (reward > 0) {
    // Estimate current X from animation progress
    const elapsed = Date.now() - game.visitor.spawnedAt;
    const progress = Math.min(1, elapsed / VISITOR_DURATION_MS);
    const estimatedX = clamp(-8 + progress * 116, 2, 98);
    coinPopups.value.push({
      id: game.visitor.spawnedAt,
      value: reward,
      x: estimatedX,
      y: game.visitor.y,
    });
    setTimeout(() => {
      coinPopups.value = coinPopups.value.filter((p) => p.id !== game.visitor?.spawnedAt);
    }, 1200);
  }
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

function getFishSizeMultiplier(f: { type: string; bornAt?: number; genetics?: { healthMod?: number; mutation?: string } }): number {
  if (f.bornAt == null) return 1.0;
  return fishSizeMultiplier(fishAgeRatio(f.bornAt, f.type, f.genetics));
}
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
      :name="f.name"
      :hunger="f.hunger"
      :health="f.health"
      :boredom="f.boredom"
      :care-streak="f.careStreak"
      :is-being-fed="game.feedingFishId === f.id"
      :size-multiplier="getFishSizeMultiplier(f)"
      :genetics="f.genetics"
      :generation="f.generation"
      :ref="setFishRef(f.id)"
      @play="onPlayWithFish" />

    <div
      v-for="id in flakeIds"
      :key="id"
      class="absolute pointer-events-none"
      :ref="(el:any)=>{ if(el) flakeEls.set(id, el); else flakeEls.delete(id) }"
      style="will-change: transform; z-index: 5">
      <FlakeSvg />
    </div>

    <TransitionGroup tag="div" :css="false" @enter="onCoinEnter" @leave="onCoinLeave" class="absolute inset-0">
      <button
        v-for="drop in game.coinDrops as CoinDropView[]"
        :key="drop.id"
        :data-drop-id="drop.id"
        class="coin-drop absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 focus:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center"
        :style="coinStyle(drop)"
        :title="`Collect ${drop.value} coins`"
        @click.stop="collectDrop(drop.id)">
        <CoinDropSvg :type="drop.type" />
      </button>
    </TransitionGroup>

    <!-- Coin collect value popups (size-scaled) -->
    <div
      v-for="popup in coinPopups"
      :key="popup.id"
      class="coin-popup absolute pointer-events-none z-30"
      :class="popupClass(popup.value)"
      :style="{ left: popup.x + '%', top: popup.y + '%' }">
      +{{ popup.value }}
    </div>

    <!-- Death animations -->
    <div
      v-for="anim in deathAnims"
      :key="anim.id"
      class="absolute pointer-events-none z-20 fish-dying"
      :style="{ left: anim.x + '%', top: anim.y + '%', transform: 'translate(-50%, -50%)' }">
      <FishSvg :type="anim.type" :width="40" :height="28" />
    </div>

    <!-- Rare visitor fish -->
    <Transition name="visitor-appear">
      <div
        v-if="game.visitor && !game.visitor.fed"
        class="absolute z-10 visitor-fish cursor-pointer"
        :style="{
          top: game.visitor.y + '%',
          transform: 'translateY(-50%)',
          '--visitor-dur': (VISITOR_DURATION_MS / 1000) + 's',
        }"
        @click.stop="collectVisitor">
        <div class="flex flex-col items-center gap-1">
          <div class="visitor-badge">⭐ {{ game.visitor.name }}</div>
          <div class="visitor-glow">
            <FishSvg :type="game.visitor.type" :width="52" :height="36" class="visitor-svg" />
          </div>
        </div>
      </div>
    </Transition>

    <CoinSweeper />
    <BubblesLayer />
    <div
      class="absolute inset-0 bg-gradient-to-br from-cyan-100/3 via-transparent to-blue-100/3 pointer-events-none animate-pulse"
      style="animation-duration: 4s" />

    <!-- Screen flash for high-value coin collection -->
    <Transition name="flash">
      <div
        v-if="screenFlash"
        class="absolute inset-0 pointer-events-none z-40 bg-yellow-200/20" />
    </Transition>
  </div>
</template>

<style scoped>
.coin-drop {
  --drop-start-top: 90%;
  --drop-end-top: 94%;
  --drop-fall-duration: 1200ms;
  --drop-lifetime: 22000ms;
  animation-name: coin-fall, coin-expire;
  animation-duration: var(--drop-fall-duration), var(--drop-lifetime);
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1), linear;
  animation-fill-mode: forwards, forwards;
}

@keyframes coin-expire {
  0%,  65% { opacity: 1; }
  80%       { opacity: 0.55; }
  92%       { opacity: 0.2; }
  100%      { opacity: 0.05; }
}

.coin-drop-enter-active {
  transition: opacity 0.15s ease;
}

.coin-drop-enter-from {
  opacity: 0;
}

.coin-drop-leave-active {
  transition: opacity 0.45s ease, transform 0.45s ease;
  pointer-events: none;
}

.coin-drop-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.4) translateY(-14px);
}

@keyframes coin-fall {
  from {
    top: var(--drop-start-top);
  }
  to {
    top: var(--drop-end-top);
  }
}

/* Fish death — flips upside-down and floats to top */
.fish-dying {
  animation: fishDie 2.2s ease-in forwards;
}

@keyframes fishDie {
  0%   { transform: translate(-50%, -50%) rotate(0deg); opacity: 1; }
  30%  { transform: translate(-50%, -50%) rotate(180deg); opacity: 1; }
  100% { transform: translate(-50%, calc(-50% - 160px)) rotate(180deg); opacity: 0; }
}

/* Decoration sway animations */
.decor-kelp-forest span {
  display: inline-block;
  transform-origin: center bottom;
  animation: kelpSway 3s ease-in-out infinite alternate;
}

.decor-coral-arch span {
  display: inline-block;
  animation: coralPulse 4s ease-in-out infinite alternate;
}

.decor-bubble-column span {
  display: inline-block;
  animation: bubbleRise 2.5s ease-in-out infinite;
}


/* Rare visitor fish — drifts from left edge to right edge */
.visitor-fish {
  animation: visitorDrift var(--visitor-dur, 180s) linear forwards;
  pointer-events: auto;
}

@keyframes visitorDrift {
  from { left: -8%; }
  to   { left: 110%; }
}

.visitor-glow {
  filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.8)) drop-shadow(0 0 16px rgba(250, 204, 21, 0.4));
}

.visitor-svg {
  filter: hue-rotate(25deg) brightness(1.3) saturate(1.6);
}

.visitor-badge {
  font-size: 10px;
  font-weight: 700;
  color: #fef08a;
  background: rgba(0,0,0,0.65);
  border: 1px solid rgba(250,204,21,0.4);
  border-radius: 999px;
  padding: 1px 8px;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}

.visitor-appear-enter-active { transition: opacity 0.6s ease; }
.visitor-appear-leave-active { transition: opacity 0.4s ease; }
.visitor-appear-enter-from, .visitor-appear-leave-to { opacity: 0; }

/* Screen flash transition */
.flash-enter-active, .flash-leave-active {
  transition: opacity 0.35s ease;
}
.flash-enter-from { opacity: 0; }
.flash-leave-to   { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .coin-drop {
    animation-duration: 1ms;
    animation-timing-function: linear;
  }
  .fish-dying,
  .visitor-fish {
    animation: none;
  }
  .flash-enter-active,
  .flash-leave-active,
  .visitor-appear-enter-active,
  .visitor-appear-leave-active {
    transition: none;
  }
}
</style>
