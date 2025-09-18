"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

  const fishShop = [
    { type: "goldfish", name: "Goldfish", cost: 50 },
    { type: "angelfish", name: "Angelfish", cost: 100 },
    { type: "neon", name: "Neon Tetra", cost: 75 },
    { type: "tropical", name: "Tropical Fish", cost: 150 },
    { type: "shark", name: "Baby Shark", cost: 300 },
  ]

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

        <Button
          onClick={() => setShowShop(!showShop)}
          size="sm"
          className="bg-gray-900/70 hover:bg-gray-800/80 text-gray-100 backdrop-blur border-gray-700 text-sm px-3 py-1"
        >
          🛒 Shop
        </Button>
      </div>

      <div className="absolute bottom-3 left-3 z-20">
        <div className="bg-gray-900/60 rounded-lg backdrop-blur border-gray-700 p-1">
            <p className="text-xs text-gray-300">Click fish to feed • They generate coins over time</p>
        </div>
      </div>

      {/* Shop Modal */}
      {showShop && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
          <Card className="w-96 max-h-[80vh] overflow-y-auto bg-gray-900/95 backdrop-blur border-gray-700">
            <CardHeader className="pb-4">
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
            <CardContent className="space-y-6">
              {/* Fish Section */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-200">Available Fish</h3>
                <div className="grid gap-2">
                  {fishShop.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between p-3 border border-gray-700 rounded bg-gray-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                          <span className="text-lg">🐟</span>
                        </div>
                        <span className="text-gray-200">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">{item.cost} coins</span>
                        <Button
                          size="sm"
                          disabled={coins < item.cost}
                          onClick={() => onBuyFish(item.type, item.cost)}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-xs px-3 py-1"
                        >
                          Buy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
