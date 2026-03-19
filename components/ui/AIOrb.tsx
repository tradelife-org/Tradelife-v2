'use client'

import { useUIStore } from '@/store/useUIStore'

interface AIOrbProps {
  size?: 'sm' | 'md' | 'lg'
  clickable?: boolean
  'data-testid'?: string
}

const sizes = {
  sm: 'w-10 h-10',
  md: 'w-28 h-28 sm:w-40 sm:h-40',
  lg: 'w-36 h-36 sm:w-48 sm:h-48 lg:w-52 lg:h-52',
}

export function AIOrb({ size = 'md', clickable = true, 'data-testid': testId }: AIOrbProps) {
  const setAiCoreOpen = useUIStore((s) => s.setAiCoreOpen)

  const Tag = clickable ? 'button' : 'div'

  return (
    <Tag
      data-testid={testId || 'ai-orb'}
      onClick={clickable ? () => setAiCoreOpen(true) : undefined}
      className={`${sizes[size]} rounded-full relative ai-orb ${clickable ? 'cursor-pointer' : ''}`}
    >
      {/* Core — bright center */}
      <div className="absolute inset-[15%] rounded-full bg-[radial-gradient(circle_at_45%_40%,rgba(59,130,246,0.6),rgba(59,130,246,0.25)_50%,rgba(59,130,246,0.08)_75%,transparent_100%)]" />
      {/* Mid glow */}
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),rgba(59,130,246,0.04)_60%,transparent_100%)]" />
      {/* Outer halo */}
      <div className="absolute -inset-3 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.06),transparent_70%)]" />
    </Tag>
  )
}
