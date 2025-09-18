"use client"

import { useState, useEffect } from "react"
import { FISH_CONFIG, generateRandomInterval } from "@/lib/fish-config"
import { FishSVG } from "@/components/fish-svg"

interface FishData {
  id: number
  type: string
  x: number
  y: number
  hunger: number
  speed: number
}

interface FishProps {
  fish: FishData
  onFeed: () => void
  isBeingFed?: boolean // Added prop for feeding visual feedback
}

function levyFlight(mu = 1.5, minStep = 1, maxStep = 100) {
  const u = Math.random()
  const step = minStep * Math.pow(1 - u, -1 / (mu - 1))
  return Math.min(step, maxStep)
}

function randomDirection() {
  const angle = Math.random() * 2 * Math.PI
  return { dx: Math.cos(angle), dy: Math.sin(angle) }
}

function generateWaypoint(x: number, y: number, mu: number) {
  const step = levyFlight(mu, FISH_CONFIG.WAYPOINT_MIN_STEP, FISH_CONFIG.WAYPOINT_MAX_STEP)
  const { dx, dy } = randomDirection()

  const newX = Math.max(FISH_CONFIG.BOUNDARY_LEFT, Math.min(FISH_CONFIG.BOUNDARY_RIGHT, x + dx * step))
  const newY = Math.max(FISH_CONFIG.BOUNDARY_TOP, Math.min(FISH_CONFIG.BOUNDARY_BOTTOM, y + dy * step))

  return { x: newX, y: newY }
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress
}

export function Fish({ fish, onFeed, isBeingFed }: FishProps) {
  const [position, setPosition] = useState({ x: fish.x, y: fish.y })
  const [targetWaypoint, setTargetWaypoint] = useState({ x: fish.x, y: fish.y })
  const [facingRight, setFacingRight] = useState(true)
  const [movementProgress, setMovementProgress] = useState(0)

  useEffect(() => {
    let waypointTimeout: NodeJS.Timeout

    const scheduleNextWaypoint = () => {
      const randomDelay = generateRandomInterval()
      waypointTimeout = setTimeout(() => {
        setPosition((currentPos) => {
          const newWaypoint = generateWaypoint(currentPos.x, currentPos.y, FISH_CONFIG.LEVY_MU)
          setTargetWaypoint(newWaypoint)
          setMovementProgress(0)

          // Update facing direction based on waypoint direction
          if (newWaypoint.x > currentPos.x) {
            setFacingRight(true)
          } else if (newWaypoint.x < currentPos.x) {
            setFacingRight(false)
          }

          return currentPos // Don't change position here
        })

        // Schedule the next waypoint with a new random interval
        scheduleNextWaypoint()
      }, randomDelay)
    }

    const initialDelay = setTimeout(() => {
      scheduleNextWaypoint()
    }, 500) // Start after 0.5 seconds

    return () => {
      clearTimeout(waypointTimeout)
      clearTimeout(initialDelay)
    }
  }, []) // Remove position dependency to prevent restart loops

  useEffect(() => {
    const animationInterval = setInterval(() => {
      setMovementProgress((prev) => {
        const newProgress = Math.min(prev + FISH_CONFIG.MOVEMENT_SPEED, 1)

        setPosition((currentPos) => ({
          x: lerp(currentPos.x, targetWaypoint.x, FISH_CONFIG.MOVEMENT_SPEED),
          y: lerp(currentPos.y, targetWaypoint.y, FISH_CONFIG.MOVEMENT_SPEED),
        }))

        return newProgress
      })
    }, 1000 / FISH_CONFIG.ANIMATION_FPS) // Using config FPS

    return () => clearInterval(animationInterval)
  }, [targetWaypoint])

  const getHungerColor = (hunger: number) => {
    if (hunger > 70) return "text-green-400"
    if (hunger > 40) return "text-yellow-400"
    return "text-red-400"
  }

  const size =
    FISH_CONFIG.FISH_SIZES[fish.type as keyof typeof FISH_CONFIG.FISH_SIZES] || FISH_CONFIG.FISH_SIZES.goldfish

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-300 hover:scale-110 float-animation ${
        isBeingFed ? "animate-pulse scale-125" : ""
      }`} // Added feeding animation classes
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        zIndex: 10,
      }}
      onClick={onFeed}
    >
      <div className="relative">
        {isBeingFed && <div className="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping scale-150" />}

        <FishSVG
          type={fish.type}
          width={size.width}
          height={size.height}
          facingRight={facingRight}
          className="drop-shadow-lg"
        />

        {/* Hunger indicator */}
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white/50">
          <div
            className={`w-full h-full rounded-full ${getHungerColor(fish.hunger)}`}
            style={{ opacity: fish.hunger / 100 }}
          />
        </div>

        {(fish.hunger > 95 || isBeingFed) && (
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-green-400 animate-bounce">
            {isBeingFed ? "🍽️" : "❤️"}
          </div>
        )}
      </div>
    </div>
  )
}
