'use client'

import { usePathname } from 'next/navigation'
import Image from 'next/image'

export function CinematicBackground() {
  const pathname = usePathname()

  const isDashboard = pathname?.startsWith('/dashboard')

  return (
    <>
      {/* Fixed full-screen background image */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/login-bg.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
          data-testid="cinematic-background-image"
        />
      </div>

      {/* Dark radial overlay — slightly darker on dashboard for readability */}
      <div
        className="fixed inset-0 z-[1]"
        style={{
          background: isDashboard
            ? 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0.9) 100%)'
            : 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.82) 100%)',
        }}
        data-testid="cinematic-overlay"
      />
    </>
  )
}
