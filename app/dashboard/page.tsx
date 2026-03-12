import * as React from 'react'
import { CommandCenterShell } from '@/components/command-center-shell'
import { getWidgetsData } from '@/lib/actions/command-center'
import MorningBriefModal from '@/components/dashboard/morning-brief'
import DraggableDashboard from '@/components/dashboard/draggable-dashboard'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch Brief Data
  let brief = null
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const cookieStore = cookies()
    
    const res = await fetch(`${baseUrl}/api/brief`, {
      method: 'POST',
      headers: {
        Cookie: cookieStore.toString()
      },
      cache: 'no-store'
    })
    
    if (res.ok) {
        brief = await res.json()
    } else {
        // Handle non-200 responses
        console.warn(`Brief fetch failed with status: ${res.status}`)
        brief = {
            summary: "Jarvis initializing.",
            alerts: [],
            recommendations: [],
            // Modal Fallbacks
            userName: user.email?.split('@')[0] || "User",
            bookings: [],
            balance: 0,
            draftCount: 0,
            unreadCount: 0
        }
    }

  } catch (err) {
    console.warn("Brief fetch failed", err)
    brief = {
      summary: "Jarvis initializing.",
      alerts: [],
      recommendations: [],
      // Modal Fallbacks
      userName: user.email?.split('@')[0] || "User",
      bookings: [],
      balance: 0,
      draftCount: 0,
      unreadCount: 0
    }
  }

  // Fetch Dashboard Widgets Data
  let data = null
  try {
    data = await getWidgetsData()
  } catch (err) {
    console.error("Dashboard widgets fetch failed", err)
  }

  const safeData = data || {
    attention_needed: [],
    active_projects: [],
    live_projects: [],
    tte_schedule: [],
    urgent_tasks: [],
    financial_overview: { revenue: 0, expenses: 0, retention: 0 },
    service_status: []
  }

  return (
    <CommandCenterShell>
      <MorningBriefModal brief={brief} />
      <DraggableDashboard data={safeData} />
    </CommandCenterShell>
  )
}
