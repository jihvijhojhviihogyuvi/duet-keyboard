import { ArrowDown, ArrowDownLeft, ArrowDownRight, ArrowUp, ArrowUpLeft, ArrowUpRight } from 'lucide-react'
import type { Direction } from '@/lib/duet-engine'

const icons = [ArrowUpLeft, ArrowUp, ArrowUpRight, ArrowDownRight, ArrowDown, ArrowDownLeft] as const

export function DirectionGlyph({ direction, className }: { direction: Direction; className?: string }) {
  const Icon = icons[direction]
  return <Icon className={className} aria-hidden="true" strokeWidth={1.6} />
}
