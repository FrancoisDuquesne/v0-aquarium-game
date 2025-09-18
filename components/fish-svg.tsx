import type React from "react"
interface FishSVGProps {
  type: string
  width?: number
  height?: number
  facingRight?: boolean
  className?: string
}

export function FishSVG({ type, width, height, facingRight = true, className = "drop-shadow-lg" }: FishSVGProps) {
  const getBaseSVG = (type: string, viewBox: string, content: React.ReactNode) => (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      className={className}
      style={{ transform: `scaleX(${facingRight ? 1 : -1})` }}
    >
      {content}
    </svg>
  )

  switch (type) {
    case "goldfish":
      return getBaseSVG(
        "goldfish",
        "0 0 40 28",
        <>
          <ellipse cx="25" cy="14" rx="15" ry="8" fill="#FF8C00" />
          <ellipse cx="28" cy="14" rx="8" ry="5" fill="#FFB347" />
          <path d="M10 14 L2 8 L8 14 L2 20 Z" fill="#FF6B35" />
          <circle cx="32" cy="11" r="2" fill="#000" />
          <path d="M25 6 L20 2 L22 8 Z" fill="#FF6B35" />
          <path d="M25 22 L20 26 L22 20 Z" fill="#FF6B35" />
        </>,
      )

    case "angelfish":
      return getBaseSVG(
        "angelfish",
        "0 0 60 60",
        <>
          {/* Body (inverted y-axis) */}
          <path
            d="M20 45 
              Q45 50 45 30 
              Q45 10 20 15 
              Q30 30 20 45 Z"
            fill="#C0C0C0"
          />

          {/* Dorsal fin (inverted - now at bottom) */}
          <path d="M28 45 L24 55 L38 44 Z" fill="#A0A0A0" />

          {/* Anal fin (inverted - now at top) */}
          <path d="M28 14 L24 2 L38 16 Z" fill="#A0A0A0" />

          {/* Tail fin (connected to body at left side) */}
          <path d="M25 30 L12 20 L12 40 Z" fill="#A0A0A0" />

          {/* Stripes (adjusted for inverted body) */}
          <path d="M28 42 L28 18" stroke="#505050" strokeWidth="2" opacity="0.6" />
          <path d="M34 44 L34 16" stroke="#505050" strokeWidth="2" opacity="0.6" />
          <path d="M40 40 L40 20" stroke="#505050" strokeWidth="2" opacity="0.6" />

          {/* Eye (moved closer to body) */}
          <circle cx="40" cy="26" r="2" fill="#000" />
        </>,
      );

    case "neon":
      return getBaseSVG(
        "neon",
        "0 0 25 18",
        <>
          <ellipse cx="15" cy="9" rx="10" ry="5" fill="#00CED1" />
          <path d="M5 9 L1 6 L3 9 L1 12 Z" fill="#20B2AA" />
          <circle cx="20" cy="7" r="1" fill="#000" />
          <path d="M15 4 L15 14" stroke="#FF1493" strokeWidth="2" />
        </>,
      )

    case "tropical":
      return getBaseSVG(
        "tropical",
        "0 0 38 25",
        <>
          <ellipse cx="22" cy="12" rx="14" ry="7" fill="#FFD700" />
          <path d="M8 12 L2 8 L6 12 L2 16 Z" fill="#FFA500" />
          <circle cx="28" cy="9" r="1.5" fill="#000" />
          <path d="M22 5 L18 2 L20 7 Z" fill="#FF8C00" />
          <path d="M22 19 L18 22 L20 17 Z" fill="#FF8C00" />
          <path d="M15 8 L25 8" stroke="#FF4500" strokeWidth="1" />
          <path d="M15 16 L25 16" stroke="#FF4500" strokeWidth="1" />
        </>,
      )

    case "shark":
      return getBaseSVG(
        "shark",
        "0 0 55 30",
        <>
          <ellipse cx="30" cy="15" rx="20" ry="8" fill="#708090" />
          <path d="M10 15 L2 12 L8 15 L2 18 Z" fill="#696969" />
          <circle cx="42" cy="12" r="2" fill="#000" />
          <path d="M30 7 L25 2 L28 9 Z" fill="#696969" />
          <path d="M35 23 L30 28 L33 21 Z" fill="#696969" />
          <path d="M45 12 L48 8 L50 15 L48 18 Z" fill="#A9A9A9" />
        </>,
      )

    default:
      return <FishSVG type="goldfish" width={width} height={height} facingRight={facingRight} className={className} />
  }
}
