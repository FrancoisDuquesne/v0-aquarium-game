export const FISH_CONFIG = {
  // Movement timing
  WAYPOINT_MIN_INTERVAL: 1000, // 1 second
  WAYPOINT_MAX_INTERVAL: 5000, // 5 seconds
  ANIMATION_FPS: 60, // frames per second
  MOVEMENT_SPEED: 0.02, // interpolation speed (0.01 = slow, 0.05 = fast)

  // Levy flight parameters
  LEVY_MU: 1.8, // Levy flight exponent (1.5-2.5 typical range)
  WAYPOINT_MIN_STEP: 5, // minimum waypoint distance
  WAYPOINT_MAX_STEP: 25, // maximum waypoint distance

  // Aquarium boundaries
  BOUNDARY_LEFT: 5, // percentage from left
  BOUNDARY_RIGHT: 95, // percentage from right
  BOUNDARY_TOP: 15, // percentage from top
  BOUNDARY_BOTTOM: 70, // percentage from top (avoid coral area)

  // Fish sizes
  FISH_SIZES: {
    neon: { width: 20, height: 14 }, // Smallest fish (base size)
    goldfish: { width: 40, height: 28 }, // 2x larger than neon
    tropical: { width: 60, height: 42 }, // 3x larger than neon
    angelfish: { width: 50, height: 80 }, // Tall and elegant, 4x area of neon
    shark: { width: 160, height: 112 }, // 8x larger than neon (massive)
  },
}

// Helper function to generate random interval
export const generateRandomInterval = () =>
  FISH_CONFIG.WAYPOINT_MIN_INTERVAL +
  Math.random() * (FISH_CONFIG.WAYPOINT_MAX_INTERVAL - FISH_CONFIG.WAYPOINT_MIN_INTERVAL)
