Nuxt 3 port (Nuxt UI + Pinia + Tailwind)

Commands
- pnpm i (or npm i)
- pnpm dev (or npm run dev) from the nuxt/ directory

Includes
- @nuxt/ui for UI primitives (UButton, UBadge, UCard, UModal)
- Pinia store for game state and actions (stores/game.ts)
- TailwindCSS and existing animations (assets/css/main.css)
- VueUse for interval ticking
- Nuxt Image for background asset

Ported Features
- RAF-based movement with smoothed targets + arrival
- Species-specific schooling (light), food flakes and spoon scatter
- Inventory + Store tabbed modal with sorting and equipment
- New species with simple SVGs and sizes

Notes
- Background uses /public/images/coral-reef-bg.webp at repo root (served by Nuxt via public/). Copy images as needed.
- Adjust movement constants in utils/fish-config.ts

