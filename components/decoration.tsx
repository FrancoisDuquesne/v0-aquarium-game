"use client"

import React from "react"

import { useState } from "react"

interface DecorationData {
  id: number
  type: string
  x: number
  y: number
}

interface DecorationProps {
  decoration: DecorationData
  onMove?: (decorationId: number, x: number, y: number) => void
}

export function Decoration({ decoration, onMove }: DecorationProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const getDecorationSVG = (type: string) => {
    switch (type) {
      case "coral":
        return (
          <svg width="45" height="60" viewBox="0 0 45 60" className="drop-shadow-lg">
            <path
              d="M22 60 L22 45 L18 40 L15 35 L12 30 L10 25 L8 20 L12 15 L16 12 L20 8 L18 5 L15 3 L12 2 L8 4 L5 8 L3 12 L2 16 L4 20 L8 22 L12 20 L16 18 L20 15 L24 12 L28 8 L32 5 L35 3 L38 2 L42 4 L40 8 L37 12 L35 16 L37 20 L40 22 L42 25 L40 30 L37 35 L35 40 L32 45 L28 50 L25 55 L22 60"
              fill="#FF6B6B"
            />
            <path d="M15 50 L18 45 L22 40 L25 35 L28 30 L30 25 L32 20 L28 15 L24 12 L20 8" fill="#FF8E8E" />
            <circle cx="12" cy="15" r="3" fill="#FFB3B3" />
            <circle cx="33" cy="18" r="2" fill="#FFB3B3" />
            <circle cx="20" cy="25" r="2" fill="#FF9999" />
          </svg>
        )
      case "seaweed":
        return (
          <svg width="25" height="80" viewBox="0 0 25 80" className="drop-shadow-lg">
            <path
              d="M12 80 Q8 75 10 70 Q14 65 8 60 Q12 55 10 50 Q6 45 12 40 Q16 35 10 30 Q14 25 8 20 Q12 15 10 10 Q14 5 12 0"
              stroke="#228B22"
              strokeWidth="4"
              fill="none"
            />
            <path
              d="M15 75 Q18 70 16 65 Q12 60 18 55 Q14 50 16 45 Q20 40 14 35 Q10 30 16 25 Q20 20 14 15 Q18 10 16 5"
              stroke="#32CD32"
              strokeWidth="3"
              fill="none"
            />
            <ellipse cx="8" cy="25" rx="3" ry="8" fill="#228B22" opacity="0.6" />
            <ellipse cx="16" cy="40" rx="2" ry="6" fill="#32CD32" opacity="0.6" />
          </svg>
        )
      case "rock":
        return (
          <svg width="50" height="35" viewBox="0 0 50 35" className="drop-shadow-lg">
            <ellipse cx="25" cy="28" rx="22" ry="7" fill="#696969" />
            <path d="M5 28 Q8 15 15 12 Q25 8 35 12 Q42 15 45 28 Q40 25 35 24 Q25 22 15 24 Q10 25 5 28" fill="#808080" />
            <path d="M12 24 Q18 18 25 20 Q32 18 38 24 Q35 22 30 21 Q25 20 20 21 Q15 22 12 24" fill="#A9A9A9" />
            <circle cx="18" cy="20" r="2" fill="#778899" />
            <circle cx="32" cy="22" r="1.5" fill="#778899" />
          </svg>
        )
      case "castle":
        return (
          <svg width="60" height="70" viewBox="0 0 60 70" className="drop-shadow-lg">
            <rect x="10" y="40" width="40" height="30" fill="#D2B48C" />
            <rect x="5" y="30" width="15" height="40" fill="#DEB887" />
            <rect x="40" y="30" width="15" height="40" fill="#DEB887" />
            <rect x="22" y="20" width="16" height="50" fill="#F5DEB3" />
            <rect x="25" y="25" width="10" height="8" fill="#8B4513" />
            <polygon points="10,30 17,20 3,20" fill="#CD853F" />
            <polygon points="50,30 57,20 43,20" fill="#CD853F" />
            <polygon points="30,20 38,10 22,10" fill="#CD853F" />
            <rect x="15" y="45" width="4" height="8" fill="#4169E1" />
            <rect x="41" y="45" width="4" height="8" fill="#4169E1" />
            <rect x="28" y="35" width="4" height="6" fill="#4169E1" />
          </svg>
        )
      case "treasure":
        return (
          <svg width="45" height="35" viewBox="0 0 45 35" className="drop-shadow-lg">
            <ellipse cx="22" cy="28" rx="20" ry="7" fill="#8B4513" />
            <rect x="5" y="15" width="35" height="18" rx="3" fill="#DAA520" />
            <rect x="8" y="18" width="29" height="12" fill="#FFD700" />
            <circle cx="22" cy="24" r="3" fill="#B8860B" />
            <rect x="20" y="22" width="4" height="4" fill="#8B4513" />
            <path
              d="M12 20 Q15 18 18 20 Q21 18 24 20 Q27 18 30 20 Q33 18 36 20"
              stroke="#FFA500"
              strokeWidth="1"
              fill="none"
            />
            <circle cx="15" cy="25" r="1" fill="#FF6347" />
            <circle cx="29" cy="26" r="1" fill="#32CD32" />
            <circle cx="35" cy="23" r="1" fill="#4169E1" />
          </svg>
        )
      default:
        return getDecorationSVG("coral")
    }
  }

  const getDecorationPosition = (type: string, x: number, y: number) => {
    const floorTypes = ["rock", "castle", "treasure"]
    if (floorTypes.includes(type)) {
      // Floor decorations should be positioned on the sandy bottom (80% from top)
      return { x, y: Math.max(y, 80) }
    }
    // Floating decorations like coral and seaweed can be positioned anywhere
    return { x, y: Math.min(y, 75) } // But not too close to the top
  }

  const position = getDecorationPosition(decoration.type, decoration.x, decoration.y)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onMove) return

    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect()

    if (parentRect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !onMove) return

    const aquariumElement = document.querySelector(".absolute.inset-0.overflow-hidden")
    if (!aquariumElement) return

    const aquariumRect = aquariumElement.getBoundingClientRect()
    const newX = ((e.clientX - dragOffset.x - aquariumRect.left) / aquariumRect.width) * 100
    const newY = ((e.clientY - dragOffset.y - aquariumRect.top) / aquariumRect.height) * 100

    // Apply physics constraints
    const constrainedPosition = getDecorationPosition(
      decoration.type,
      Math.max(0, Math.min(95, newX)),
      Math.max(0, Math.min(95, newY)),
    )

    onMove(decoration.id, constrainedPosition.x, constrainedPosition.y)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  return (
    <div
      className={`absolute cursor-pointer transition-transform hover:scale-105 ${isDragging ? "scale-110 z-50" : "z-10"}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
      onMouseDown={handleMouseDown}
    >
      {getDecorationSVG(decoration.type)}
    </div>
  )
}
