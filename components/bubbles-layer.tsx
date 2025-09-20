"use client"

import { useEffect, useState, memo } from "react"
import { Bubbles } from "@/components/bubbles"

interface Bubble {
  id: number
  x: number
  delay: number
}

export const BubblesLayer = memo(function BubblesLayer() {
  const [bubbles, setBubbles] = useState<Bubble[]>([])

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

  return <Bubbles bubbles={bubbles} />
})

