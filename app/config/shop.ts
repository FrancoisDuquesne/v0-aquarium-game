export interface FishShopItem {
  type: string
  name: string
  cost: number
  desc: string
}

export const FISH_SHOP_ITEMS: FishShopItem[] = [
  {
    type: 'goldfish',
    name: 'Goldfish',
    cost: 50,
    desc: 'Hardy beginner fish with calm behavior.',
  },
  {
    type: 'angelfish',
    name: 'Angelfish',
    cost: 100,
    desc: 'Graceful swimmer; light schooling tendencies.',
  },
  {
    type: 'neon',
    name: 'Neon Tetra',
    cost: 75,
    desc: 'Small, vibrant, and schools strongly.',
  },
  {
    type: 'tropical',
    name: 'Tropical Fish',
    cost: 150,
    desc: 'Colorful mid-water fish; loose schooling.',
  },
  {
    type: 'betta',
    name: 'Betta',
    cost: 120,
    desc: 'Flowing fins and bold colors; prefers its space.',
  },
  {
    type: 'cherry-barb',
    name: 'Cherry Barb',
    cost: 90,
    desc: 'Peaceful schooling barb with a red hue.',
  },
  {
    type: 'guppy',
    name: 'Guppy',
    cost: 60,
    desc: 'Active, hardy livebearer; great in groups.',
  },
  {
    type: 'pearl-gourami',
    name: 'Pearl Gourami',
    cost: 140,
    desc: 'Elegant with pearly spots; gentle demeanor.',
  },
  {
    type: 'tiger-barb',
    name: 'Tiger Barb',
    cost: 110,
    desc: 'Striped and lively; energetic schooling fish.',
  },
  {
    type: 'jewel-cichlid',
    name: 'Jewel Cichlid',
    cost: 170,
    desc: 'Striking red coloration; more territorial.',
  },
]
