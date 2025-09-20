"use client"

import { memo } from "react"

interface AutoFeederProps {
  isActive: boolean
  onToggle: () => void
}

export const AutoFeeder = memo(function AutoFeeder({ isActive, onToggle }: AutoFeederProps) {
  return (
    <div
      className="absolute top-[15%] right-[8%] cursor-pointer group"
      onClick={onToggle}
      title={isActive ? "Auto Feeder: ON (Click to turn off)" : "Auto Feeder: OFF (Click to turn on)"}
    >
      <div className={`relative transition-all duration-300 ${isActive ? "scale-110" : "scale-100"}`}>
        {/* Feeder base */}
        <div className="w-12 h-16 bg-gradient-to-b from-gray-300 to-gray-500 rounded-lg border-2 border-gray-600 shadow-lg">
          {/* Control panel */}
          <div className="w-8 h-3 bg-gray-800 rounded-sm mx-auto mt-1 flex items-center justify-center">
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
          </div>

          {/* Food dispenser */}
          <div className="w-6 h-8 bg-gradient-to-b from-orange-200 to-orange-400 rounded-sm mx-auto mt-1 border border-orange-500">
            {/* Food pellets visible inside */}
            <div className="flex flex-wrap gap-0.5 p-0.5">
              <div className="w-1 h-1 bg-orange-600 rounded-full" />
              <div className="w-1 h-1 bg-orange-700 rounded-full" />
              <div className="w-1 h-1 bg-orange-600 rounded-full" />
            </div>
          </div>

          {/* Dispensing tube */}
          <div className="w-2 h-4 bg-gray-400 mx-auto border-x border-gray-500" />
        </div>

        {/* Active feeding animation */}
        {isActive && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
            <div
              className="w-1 h-1 bg-orange-600 rounded-full animate-bounce absolute left-1"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="w-1 h-1 bg-orange-500 rounded-full animate-bounce absolute left-2"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        )}

        {/* Hover effect */}
        <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    </div>
  )
})
