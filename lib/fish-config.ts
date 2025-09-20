export const FISH_CONFIG = {
  // Movement timing
  WAYPOINT_MIN_INTERVAL: 1200, // purposeful but responsive
  WAYPOINT_MAX_INTERVAL: 6000, // occasional longer cruises
  ANIMATION_FPS: 60, // frames per second
  MOVEMENT_SPEED: 0.012, // kept for legacy lerp (not critical now)

  // Levy flight parameters
  LEVY_MU: 1.8, // Levy flight exponent (1.5-2.5 typical range)
  WAYPOINT_MIN_STEP: 7, // moderate steps for purpose
  WAYPOINT_MAX_STEP: 22, // cap long moves

  // Aquarium boundaries
  BOUNDARY_LEFT: 5, // percentage from left
  BOUNDARY_RIGHT: 95, // percentage from right
  BOUNDARY_TOP: 15, // percentage from top
  BOUNDARY_BOTTOM: 78, // allow fish to swim lower in the tank

  // Fish sizes
  FISH_SIZES: {
    neon: { width: 20, height: 14 }, // Smallest fish (base size)
    goldfish: { width: 40, height: 28 }, // 2x larger than neon
    tropical: { width: 60, height: 42 }, // 3x larger than neon
    angelfish: { width: 50, height: 80 }, // Tall and elegant, 4x area of neon
    shark: { width: 160, height: 112 }, // 8x larger than neon (massive)
    // New species
    betta: { width: 34, height: 26 },
    "cherry-barb": { width: 28, height: 16 },
    guppy: { width: 26, height: 16 },
    "pearl-gourami": { width: 48, height: 30 },
    "tiger-barb": { width: 30, height: 18 },
    "jewel-cichlid": { width: 44, height: 28 },
  },
}

// Helper function to generate random interval
export const generateRandomInterval = () =>
  FISH_CONFIG.WAYPOINT_MIN_INTERVAL +
  Math.random() * (FISH_CONFIG.WAYPOINT_MAX_INTERVAL - FISH_CONFIG.WAYPOINT_MIN_INTERVAL)
