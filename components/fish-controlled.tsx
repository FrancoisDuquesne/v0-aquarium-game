"use client"

import { memo, forwardRef } from "react"
import { FISH_CONFIG } from "@/lib/fish-config"
import { FishSVG } from "@/components/fish-svg"

interface FishControlledProps {
  fishId: number
  type: string
  hunger: number
  isBeingFed?: boolean
}

export const FishControlled = memo(
  forwardRef<HTMLDivElement, FishControlledProps>(function FishControlled({ fishId, type, hunger, isBeingFed }, ref) {
    const size = FISH_CONFIG.FISH_SIZES[type as keyof typeof FISH_CONFIG.FISH_SIZES] || FISH_CONFIG.FISH_SIZES.goldfish

    const getHungerColor = (hunger: number) => {
      if (hunger > 70) return "text-green-400"
      if (hunger > 40) return "text-yellow-400"
      return "text-red-400"
    }

    return (
      <div
        ref={ref}
        data-fishid={fishId}
        className={`absolute cursor-pointer ${isBeingFed ? "" : ""}`}
        style={{ left: 0, top: 0, zIndex: 10, willChange: "transform", transformOrigin: "center" }}
      >
        <div className="fish-inner relative float-animation transition-transform duration-200 hover:scale-110">
          {isBeingFed && <div className="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping scale-150" />}

          <FishSVG type={type} width={size.width} height={size.height} facingRight={true} className="drop-shadow-lg" />

          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white/50">
            <div className={`w-full h-full rounded-full ${getHungerColor(hunger)}`} style={{ opacity: hunger / 100 }} />
          </div>

          {(hunger > 95 || isBeingFed) && (
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-green-400 animate-bounce">
              {isBeingFed ? "🍽️" : "❤️"}
            </div>
          )}
        </div>
      </div>
    )
  }),
)
