"use client"

import { useEffect, useState } from "react"
import { Fish } from "./fish"
import { Bubbles } from "./bubbles"
import { AutoFeeder } from "./auto-feeder"

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

interface AquariumDisplayProps {
  fish: FishData[]
  onFeedFish: (fishId: number) => void
  feedingFish?: number | null
  autoFeeder: AutoFeederData // Added auto feeder prop
  onToggleAutoFeeder?: () => void // Added toggle function prop
}

export function AquariumDisplay({
  fish,
  onFeedFish,
  feedingFish,
  autoFeeder,
  onToggleAutoFeeder,
}: AquariumDisplayProps) {
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; delay: number }>>([])

  useEffect(() => {
    const interval = setInterval(() => {
      const newBubble = {
        id: Date.now() + Math.random(),
        x: Math.random() * 100,
        delay: Math.random() * 2,
      }

      setBubbles((prev) => [...prev.slice(-10), newBubble])
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const safeFish = Array.isArray(fish) ? fish : []

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/coral-reef-bg.png')",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 via-transparent to-cyan-100/10" />

      {/* Fish */}
      {safeFish.map((fishData) => (
        <Fish
          key={fishData.id}
          fish={fishData}
          onFeed={() => onFeedFish(fishData.id)}
          isBeingFed={feedingFish === fishData.id}
        />
      ))}

      {autoFeeder?.owned && onToggleAutoFeeder && (
        <AutoFeeder isActive={autoFeeder.active} onToggle={onToggleAutoFeeder} />
      )}

      {/* Bubbles */}
      <Bubbles bubbles={bubbles} />

      <div
        className="absolute inset-0 bg-gradient-to-br from-cyan-100/3 via-transparent to-blue-100/3 pointer-events-none animate-pulse"
        style={{ animationDuration: "4s" }}
      />
    </div>
  )
}
