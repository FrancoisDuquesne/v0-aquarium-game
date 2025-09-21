"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { AutoFeeder } from "./auto-feeder"
import { FishControlled } from "./fish-controlled"
import { BubblesLayer } from "./bubbles-layer"
import { FlakeSVG } from "./flake-svg"
import { FISH_CONFIG } from "@/lib/fish-config"
import { generateWaypoint } from "@/lib/movement"

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
  feedingFish?: number | null
  autoFeeder: AutoFeederData
  onToggleAutoFeeder?: () => void
  onFishFed: (fishId: number, amount: number) => void
  selectedTool?: 'flake' | 'spoon'
}

export function AquariumDisplay({ fish, feedingFish, autoFeeder, onToggleAutoFeeder, onFishFed, selectedTool = 'flake' }: AquariumDisplayProps) {
  const safeFish = Array.isArray(fish) ? fish : []

  // Refs for imperative animation state
  const containerRef = useRef<HTMLDivElement | null>(null)
  const fishRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const positionsRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const velocitiesRef = useRef<Map<number, { vx: number; vy: number }>>(new Map())
  const fishMetaRef = useRef<Map<number, { hunger: number; type: string }>>(new Map())
  const softTargetRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const targetsRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const nextWaypointAtRef = useRef<Map<number, number>>(new Map())
  const facingRef = useRef<Map<number, 1 | -1>>(new Map())
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number>(performance.now())
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })

  // Food flakes
  type Flake = { id: number; x: number; y: number; state: "sinking" | "resting"; createdAt: number; restStart?: number }
  const [flakeIds, setFlakeIds] = useState<number[]>([])
  const flakeRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const flakesRef = useRef<Map<number, Flake>>(new Map())

  // Food behavior params
  const FLOOR_Y = 96
  const SINK_SPEED_PER_S = 6
  const REST_DURATION_MS = 5000
  const DETECT_RADIUS = 12
  const EAT_RADIUS = 3
  const FEED_AMOUNT = 20

  // Maintain fish maps on list changes
  useEffect(() => {
    const now = performance.now()
    const ids = new Set<number>()
    safeFish.forEach((f) => {
      ids.add(f.id)
      fishMetaRef.current.set(f.id, { hunger: f.hunger, type: f.type })
      if (!positionsRef.current.has(f.id)) {
        positionsRef.current.set(f.id, { x: f.x, y: f.y })
      }
      if (!velocitiesRef.current.has(f.id)) {
        const ang = Math.random() * Math.PI * 2
        velocitiesRef.current.set(f.id, { vx: Math.cos(ang) * 3, vy: Math.sin(ang) * 3 })
      }
      if (!targetsRef.current.has(f.id)) {
        targetsRef.current.set(f.id, { x: f.x, y: f.y })
      }
      if (!softTargetRef.current.has(f.id)) {
        softTargetRef.current.set(f.id, { x: f.x, y: f.y })
      }
      if (!nextWaypointAtRef.current.has(f.id)) {
        const delay = Math.random() * (FISH_CONFIG.WAYPOINT_MAX_INTERVAL - FISH_CONFIG.WAYPOINT_MIN_INTERVAL) +
          FISH_CONFIG.WAYPOINT_MIN_INTERVAL
        nextWaypointAtRef.current.set(f.id, now + delay)
      }
      if (!facingRef.current.has(f.id)) facingRef.current.set(f.id, 1)
    })

    // Cleanup removed fish
    Array.from(positionsRef.current.keys()).forEach((id) => {
      if (!ids.has(id)) {
        positionsRef.current.delete(id)
        velocitiesRef.current.delete(id)
        targetsRef.current.delete(id)
        softTargetRef.current.delete(id)
        nextWaypointAtRef.current.delete(id)
        facingRef.current.delete(id)
        fishRefs.current.delete(id)
        fishMetaRef.current.delete(id)
      }
    })
  }, [safeFish])

  // Observe container size for correct pixel transforms
  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const update = () => {
      const rect = el.getBoundingClientRect()
      sizeRef.current = { w: rect.width, h: rect.height }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pctToPx = (xPct: number, yPct: number) => {
    const { w, h } = sizeRef.current
    return { x: (xPct / 100) * w, y: (yPct / 100) * h }
  }

  const setNodeTransform = (node: HTMLElement, xPct: number, yPct: number, face: 1 | -1) => {
    const { x, y } = pctToPx(xPct, yPct)
    node.style.transform = `translate3d(${x}px, ${y}px, 0) scaleX(${face})`
  }

  // Single RAF loop controlling movement
  useEffect(() => {
    const tick = (ts: number) => {
      const dt = ts - lastTsRef.current
      lastTsRef.current = ts
      const now = ts

      const dtSec = Math.max(0.001, dt / 1000)

      // Update flakes positions and lifespan
      const toRemove: number[] = []
      flakesRef.current.forEach((flake, id) => {
        if (flake.state === "sinking") {
          flake.y = Math.min(FLOOR_Y, flake.y + (SINK_SPEED_PER_S * dt) / 1000)
          if (flake.y >= FLOOR_Y) {
            flake.state = "resting"
            flake.restStart = now
          }
        } else if (flake.state === "resting") {
          if (flake.restStart && now - flake.restStart >= REST_DURATION_MS) {
            toRemove.push(id)
          }
        }
        const el = flakeRefs.current.get(id)
        if (el) {
          const { x, y } = pctToPx(flake.x, flake.y)
          el.style.transform = `translate3d(${x}px, ${y}px, 0)`
        }
      })
      if (toRemove.length) {
        toRemove.forEach((id) => {
          flakesRef.current.delete(id)
          flakeRefs.current.delete(id)
        })
        setFlakeIds((ids) => ids.filter((fid) => !toRemove.includes(fid)))
      }

      positionsRef.current.forEach((pos, id) => {
        // Schedule waypoint when due
        const dueAt = nextWaypointAtRef.current.get(id) || now
        if (now >= dueAt) {
          const next = generateWaypoint(pos.x, pos.y, FISH_CONFIG.LEVY_MU)
          targetsRef.current.set(id, next)
          const delay = Math.random() * (FISH_CONFIG.WAYPOINT_MAX_INTERVAL - FISH_CONFIG.WAYPOINT_MIN_INTERVAL) +
            FISH_CONFIG.WAYPOINT_MIN_INTERVAL
          nextWaypointAtRef.current.set(id, now + delay)
          // Update facing based on direction
          const dir = next.x > pos.x ? 1 : -1
          facingRef.current.set(id, dir as 1 | -1)
        }

        // Base desired vector towards current waypoint target
        let target = targetsRef.current.get(id) || pos
        let desiredX = target.x - pos.x
        let desiredY = target.y - pos.y

        // Flake attraction (only if hungry)
        const meta = fishMetaRef.current.get(id)
        const isHungry = !meta || meta.hunger < 100
        let nearest: Flake | null = null
        let nearestDist = Infinity
        if (isHungry && flakesRef.current.size) {
          flakesRef.current.forEach((flake) => {
            const dx = flake.x - pos.x
            const dy = flake.y - pos.y
            const d = Math.hypot(dx, dy)
            if (d < nearestDist) {
              nearestDist = d
              nearest = flake
            }
          })
        }
        if (nearest && nearestDist <= DETECT_RADIUS) {
          desiredX = nearest.x - pos.x
          desiredY = nearest.y - pos.y
          targetsRef.current.set(id, { x: nearest.x, y: nearest.y })
          if (nearestDist <= EAT_RADIUS) {
            if (typeof onFishFed === 'function') onFishFed(id, FEED_AMOUNT)
            flakesRef.current.delete(nearest.id)
            flakeRefs.current.delete(nearest.id)
            setFlakeIds((ids) => ids.filter((fid) => fid !== nearest!.id))
          }
        }

        // Schooling: cohesion, separation, alignment with same species
        if (meta?.type) {
          let cx = 0, cy = 0, count = 0
          let sepX = 0, sepY = 0
          let alignX = 0, alignY = 0
          positionsRef.current.forEach((npos, nid) => {
            if (nid === id) return
            const nmeta = fishMetaRef.current.get(nid)
            if (!nmeta || nmeta.type !== meta.type) return
            const dx = npos.x - pos.x
            const dy = npos.y - pos.y
            const dist = Math.hypot(dx, dy)
            if (dist < 28) {
              cx += npos.x
              cy += npos.y
              const nv = velocitiesRef.current.get(nid)
              if (nv) { alignX += nv.vx; alignY += nv.vy }
              count++
            }
            if (dist > 0 && dist < 5) {
              sepX -= dx / dist
              sepY -= dy / dist
            }
          })
          if (count > 0) {
            cx /= count; cy /= count; alignX /= count; alignY /= count
            desiredX = 0.9 * desiredX + 0.25 * (cx - pos.x) + 0.25 * sepX + 0.15 * alignX
            desiredY = 0.9 * desiredY + 0.25 * (cy - pos.y) + 0.25 * sepY + 0.15 * alignY
          }
        }

        // Convert desired vector to a goal point and smooth it (low-pass filter)
        const goalX = pos.x + desiredX
        const goalY = pos.y + desiredY
        const soft = softTargetRef.current.get(id) || { x: pos.x, y: pos.y }
        const tau = 0.4
        const alpha = 1 - Math.exp(-dtSec / tau)
        const softX = soft.x + (goalX - soft.x) * alpha
        const softY = soft.y + (goalY - soft.y) * alpha
        softTargetRef.current.set(id, { x: softX, y: softY })

        // Steering update
        const vel = velocitiesRef.current.get(id) || { vx: 0, vy: 0 }
        const dx = softX - pos.x
        const dy = softY - pos.y
        const dLen = Math.hypot(dx, dy) || 1
        const maxSpeed = 14
        const slowRadius = 8
        const desiredSpeed = Math.min(maxSpeed, maxSpeed * (dLen / slowRadius))
        const desiredVx = (dx / dLen) * desiredSpeed
        const desiredVy = (dy / dLen) * desiredSpeed
        let steerX = desiredVx - vel.vx
        let steerY = desiredVy - vel.vy
        const steerLen = Math.hypot(steerX, steerY)
        const maxSteer = 50 * dtSec
        if (steerLen > maxSteer) {
          steerX = (steerX / steerLen) * maxSteer
          steerY = (steerY / steerLen) * maxSteer
        }
        vel.vx += steerX
        vel.vy += steerY
        const vLen = Math.hypot(vel.vx, vel.vy)
        if (vLen > maxSpeed) { vel.vx = (vel.vx / vLen) * maxSpeed; vel.vy = (vel.vy / vLen) * maxSpeed }

        pos.x += vel.vx * dtSec
        pos.y += vel.vy * dtSec
        pos.x = Math.max(FISH_CONFIG.BOUNDARY_LEFT, Math.min(FISH_CONFIG.BOUNDARY_RIGHT, pos.x))
        pos.y = Math.max(FISH_CONFIG.BOUNDARY_TOP, Math.min(FISH_CONFIG.BOUNDARY_BOTTOM, pos.y))
        velocitiesRef.current.set(id, vel)

        const node = fishRefs.current.get(id)
        if (node) {
          const face = vel.vx >= 0 ? 1 : -1
          const prev = facingRef.current.get(id) || 1
          if (face !== prev) {
            const inner = node.querySelector('.fish-inner') as HTMLElement | null
            if (inner) {
              inner.classList.remove('flip-once'); void inner.offsetWidth; inner.classList.add('flip-once')
              setTimeout(() => inner.classList.remove('flip-once'), 180)
            }
          }
          facingRef.current.set(id, face as 1 | -1)
          setNodeTransform(node, pos.x, pos.y, face as 1 | -1)
        }
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const setFishRef = useCallback((id: number) => (el: HTMLDivElement | null) => {
    if (el) {
      fishRefs.current.set(id, el)
      // Initialize transform based on current position
      const pos = positionsRef.current.get(id)
      const face = facingRef.current.get(id) || 1
      if (pos) setNodeTransform(el, pos.x, pos.y, face)
    } else {
      fishRefs.current.delete(id)
    }
  }, [])

  // Add food flake on click
  const MAX_FLAKES = 60

  const addFlakeAt = (clientX: number, clientY: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const xPct = ((clientX - rect.left) / rect.width) * 100
    const yPct = ((clientY - rect.top) / rect.height) * 100
    const id = Date.now() + Math.random()
    const flake: Flake = { id, x: Math.max(0, Math.min(100, xPct)), y: Math.max(0, Math.min(100, yPct)), state: "sinking", createdAt: performance.now() }
    flakesRef.current.set(id, flake)
    setFlakeIds((ids) => {
      const next = [...ids, id]
      if (next.length > MAX_FLAKES) {
        const removeCount = next.length - MAX_FLAKES
        const toRemove = next.slice(0, removeCount)
        toRemove.forEach((rid) => {
          flakesRef.current.delete(rid)
          flakeRefs.current.delete(rid)
        })
        return next.slice(removeCount)
      }
      return next
    })
  }

  const onContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === 'spoon') {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = e.clientX
      const cy = e.clientY
      // Drop a handful of flakes in a small area
      const count = 8
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const r = Math.random() * 24 // px radius spread
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r
        addFlakeAt(x, y)
      }
    } else {
      addFlakeAt(e.clientX, e.clientY)
    }
  }, [selectedTool])

  const setFlakeRef = useCallback((id: number) => (el: HTMLDivElement | null) => {
    if (el) {
      flakeRefs.current.set(id, el)
      const flake = flakesRef.current.get(id)
      if (flake) {
        const { x, y } = pctToPx(flake.x, flake.y)
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }
    } else {
      flakeRefs.current.delete(id)
    }
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" onClick={onContainerClick}>
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/coral-reef-bg-2.webp')" }} />

      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 via-transparent to-cyan-100/10" />

      {/* Fish (imperative movement via RAF; event delegation for clicks) */}
      {safeFish.map((f) => (
        <FishControlled
          key={f.id}
          fishId={f.id}
          type={f.type}
          hunger={f.hunger}
          isBeingFed={feedingFish === f.id}
          ref={setFishRef(f.id)}
        />
      ))}

      {autoFeeder?.owned && onToggleAutoFeeder && (
        <AutoFeeder isActive={autoFeeder.active} onToggle={onToggleAutoFeeder} />
      )}

      {/* Food flakes */}
      {flakeIds.map((id) => (
        <div key={id} ref={setFlakeRef(id)} className="absolute pointer-events-none" style={{ willChange: "transform", zIndex: 5 }}>
          <FlakeSVG width={16} height={12} />
        </div>
      ))}

      {/* Bubbles */}
      <BubblesLayer />

      <div
        className="absolute inset-0 bg-gradient-to-br from-cyan-100/3 via-transparent to-blue-100/3 pointer-events-none animate-pulse"
        style={{ animationDuration: "4s" }}
      />
    </div>
  )
}
