"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FishSVG } from "@/components/fish-svg"
import FishInventory from "@/components/fish-inventory"

interface FishData {
  id: number
  type: string
  x: number
  y: number
  hunger: number
  speed: number
}

interface AutoFeederData {
  owned: boolean
  active: boolean
  lastFeedTime: number
  feedInterval: number
}

interface GameUIProps {
  coins: number
  fish: FishData[]
  onBuyFish: (fishType: string, cost: number) => void
  showHowTo: boolean
  autoFeeder: AutoFeederData | null
  onBuyAutoFeeder: (cost: number) => void
  onToggleAutoFeeder: () => void
}

export function GameUI({
  coins,
  fish,
  onBuyFish,
  showHowTo,
  autoFeeder,
  onBuyAutoFeeder,
  onToggleAutoFeeder,
}: GameUIProps) {
  const [showShop, setShowShop] = useState(false)
  const [showInventory, setShowInventory] = useState(false)

  const fishShop = [
    {
      type: "goldfish",
      name: "Goldfish",
      cost: 50,
      description: "A classic orange goldfish. Hardy and friendly, perfect for beginners!",
    },
    {
      type: "angelfish",
      name: "Angelfish",
      cost: 100,
      description: "Elegant silver fish with tall fins. Graceful swimmers that add sophistication.",
    },
    {
      type: "neon",
      name: "Neon Tetra",
      cost: 75,
      description: "Bright cyan fish with pink stripes. Small but vibrant schooling fish.",
    },
    {
      type: "tropical",
      name: "Tropical Fish",
      cost: 150,
      description: "Golden yellow with orange stripes. Exotic beauty from warm waters.",
    },
    {
      type: "shark",
      name: "Baby Shark",
      cost: 300,
      description: "A friendly gray shark. The apex predator of your aquarium!",
    },
  ]

  const equipmentShop = [
    {
      type: "auto-feeder",
      name: "Auto Feeder",
      cost: 500,
      description:
        "Automatically feeds your fish every 30 seconds when they're hungry. A must-have for busy aquarium owners!",
      owned: autoFeeder?.owned || false,
    },
  ]

  const getPreviewSize = (type: string) => {
    const previewSizes = {
      goldfish: { width: 32, height: 22 },
      neon: { width: 24, height: 16 },
      tropical: { width: 36, height: 24 },
      angelfish: { width: 38, height: 48 },
      shark: { width: 64, height: 42 },
      "auto-feeder": { width: 32, height: 32 },
    }
    return previewSizes[type as keyof typeof previewSizes] || previewSizes.goldfish
  }

  const averageHunger = fish.length > 0 ? Math.round(fish.reduce((sum, f) => sum + f.hunger, 0) / fish.length) : 0

  return (
    <>
      <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex z-20">
        <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
          <Badge
            variant="secondary"
            className="text-xs sm:text-sm px-2 py-1 sm:px-3 bg-gray-900/70 text-gray-100 backdrop-blur border-gray-700"
          >
            💰 {coins}
          </Badge>
          <Badge
            variant="secondary"
            className="text-xs sm:text-sm px-2 py-1 sm:px-3 bg-gray-900/70 text-gray-100 backdrop-blur border-gray-700"
          >
            🐟 {fish.length}
          </Badge>
          <Badge
            variant="secondary"
            className="text-xs sm:text-sm px-2 py-1 sm:px-3 bg-gray-900/70 text-gray-100 backdrop-blur border-gray-700"
          >
            ❤️ {averageHunger}%
          </Badge>
          {autoFeeder?.owned && (
            <Badge
              variant="secondary"
              className={`text-xs sm:text-sm px-2 py-1 sm:px-3 backdrop-blur border-gray-700 ${
                autoFeeder.active
                  ? "bg-green-900/70 text-green-100 border-green-700"
                  : "bg-red-900/70 text-red-100 border-red-700"
              }`}
            >
              🤖 {autoFeeder.active ? "ON" : "OFF"}
            </Badge>
          )}
        </div>
      </div>

      {showHowTo && (
        <div className="absolute bottom-16 left-2 right-2 sm:bottom-20 sm:left-3 sm:right-auto z-20">
          <div className="bg-gray-900/80 rounded-lg backdrop-blur border-gray-700 p-3 sm:p-2 animate-pulse">
            <p className="text-xs sm:text-sm text-gray-300 text-center sm:text-left">
              <span className="hidden sm:inline">👆 Click fish to feed • They generate coins over time</span>
              <span className="sm:hidden">👆 Tap fish to feed them</span>
            </p>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-4 right-4 z-20">
        <div className="flex gap-3 justify-center max-w-sm mx-auto">
          <Button
            onClick={() => setShowInventory(!showInventory)}
            size="md"
            className="flex-1 bg-gray-900/80 hover:bg-gray-800/90 text-gray-100 backdrop-blur border-gray-700 text-sm p-2 rounded-lg shadow-lg"
          >
            📋 <span className="ml-2">Inventory</span>
          </Button>
          <Button
            onClick={() => setShowShop(!showShop)}
            size="md"
            className="flex-1 bg-blue-600/80 hover:bg-blue-700/90 text-white backdrop-blur border-blue-500 text-sm p-2 rounded-lg shadow-lg"
          >
            🛒 <span className="ml-2">Shop</span>
          </Button>
        </div>
      </div>

      {/* Shop Modal */}
      {showShop && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30 p-2 sm:p-4">
          <Card className="w-full max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden bg-gray-900/95 backdrop-blur border-gray-700">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex justify-between items-center text-gray-100 text-lg sm:text-xl">
                Aquarium Shop
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShop(false)}
                  className="text-gray-400 hover:text-gray-100 min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] p-2"
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1">
              {/* Equipment section */}
              <div className="mb-6">
                <h3 className="text-gray-200 font-semibold mb-3 text-sm sm:text-base">Equipment</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {equipmentShop.map((item) => (
                    <div
                      key={item.type}
                      className="flex flex-col p-3 sm:p-4 border border-gray-700 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="w-12 h-10 sm:w-16 sm:h-12 flex items-center justify-center bg-gray-700/50 rounded overflow-hidden shrink-0">
                            <div className="text-2xl">🤖</div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-gray-200 font-medium text-sm sm:text-base truncate">{item.name}</div>
                            <div className="text-xs sm:text-sm text-yellow-400 font-semibold">
                              {item.owned ? "Owned" : `${item.cost} coins`}
                            </div>
                          </div>
                        </div>
                        {item.owned ? (
                          <Button
                            size="sm"
                            onClick={onToggleAutoFeeder}
                            className={`text-xs px-3 py-2 shrink-0 min-h-[36px] sm:min-h-[32px] ${
                              autoFeeder?.active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {autoFeeder?.active ? "Turn Off" : "Turn On"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={coins < item.cost}
                            onClick={() => onBuyAutoFeeder(item.cost)}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-xs px-3 py-2 shrink-0 min-h-[36px] sm:min-h-[32px]"
                          >
                            Buy
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fish section */}
              <div>
                <h3 className="text-gray-200 font-semibold mb-3 text-sm sm:text-base">Fish</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-4">
                  {fishShop.map((item) => {
                    const previewSize = getPreviewSize(item.type)
                    return (
                      <div
                        key={item.type}
                        className="flex flex-col p-3 sm:p-4 border border-gray-700 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="w-12 h-10 sm:w-16 sm:h-12 flex items-center justify-center bg-gray-700/50 rounded overflow-hidden shrink-0">
                              <FishSVG
                                type={item.type}
                                width={previewSize.width}
                                height={previewSize.height}
                                className="drop-shadow-sm"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-gray-200 font-medium text-sm sm:text-base truncate">{item.name}</div>
                              <div className="text-xs sm:text-sm text-yellow-400 font-semibold">{item.cost} coins</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            disabled={coins < item.cost}
                            onClick={() => onBuyFish(item.type, item.cost)}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-xs px-3 py-2 shrink-0 min-h-[36px] sm:min-h-[32px]"
                          >
                            Buy
                          </Button>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventory && <FishInventory fish={fish} onClose={() => setShowInventory(false)} />}
    </>
  )
}
