'use server'

export async function getWidgetsData() {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'
  try {
    // Note: ensure backendUrl doesn't have trailing slash if path adds one, or handle strictly.
    // The prompt says REACT_APP_BACKEND_URL is the base URL.
    const res = await fetch(`${backendUrl}/api/widgets`, {
      cache: 'no-store'
    })
    
    if (!res.ok) {
        console.error('Failed to fetch widgets:', res.status, res.statusText)
        throw new Error(`Backend error: ${res.status}`)
    }
    
    return await res.json()
  } catch (error) {
    console.error('Error in getWidgetsData:', error)
    // Return empty structure on error to prevent UI crash
    return {
      attention_needed: [],
      active_projects: [],
      live_projects: [],
      tte_schedule: [],
      urgent_tasks: [],
      financial_overview: { revenue: 0, expenses: 0, retention: 0 }
    }
  }
}

export async function getDailyBriefAction() {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'
  try {
    const res = await fetch(`${backendUrl}/api/daily-brief`, {
      method: 'POST',
      cache: 'no-store'
    })
    
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    
    return await res.json()
  } catch (error) {
    console.error('Error in getDailyBriefAction:', error)
    throw error
  }
}
