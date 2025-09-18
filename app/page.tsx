"use client"

import { useState, useEffect } from "react"
import { AquariumDisplay } from "@/components/aquarium-display"
import { GameUI } from "@/components/game-ui"

export default function AquariumGame() {
  const [gameState, setGameState] = useState({
    coins: 100,
    fish: [
      { id: 1, type: "goldfish", x: 20, y: 50, hunger: 80, speed: 2 },
      { id: 2, type: "angelfish", x: 60, y: 30, hunger: 60, speed: 1.5 },
      { id: 3, type: "neon", x: 80, y: 70, hunger: 90, speed: 3 },
    ],
    lastFeedTime: Date.now(),
  })

  // Auto-save game state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("aquarium-game")
    if (savedState) {
      setGameState(JSON.parse(savedState))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("aquarium-game", JSON.stringify(gameState))
  }, [gameState])

  // Passive coin generation and hunger decrease
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        coins: prev.coins + prev.fish.length, // Earn coins based on fish count
        fish: prev.fish.map((fish) => ({
          ...fish,
          hunger: Math.max(0, fish.hunger - 0.5), // Slowly decrease hunger
        })),
      }))
    }, 5000) // Every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const feedFish = (fishId: number) => {
    setGameState((prev) => ({
      ...prev,
      fish: prev.fish.map((fish) => (fish.id === fishId ? { ...fish, hunger: Math.min(100, fish.hunger + 20) } : fish)),
      lastFeedTime: Date.now(),
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

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-gradient-to-b from-blue-400 via-blue-600 to-blue-900">
      <AquariumDisplay fish={gameState.fish} onFeedFish={feedFish} />
      <GameUI coins={gameState.coins} fish={gameState.fish} onBuyFish={buyFish} />
    </div>
  )
}
