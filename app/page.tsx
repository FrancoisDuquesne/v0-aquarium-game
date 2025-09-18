"use client"

import { useState, useEffect } from "react"
import { AquariumDisplay } from "@/components/aquarium-display"
import { GameUI } from "@/components/game-ui"

export default function AquariumGame() {
  const [gameState, setGameState] = useState({
    coins: 1000,
    fish: [
      { id: 1, type: "goldfish", x: 20, y: 50, hunger: 80, speed: 2 },
      { id: 2, type: "angelfish", x: 60, y: 30, hunger: 60, speed: 1.5 },
      { id: 3, type: "neon", x: 80, y: 70, hunger: 90, speed: 3 },
    ],
    lastFeedTime: Date.now(),
    hasEverFed: false,
    lastSaveTime: Date.now(),
    autoFeeder: {
      owned: false,
      active: false,
      lastFeedTime: 0,
      feedInterval: 30000, // 30 seconds
    },
  })

  const [feedingFish, setFeedingFish] = useState<number | null>(null)

  const getFishCoinRate = (fishType: string) => {
    const rates = {
      neon: 0.5, // 75 coins cost -> 0.5 coins/5sec
      goldfish: 0.33, // 50 coins cost -> 0.33 coins/5sec
      angelfish: 0.67, // 100 coins cost -> 0.67 coins/5sec
      tropical: 1.0, // 150 coins cost -> 1.0 coins/5sec
      shark: 2.0, // 300 coins cost -> 2.0 coins/5sec
    }
    return rates[fishType as keyof typeof rates] || 0.33
  }

  useEffect(() => {
    const savedState = localStorage.getItem("aquarium-game")
    if (savedState) {
      const parsed = JSON.parse(savedState)
      const now = Date.now()
      const timeDiff = now - (parsed.lastSaveTime || now)

      if (!parsed.autoFeeder) {
        parsed.autoFeeder = {
          owned: false,
          active: false,
          lastFeedTime: 0,
          feedInterval: 30000,
        }
      }

      const maxOfflineTime = 24 * 60 * 60 * 1000 // 24 hours
      const offlineTime = Math.min(timeDiff, maxOfflineTime)
      const intervals = Math.floor(offlineTime / 5000) // 5 second intervals

      if (intervals > 0) {
        let offlineCoins = 0
        parsed.fish.forEach((fish: any) => {
          const coinRate = getFishCoinRate(fish.type)
          offlineCoins += coinRate * intervals
        })

        parsed.coins += Math.floor(offlineCoins)
        parsed.lastSaveTime = now

        if (offlineCoins > 1) {
          console.log(`[v0] Earned ${Math.floor(offlineCoins)} coins while away!`)
        }
      }

      setGameState(parsed)
    }
  }, [])

  useEffect(() => {
    const stateToSave = {
      ...gameState,
      lastSaveTime: Date.now(),
    }
    localStorage.setItem("aquarium-game", JSON.stringify(stateToSave))
  }, [gameState])

  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => {
        let coinsToAdd = 0
        prev.fish.forEach((fish) => {
          coinsToAdd += getFishCoinRate(fish.type)
        })

        const newState = {
          ...prev,
          coins: prev.coins + Math.floor(coinsToAdd * 100) / 100,
          fish: prev.fish.map((fish) => ({
            ...fish,
            hunger: Math.max(0, fish.hunger - 0.5),
          })),
        }

        if (prev.autoFeeder?.owned && prev.autoFeeder?.active) {
          const now = Date.now()
          if (now - prev.autoFeeder.lastFeedTime >= prev.autoFeeder.feedInterval) {
            newState.fish = newState.fish.map((fish) => ({
              ...fish,
              hunger: fish.hunger < 80 ? Math.min(100, fish.hunger + 15) : fish.hunger,
            }))
            newState.autoFeeder.lastFeedTime = now
          }
        }

        return newState
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const feedFish = (fishId: number) => {
    setFeedingFish(fishId)
    setTimeout(() => setFeedingFish(null), 800)

    setGameState((prev) => ({
      ...prev,
      fish: prev.fish.map((fish) => (fish.id === fishId ? { ...fish, hunger: Math.min(100, fish.hunger + 20) } : fish)),
      lastFeedTime: Date.now(),
      hasEverFed: true,
    }))
  }

  const buyFish = (fishType: string, cost: number) => {
    if (gameState.coins >= cost) {
      const newFish = {
        id: Date.now(),
        type: fishType,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        hunger: 100,
        speed: Math.random() * 2 + 1,
      }

      setGameState((prev) => ({
        ...prev,
        coins: prev.coins - cost,
        fish: [...prev.fish, newFish],
      }))
    }
  }

  const buyAutoFeeder = (cost: number) => {
    if (gameState.coins >= cost && !gameState.autoFeeder?.owned) {
      setGameState((prev) => ({
        ...prev,
        coins: prev.coins - cost,
        autoFeeder: {
          ...prev.autoFeeder,
          owned: true,
          active: true,
          lastFeedTime: Date.now(),
        },
      }))
    }
  }

  const toggleAutoFeeder = () => {
    if (gameState.autoFeeder?.owned) {
      setGameState((prev) => ({
        ...prev,
        autoFeeder: {
          ...prev.autoFeeder,
          active: !prev.autoFeeder.active,
          lastFeedTime: prev.autoFeeder.active ? 0 : Date.now(),
        },
      }))
    }
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-gradient-to-b from-blue-400 via-blue-600 to-blue-900">
      <AquariumDisplay
        fish={gameState.fish}
        onFeedFish={feedFish}
        feedingFish={feedingFish}
        autoFeeder={gameState.autoFeeder}
      />
      <GameUI
        coins={gameState.coins}
        fish={gameState.fish}
        onBuyFish={buyFish}
        showHowTo={!gameState.hasEverFed}
        autoFeeder={gameState.autoFeeder}
        onBuyAutoFeeder={buyAutoFeeder}
        onToggleAutoFeeder={toggleAutoFeeder}
      />
    </div>
  )
}
