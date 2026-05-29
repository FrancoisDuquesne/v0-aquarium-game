// Shared fish position map written by AquariumDisplay each RAF frame.
// Used by the game store's tick() to origin coin drops at actual on-screen positions.
// Lives here (not in the store) so the view → store data flow is explicit.
const livePositions = new Map<number, { x: number; y: number }>();

export function useDisplayPositions() {
  return livePositions;
}
