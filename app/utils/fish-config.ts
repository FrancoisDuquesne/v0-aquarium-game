export const FISH_CONFIG = {
  WAYPOINT_MIN_INTERVAL: 1200,
  WAYPOINT_MAX_INTERVAL: 6000,
  ANIMATION_FPS: 60,
  MOVEMENT_SPEED: 0.012,
  LEVY_MU: 1.8,
  WAYPOINT_MIN_STEP: 7,
  WAYPOINT_MAX_STEP: 22,
  BOUNDARY_LEFT: 5,
  BOUNDARY_RIGHT: 95,
  BOUNDARY_TOP: 15,
  BOUNDARY_BOTTOM: 78,
  FISH_SIZES: {
    neon: { width: 20, height: 14 },
    goldfish: { width: 40, height: 28 },
    tropical: { width: 60, height: 42 },
    angelfish: { width: 50, height: 80 },
    shark: { width: 160, height: 112 },
    betta: { width: 34, height: 26 },
    'cherry-barb': { width: 28, height: 16 },
    guppy: { width: 26, height: 16 },
    'pearl-gourami': { width: 48, height: 30 },
    'tiger-barb': { width: 30, height: 18 },
    'jewel-cichlid': { width: 44, height: 28 },
  },
}

export const generateRandomInterval = () =>
  FISH_CONFIG.WAYPOINT_MIN_INTERVAL + Math.random() * (FISH_CONFIG.WAYPOINT_MAX_INTERVAL - FISH_CONFIG.WAYPOINT_MIN_INTERVAL)

export function levyFlight(mu = 1.5, minStep = 1, maxStep = 100) {
  const u = Math.random()
  const step = minStep * Math.pow(1 - u, -1 / (mu - 1))
  return Math.min(step, maxStep)
}

export function randomDirection() {
  const angle = Math.random() * 2 * Math.PI
  return { dx: Math.cos(angle), dy: Math.sin(angle) }
}

export function generateWaypoint(x: number, y: number, mu: number) {
  const step = levyFlight(mu, FISH_CONFIG.WAYPOINT_MIN_STEP, FISH_CONFIG.WAYPOINT_MAX_STEP)
  const { dx, dy } = randomDirection()
  const nx = Math.max(FISH_CONFIG.BOUNDARY_LEFT, Math.min(FISH_CONFIG.BOUNDARY_RIGHT, x + dx * step))
  const ny = Math.max(FISH_CONFIG.BOUNDARY_TOP, Math.min(FISH_CONFIG.BOUNDARY_BOTTOM, y + dy * step))
  return { x: nx, y: ny }
}

