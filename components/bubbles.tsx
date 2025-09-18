interface Bubble {
  id: number
  x: number
  delay: number
}

interface BubblesProps {
  bubbles: Bubble[]
}

export function Bubbles({ bubbles }: BubblesProps) {
  return (
    <>
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute w-2 h-2 bg-white/30 rounded-full bubble-animation"
          style={{
            left: `${bubble.x}%`,
            animationDelay: `${bubble.delay}s`,
            animationDuration: "8s",
            zIndex: 1,
          }}
        />
      ))}
    </>
  )
}
