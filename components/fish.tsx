"use client"

import { useState, useEffect } from "react"
import { FISH_CONFIG, generateRandomInterval } from "@/lib/fish-config"

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

export function Fish({ fish, onFeed }: FishProps) {
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

  const getFishSVG = (type: string) => {
    const size = FISH_CONFIG.FISH_SIZES[type as keyof typeof FISH_CONFIG.FISH_SIZES] || FISH_CONFIG.FISH_SIZES.goldfish

    switch (type) {
      case "goldfish":
        return (
          <svg width={size.width} height={size.height} viewBox="0 0 40 28" className="drop-shadow-lg">
            <ellipse cx="25" cy="14" rx="15" ry="8" fill="#FF8C00" />
            <ellipse cx="28" cy="14" rx="8" ry="5" fill="#FFB347" />
            <path d="M10 14 L2 8 L8 14 L2 20 Z" fill="#FF6B35" />
            <circle cx="32" cy="11" r="2" fill="#000" />
            <path d="M25 6 L20 2 L22 8 Z" fill="#FF6B35" />
            <path d="M25 22 L20 26 L22 20 Z" fill="#FF6B35" />
          </svg>
        )
      case "angelfish":
        return (
          <svg width={size.width} height={size.height} viewBox="0 0 35 45" className="drop-shadow-lg">
            <ellipse cx="17" cy="22" rx="8" ry="12" fill="#C0C0C0" />
            <path d="M17 10 L12 2 L22 2 Z" fill="#A0A0A0" />
            <path d="M17 34 L12 42 L22 42 Z" fill="#A0A0A0" />
            <path d="M9 22 L2 18 L2 26 Z" fill="#A0A0A0" />
            <circle cx="20" cy="18" r="1.5" fill="#000" />
            <path d="M17 15 L17 29" stroke="#808080" strokeWidth="1" />
          </svg>
        )
      case "neon":
        return (
          <svg width={size.width} height={size.height} viewBox="0 0 25 18" className="drop-shadow-lg">
            <ellipse cx="15" cy="9" rx="10" ry="5" fill="#00CED1" />
            <path d="M5 9 L1 6 L3 9 L1 12 Z" fill="#20B2AA" />
            <circle cx="20" cy="7" r="1" fill="#000" />
            <path d="M15 4 L15 14" stroke="#FF1493" strokeWidth="2" />
          </svg>
        )
      case "tropical":
        return (
          <svg width={size.width} height={size.height} viewBox="0 0 38 25" className="drop-shadow-lg">
            <ellipse cx="22" cy="12" rx="14" ry="7" fill="#FFD700" />
            <path d="M8 12 L2 8 L6 12 L2 16 Z" fill="#FFA500" />
            <circle cx="28" cy="9" r="1.5" fill="#000" />
            <path d="M22 5 L18 2 L20 7 Z" fill="#FF8C00" />
            <path d="M22 19 L18 22 L20 17 Z" fill="#FF8C00" />
            <path d="M15 8 L25 8" stroke="#FF4500" strokeWidth="1" />
            <path d="M15 16 L25 16" stroke="#FF4500" strokeWidth="1" />
          </svg>
        )
      case "shark":
        return (
          <svg width={size.width} height={size.height} viewBox="0 0 55 30" className="drop-shadow-lg">
            <ellipse cx="30" cy="15" rx="20" ry="8" fill="#708090" />
            <path d="M10 15 L2 12 L8 15 L2 18 Z" fill="#696969" />
            <circle cx="42" cy="12" r="2" fill="#000" />
            <path d="M30 7 L25 2 L28 9 Z" fill="#696969" />
            <path d="M35 23 L30 28 L33 21 Z" fill="#696969" />
            <path d="M45 12 L48 8 L50 15 L48 18 Z" fill="#A9A9A9" />
          </svg>
        )
      default:
        return getFishSVG("goldfish")
    }
  }

  const getHungerColor = (hunger: number) => {
    if (hunger > 70) return "text-green-400"
    if (hunger > 40) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <div
      className="absolute cursor-pointer transition-transform hover:scale-110 float-animation"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `scaleX(${facingRight ? 1 : -1})`,
        zIndex: 10,
      }}
      onClick={onFeed}
    >
      <div className="relative">
        {getFishSVG(fish.type)}

        {/* Hunger indicator */}
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white/50">
          <div
            className={`w-full h-full rounded-full ${getHungerColor(fish.hunger)}`}
            style={{ opacity: fish.hunger / 100 }}
          />
        </div>

        {/* Feed animation */}
        {fish.hunger > 95 && (
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-green-400 animate-bounce">
            ❤️
          </div>
        )}
      </div>
    </div>
  )
}
