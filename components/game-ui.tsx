"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FishSVG } from "@/components/fish-svg"
import FishInventory from "@/components/fish-inventory" // Import FishInventory component

interface FishData {
  id: number
  type: string
  x: number
  y: number
  hunger: number
  speed: number
}

interface GameUIProps {
  coins: number
  fish: FishData[]
  onBuyFish: (fishType: string, cost: number) => void
}

export function GameUI({ coins, fish, onBuyFish }: GameUIProps) {
  const [showShop, setShowShop] = useState(false)
  const [showInventory, setShowInventory] = useState(false) // Added inventory state

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

  const getPreviewSize = (type: string) => {
    const previewSizes = {
      goldfish: { width: 32, height: 22 },
      neon: { width: 24, height: 16 },
      tropical: { width: 36, height: 24 },
      angelfish: { width: 38, height: 48 },
      shark: { width: 64, height: 42 },
    }
    return previewSizes[type as keyof typeof previewSizes] || previewSizes.goldfish
  }

  const averageHunger = fish.length > 0 ? Math.round(fish.reduce((sum, f) => sum + f.hunger, 0) / fish.length) : 0

  return (
    <>
      <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-20">
        <div className="flex gap-2">
          <Badge
            variant="secondary"
            className="text-sm px-3 py-1 bg-gray-900/70 text-gray-100 backdrop-blur border-gray-700"
          >
            💰 {coins}
          </Badge>
          <Badge
            variant="secondary"
            className="text-sm px-3 py-1 bg-gray-900/70 text-gray-100 backdrop-blur border-gray-700"
          >
            🐟 {fish.length}
          </Badge>
          <Badge
            variant="secondary"
            className="text-sm px-3 py-1 bg-gray-900/70 text-gray-100 backdrop-blur border-gray-700"
          >
            ❤️ {averageHunger}%
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowInventory(!showInventory)}
            size="sm"
            className="bg-gray-900/70 hover:bg-gray-800/80 text-gray-100 backdrop-blur border-gray-700 text-sm px-3 py-1"
          >
            📋 Inventory
          </Button>
          <Button
            onClick={() => setShowShop(!showShop)}
            size="sm"
            className="bg-gray-900/70 hover:bg-gray-800/80 text-gray-100 backdrop-blur border-gray-700 text-sm px-3 py-1"
          >
            🛒 Shop
          </Button>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 z-20">
        <div className="bg-gray-900/60 rounded-lg backdrop-blur border-gray-700 p-1">
          <p className="text-xs text-gray-300">Click fish to feed • They generate coins over time</p>
        </div>
      </div>

      {/* Shop Modal */}
      {showShop && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
          <Card className="w-full max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-900/95 backdrop-blur border-gray-700 mx-4">
            <CardHeader>
              <CardTitle className="flex justify-between items-center text-gray-100">
                Fish Shop
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShop(false)}
                  className="text-gray-400 hover:text-gray-100"
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fishShop.map((item) => {
                  const previewSize = getPreviewSize(item.type)
                  return (
                    <div
                      key={item.type}
                      className="flex flex-col p-4 border border-gray-700 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-12 flex items-center justify-center bg-gray-700/50 rounded overflow-hidden">
                            <FishSVG
                              type={item.type}
                              width={previewSize.width}
                              height={previewSize.height}
                              className="drop-shadow-sm"
                            />
                          </div>
                          <div>
                            <span className="text-gray-200 font-medium">{item.name}</span>
                            <div className="text-sm text-yellow-400 font-semibold">{item.cost} coins</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          disabled={coins < item.cost}
                          onClick={() => onBuyFish(item.type, item.cost)}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-xs px-3 py-1 shrink-0"
                        >
                          Buy
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                    </div>
                  )
                })}
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
