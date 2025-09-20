"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FISH_CONFIG } from "@/lib/fish-config"
import { FishSVG } from "@/components/fish-svg"

interface FishData {
  id: number
  type: string
  x: number
  y: number
  hunger: number
  speed: number
}

interface FishInventoryProps {
  fish: FishData[]
  onClose: () => void
  onFeedFish?: (fishId: number, amount?: number) => void
  onRemoveFish?: (fishId: number) => void
  onBuyFish?: (fishType: string, cost: number) => void
  coins?: number
  initialTab?: 'inventory' | 'store'
  // Equipment
  autoFeeder?: { owned: boolean; active: boolean } | null
  onBuyAutoFeeder?: (cost: number) => void
  onToggleAutoFeeder?: () => void
  tools?: { spoonOwned: boolean }
  selectedTool?: 'flake' | 'spoon'
  onSelectTool?: (tool: 'flake' | 'spoon') => void
  onBuySpoon?: (cost: number) => void
}

const FishInventory = ({
  fish,
  onClose,
  onFeedFish,
  onRemoveFish,
  onBuyFish,
  coins = 0,
  initialTab = 'inventory',
  autoFeeder,
  onBuyAutoFeeder,
  onToggleAutoFeeder,
  tools,
  selectedTool = 'flake',
  onSelectTool,
  onBuySpoon,
}: FishInventoryProps) => {
  const [selectedSpecies, setSelectedSpecies] = useState<string | 'all'>(() => 'all')
  const [healthFilter, setHealthFilter] = useState<'all' | 'healthy' | 'hungry'>(() => 'all')
  const [activeTab, setActiveTab] = useState<'inventory' | 'store'>(initialTab)
  const [sortKey, setSortKey] = useState<'hunger' | 'type' | 'id'>(() => 'hunger')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(() => 'desc')
  // Group fish by type and count them
  const fishCounts = fish.reduce(
    (acc, fishData) => {
      acc[fishData.type] = (acc[fishData.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate statistics
  const totalFish = fish.length
  const averageHunger = totalFish > 0 ? Math.round(fish.reduce((sum, f) => sum + f.hunger, 0) / totalFish) : 0
  const healthyFish = fish.filter((f) => f.hunger > 70).length
  const hungryFish = fish.filter((f) => f.hunger < 40).length

  const getFishPreview = (type: string) => {
    const size = FISH_CONFIG.FISH_SIZES[type as keyof typeof FISH_CONFIG.FISH_SIZES] || FISH_CONFIG.FISH_SIZES.goldfish
    const previewSize = {
      width: Math.min(size.width * 0.8, 48),
      height: Math.min(size.height * 0.8, 32),
    }

    return <FishSVG type={type} width={previewSize.width} height={previewSize.height} className="drop-shadow-sm" />
  }

  const getFishName = (type: string) => {
    const names = {
      goldfish: "Goldfish",
      angelfish: "Angelfish",
      neon: "Neon Tetra",
      tropical: "Tropical Fish",
      shark: "Baby Shark",
      betta: "Betta",
      "cherry-barb": "Cherry Barb",
      guppy: "Guppy",
      "pearl-gourami": "Pearl Gourami",
      "tiger-barb": "Tiger Barb",
      "jewel-cichlid": "Jewel Cichlid",
    }
    return names[type as keyof typeof names] || "Unknown Fish"
  }

  const getHealthStatus = (hunger: number) => {
    if (hunger > 70) return { text: "Healthy", color: "bg-green-500" }
    if (hunger > 40) return { text: "Okay", color: "bg-yellow-500" }
    return { text: "Hungry", color: "bg-red-500" }
  }

  const filteredFish = fish.filter((f) => {
    const speciesOk = selectedSpecies === 'all' ? true : f.type === selectedSpecies
    const healthOk =
      healthFilter === 'all' ? true : healthFilter === 'healthy' ? f.hunger > 70 : f.hunger < 40
    return speciesOk && healthOk
  })

  const sortedFish = [...filteredFish].sort((a, b) => {
    let v = 0
    if (sortKey === 'hunger') v = a.hunger - b.hunger
    else if (sortKey === 'type') v = a.type.localeCompare(b.type)
    else v = a.id - b.id
    return sortDir === 'asc' ? v : -v
  })

  const SpeciesButton = ({ type, count }: { type: string; count: number }) => (
    <button
      onClick={() => setSelectedSpecies((cur) => (cur === type ? 'all' : type))}
      className={`w-full flex items-center gap-2 px-2 py-2 rounded border ${
        selectedSpecies === type ? 'bg-blue-600/30 border-blue-500 text-blue-100' : 'bg-gray-800/40 border-gray-700 text-gray-200'
      } hover:bg-gray-800/70 transition-colors`}
    >
      <div className="w-8 h-6 flex items-center justify-center bg-gray-700/40 rounded">
        {getFishPreview(type)}
      </div>
      <div className="flex-1 text-left truncate">
        <div className="text-xs">{getFishName(type)}</div>
        <div className="text-[10px] text-gray-400">{count} fish</div>
      </div>
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30 p-2 sm:p-4">
      <Card className="w-full max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-hidden bg-gray-900/95 backdrop-blur border-gray-700">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center justify-between text-gray-100">
            <div className="flex items-center gap-2">
              <button
                className={`px-3 py-1 rounded ${activeTab === 'inventory' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                onClick={() => setActiveTab('inventory')}
              >
                🐟 Inventory
              </button>
              <button
                className={`px-3 py-1 rounded ${activeTab === 'store' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                onClick={() => setActiveTab('store')}
              >
                🛒 Store
              </button>
              <Badge variant="secondary" className="bg-blue-600 text-white text-xs ml-2">
                {filteredFish.length}/{totalFish}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-2 py-1 bg-gray-800 border border-gray-700 text-gray-100">💰 {Math.floor(coins)}</Badge>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-gray-100">✕</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeTab === 'store' ? (
            <div className="p-3 space-y-3">
              <div className="text-sm text-gray-300">Equipment</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[{
                  type: 'auto-feeder', name: 'Auto Feeder', cost: 500, description: 'Feeds fish automatically every 30s when hungry.',
                  owned: !!autoFeeder?.owned, active: !!autoFeeder?.active,
                }, {
                  type: 'spoon', name: 'Feeding Spoon', cost: 200, description: 'Drop a handful of flakes with one click.',
                  owned: !!tools?.spoonOwned,
                }].map((item) => (
                  <div key={item.type} className="flex flex-col p-3 border border-gray-700 rounded bg-gray-800/50">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-10 h-8 flex items-center justify-center bg-gray-700/40 rounded text-2xl">
                          {item.type === 'spoon' ? '🥄' : '🤖'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-gray-200 truncate">{item.name}</div>
                          <div className="text-[10px] text-yellow-400 font-semibold">{item.cost} coins</div>
                        </div>
                      </div>
                      {item.owned ? (
                        <Button
                          size="sm"
                          disabled={item.type === 'spoon' ? !onSelectTool : !onToggleAutoFeeder}
                          onClick={item.type === 'spoon' ? () => onSelectTool && onSelectTool('spoon') : onToggleAutoFeeder}
                          className={`text-xs px-2 py-1 ${item.type === 'spoon' ? (selectedTool === 'spoon' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600') : (autoFeeder?.active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700')}`}
                        >
                          {item.type === 'spoon' ? (selectedTool === 'spoon' ? 'Selected' : 'Select') : autoFeeder?.active ? 'Turn Off' : 'Turn On'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={(item.type === 'spoon' ? !onBuySpoon : !onBuyAutoFeeder) || coins < item.cost}
                          onClick={() => (item.type === 'spoon' ? onBuySpoon && onBuySpoon(item.cost) : onBuyAutoFeeder && onBuyAutoFeeder(item.cost))}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-xs px-2 py-1"
                        >
                          Buy
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-300 mt-4">Buy new fish</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {[
                  { type: 'goldfish', name: 'Goldfish', cost: 50, description: 'Hardy beginner fish with calm behavior.' },
                  { type: 'angelfish', name: 'Angelfish', cost: 100, description: 'Graceful swimmer; light schooling tendencies.' },
                  { type: 'neon', name: 'Neon Tetra', cost: 75, description: 'Small, vibrant, and schools strongly.' },
                  { type: 'tropical', name: 'Tropical Fish', cost: 150, description: 'Colorful mid-water fish; loose schooling.' },
                  { type: 'betta', name: 'Betta', cost: 120, description: 'Flowing fins and bold colors; prefers its space.' },
                  { type: 'cherry-barb', name: 'Cherry Barb', cost: 90, description: 'Peaceful schooling barb with a red hue.' },
                  { type: 'guppy', name: 'Guppy', cost: 60, description: 'Active, hardy livebearer; great in groups.' },
                  { type: 'pearl-gourami', name: 'Pearl Gourami', cost: 140, description: 'Elegant with pearly spots; gentle demeanor.' },
                  { type: 'tiger-barb', name: 'Tiger Barb', cost: 110, description: 'Striped and lively; energetic schooling fish.' },
                  { type: 'jewel-cichlid', name: 'Jewel Cichlid', cost: 170, description: 'Striking red coloration; more territorial.' },
                ].map((item) => {
                  const size = FISH_CONFIG.FISH_SIZES[item.type as keyof typeof FISH_CONFIG.FISH_SIZES] || FISH_CONFIG.FISH_SIZES.goldfish
                  const preview = { width: Math.min(size.width * 0.8, 48), height: Math.min(size.height * 0.8, 32) }
                  return (
                    <div key={item.type} className="flex flex-col p-3 border border-gray-700 rounded bg-gray-800/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-8 flex items-center justify-center bg-gray-700/40 rounded">
                          <FishSVG type={item.type} width={preview.width} height={preview.height} className="drop-shadow-sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-gray-200 truncate">{item.name}</div>
                          <div className="text-[10px] text-yellow-400 font-semibold">{item.cost} coins</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mb-2 leading-snug">{item.description}</p>
                      <Button
                        size="sm"
                        disabled={!onBuyFish || coins < item.cost}
                        onClick={() => onBuyFish && onBuyFish(item.type, item.cost)}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-xs py-1"
                      >
                        Buy
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
          <div className="flex h-[70vh]">
            {/* Sidebar */}
            <aside className="w-56 border-r border-gray-800 p-3 space-y-3 hidden sm:block">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setHealthFilter('all')}
                  className={`rounded p-2 text-center border ${
                    healthFilter === 'all' ? 'bg-gray-800/70 border-gray-600' : 'bg-gray-800/40 border-gray-700'
                  }`}
                >
                  <div className="text-lg font-bold text-blue-400">{totalFish}</div>
                  <div className="text-[10px] text-gray-400">Total</div>
                </button>
                <button
                  onClick={() => setHealthFilter('healthy')}
                  className={`rounded p-2 text-center border ${
                    healthFilter === 'healthy' ? 'bg-gray-800/70 border-gray-600' : 'bg-gray-800/40 border-gray-700'
                  }`}
                >
                  <div className="text-lg font-bold text-green-400">{healthyFish}</div>
                  <div className="text-[10px] text-gray-400">Healthy</div>
                </button>
                <button
                  onClick={() => setHealthFilter('hungry')}
                  className={`rounded p-2 text-center border ${
                    healthFilter === 'hungry' ? 'bg-gray-800/70 border-gray-600' : 'bg-gray-800/40 border-gray-700'
                  }`}
                >
                  <div className="text-lg font-bold text-red-400">{hungryFish}</div>
                  <div className="text-[10px] text-gray-400">Hungry</div>
                </button>
                <div className="rounded p-2 text-center border bg-gray-800/40 border-gray-700">
                  <div className="text-lg font-bold text-yellow-400">{averageHunger}%</div>
                  <div className="text-[10px] text-gray-400">Avg</div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xs text-gray-300 mb-2">Species</div>
                <div className="space-y-2 overflow-y-auto max-h-48 pr-1">
                  {Object.entries(fishCounts).map(([type, count]) => (
                    <SpeciesButton key={type} type={type} count={count} />
                  ))}
                </div>
                {(selectedSpecies !== 'all' || healthFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-gray-300 hover:text-white"
                    onClick={() => {
                      setSelectedSpecies('all')
                      setHealthFilter('all')
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1 p-3 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <label className="text-xs text-gray-300">Sort by</label>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as any)}
                  className="bg-gray-800 border border-gray-700 text-gray-100 text-xs rounded px-2 py-1"
                >
                  <option value="hunger">Hunger</option>
                  <option value="type">Species</option>
                  <option value="id">ID</option>
                </select>
                <select
                  value={sortDir}
                  onChange={(e) => setSortDir(e.target.value as any)}
                  className="bg-gray-800 border border-gray-700 text-gray-100 text-xs rounded px-2 py-1"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                {sortedFish.map((f) => {
                  const healthStatus = getHealthStatus(f.hunger)
                  const size = FISH_CONFIG.FISH_SIZES[f.type as keyof typeof FISH_CONFIG.FISH_SIZES] || FISH_CONFIG.FISH_SIZES.goldfish
                  const preview = { width: Math.min(size.width * 0.8, 48), height: Math.min(size.height * 0.8, 32) }
                  return (
                    <div key={f.id} className="bg-gray-800/40 border border-gray-700 rounded-md p-2 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-8 flex items-center justify-center bg-gray-700/40 rounded">
                          <FishSVG type={f.type} width={preview.width} height={preview.height} className="drop-shadow-sm" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-gray-200 truncate">{getFishName(f.type)}</div>
                          <div className="text-[10px] text-gray-400">ID: {f.id}</div>
                        </div>
                        <div className={`ml-auto w-2 h-2 rounded-full ${healthStatus.color}`} title={healthStatus.text} />
                      </div>
                      <div className="text-[11px] text-gray-300 flex items-center justify-between">
                        <span>Hunger: {f.hunger}%</span>
                        <span className="text-gray-500">Speed: {f.speed.toFixed(1)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600/80 hover:bg-green-700/90 text-white border-green-500 text-xs py-1"
                          onClick={() => onFeedFish && onFeedFish(f.id, 20)}
                        >
                          Feed
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 text-red-300 hover:text-red-100 hover:bg-red-900/30 border border-red-800/30 text-xs py-1"
                          onClick={() => onRemoveFish && onRemoveFish(f.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )
                })}
                {sortedFish.length === 0 && (
                  <div className="col-span-full text-center text-gray-400 text-sm py-10">No fish match the current filters.</div>
                )}
              </div>
            </div>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default FishInventory
