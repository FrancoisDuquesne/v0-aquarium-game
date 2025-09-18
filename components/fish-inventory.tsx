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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30 p-2 sm:p-4">
      <Card className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-5xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden bg-gray-900/95 backdrop-blur border-gray-700">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-gray-100">
            <div className="flex items-center gap-2">
              🐟 Fish Inventory
              <Badge variant="secondary" className="bg-blue-600 text-white text-xs sm:text-sm">
                {totalFish} fish
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-100 min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] p-2 self-end sm:self-auto"
            >
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 overflow-y-auto flex-1 pb-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-400">{totalFish}</div>
              <div className="text-xs text-gray-400">Total Fish</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-400">{healthyFish}</div>
              <div className="text-xs text-gray-400">Healthy</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-red-400">{hungryFish}</div>
              <div className="text-xs text-gray-400">Hungry</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-400">{averageHunger}%</div>
              <div className="text-xs text-gray-400">Avg Hunger</div>
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-200 mb-3 sm:mb-4">Fish by Species</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Object.entries(fishCounts).map(([type, count]) => (
                <div key={type} className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3">
                    <div className="w-10 h-8 sm:w-12 sm:h-8 flex items-center justify-center bg-gray-700/50 rounded shrink-0">
                      {getFishPreview(type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-gray-200 font-medium text-sm sm:text-base">{getFishName(type)}</div>
                      <div className="text-xs sm:text-sm text-gray-400">Count: {count}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-200 mb-3 sm:mb-4">Individual Fish</h3>
            <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
              {fish.map((fishData) => {
                const healthStatus = getHealthStatus(fishData.hunger)
                return (
                  <div
                    key={fishData.id}
                    className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 border border-gray-700/50 gap-2"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-6 h-5 sm:w-8 sm:h-6 flex items-center justify-center shrink-0">
                        {getFishPreview(fishData.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm text-gray-200 truncate">{getFishName(fishData.type)}</div>
                        <div className="text-xs text-gray-400">ID: {fishData.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-xs sm:text-sm text-gray-300">{fishData.hunger}%</div>
                        <div className="text-xs text-gray-400 hidden sm:block">Speed: {fishData.speed.toFixed(1)}</div>
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
