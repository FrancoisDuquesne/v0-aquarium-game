"use client"

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
}

const FishInventory = ({ fish, onClose }: FishInventoryProps) => {
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
    }
    return names[type as keyof typeof names] || "Unknown Fish"
  }

  const getHealthStatus = (hunger: number) => {
    if (hunger > 70) return { text: "Healthy", color: "bg-green-500" }
    if (hunger > 40) return { text: "Okay", color: "bg-yellow-500" }
    return { text: "Hungry", color: "bg-red-500" }
  }

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
      <Card className="w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-gray-900/95 backdrop-blur border-gray-700 mx-4">
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-gray-100">
            <div className="flex items-center gap-2">
              🐟 Fish Inventory
              <Badge variant="secondary" className="bg-blue-600 text-white">
                {totalFish} fish
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-gray-100">
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{totalFish}</div>
              <div className="text-xs text-gray-400">Total Fish</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{healthyFish}</div>
              <div className="text-xs text-gray-400">Healthy</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{hungryFish}</div>
              <div className="text-xs text-gray-400">Hungry</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-400">{averageHunger}%</div>
              <div className="text-xs text-gray-400">Avg Hunger</div>
            </div>
          </div>

          {/* Fish by Species */}
          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Fish by Species</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(fishCounts).map(([type, count]) => (
                <div key={type} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-8 flex items-center justify-center bg-gray-700/50 rounded">
                      {getFishPreview(type)}
                    </div>
                    <div>
                      <div className="text-gray-200 font-medium">{getFishName(type)}</div>
                      <div className="text-sm text-gray-400">Count: {count}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Fish Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Individual Fish</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {fish.map((fishData) => {
                const healthStatus = getHealthStatus(fishData.hunger)
                return (
                  <div
                    key={fishData.id}
                    className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 border border-gray-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 flex items-center justify-center">{getFishPreview(fishData.type)}</div>
                      <div>
                        <div className="text-sm text-gray-200">{getFishName(fishData.type)}</div>
                        <div className="text-xs text-gray-400">ID: {fishData.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm text-gray-300">{fishData.hunger}% hunger</div>
                        <div className="text-xs text-gray-400">Speed: {fishData.speed.toFixed(1)}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${healthStatus.color}`} title={healthStatus.text} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FishInventory
