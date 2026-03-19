'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LeftStack } from '@/components/dashboard/LeftStack'
import { CenterCore } from '@/components/dashboard/CenterCore'
import { RightStack } from '@/components/dashboard/RightStack'
import { AICoreOverlay } from '@/components/dashboard/AICoreOverlay'
import { MobileAIHero } from '@/components/dashboard/MobileAIHero'
import { MobileContentStack } from '@/components/dashboard/MobileContentStack'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* Mobile: AI-first experience */}
      <MobileAIHero />
      <MobileContentStack />

      {/* Desktop: full 3-column grid */}
      <LeftStack />
      <CenterCore />
      <RightStack />

      <AICoreOverlay />
    </DashboardLayout>
  )
}
