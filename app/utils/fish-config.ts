import { FISH_CONFIG } from "./game-config";

export { FISH_CONFIG };

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
