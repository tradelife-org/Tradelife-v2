import { createClient } from "@/lib/supabase/server"
import { getMorningBriefData } from "@/lib/actions/brief"

export async function POST() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    // The original logic was calling getMorningBriefData()
    // We keep it, but wrapped in try/catch as requested
    const data = await getMorningBriefData()
    
    // Ensure the response structure matches what the dashboard expects
    // getMorningBriefData returns { userName, bookings, balance, draftCount, unreadCount }
    // The prompt's fallback suggests: { summary, alerts, recommendations }
    // This is a discrepancy. The prompt's fallback structure is different from the actual data structure.
    // However, the prompt says "Wrap logic in try/catch... return Response.json(data)".
    // If I use the existing getMorningBriefData, I should return its result.
    // If it fails, I return the prompt's fallback structure?
    // Or maybe I should return a fallback that matches the EXPECTED structure.
    // The MorningBriefModal expects { userName, bookings, balance, ... }.
    // If I return { summary, alerts ... } it might break the modal.
    // I will return a fallback that attempts to match the modal's expectation + the prompt's fallback fields to be safe.
    
    return Response.json(data)

  } catch (err) {
    console.error("Jarvis brief error:", err)

    // Fallback matching both potential expectations
    return Response.json({
      // Prompt suggested fields
      summary: "Jarvis is warming up.",
      alerts: [],
      recommendations: [],
      
      // Modal expected fields (to prevent crash)
      userName: "User",
      bookings: [],
      balance: 0,
      draftCount: 0,
      unreadCount: 0
    })
  }
}
