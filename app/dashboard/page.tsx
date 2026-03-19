'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LeftStack } from '@/components/dashboard/LeftStack'
import { CenterCore } from '@/components/dashboard/CenterCore'
import { RightStack } from '@/components/dashboard/RightStack'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <LeftStack />
      <CenterCore />
      <RightStack />
    </DashboardLayout>
  )
}
