import { getPortalContext } from '@/lib/actions/portal'
import PortalMessaging from '@/components/portal/messaging'
import PortalTimeline from '@/components/portal/timeline'
import { GlassPanel } from '@/components/ui/glass-panel'
import { notFound } from 'next/navigation'

export default async function PortalPage({ params }: { params: { token: string } }) {
  let context
  try {
    context = await getPortalContext(params.token)
  } catch (err) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <GlassPanel className="p-8 text-center max-w-md bg-white/80">
          <h1 className="text-xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-slate-600">This portal link is invalid or has expired. Please request a new one.</p>
        </GlassPanel>
      </div>
    )
  }

  const { client, org, quotes, jobs } = context

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1651573652576-5d407dbe48d1?q=80&w=2832&auto=format&fit=crop')] bg-cover bg-fixed bg-center">
      <div className="min-h-screen bg-slate-900/10 backdrop-blur-sm overflow-y-auto">
        
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-white/10 backdrop-blur-xl shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-black text-white drop-shadow-md">
                {org?.name || 'TradeLife Portal'}
              </h1>
              <p className="text-xs text-white/80 font-medium">Client Portal</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white drop-shadow-sm">Hi, {client?.name?.split(' ')[0] || 'Guest'}</p>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Project Status (Timeline + Scope) */}
            <div className="lg:col-span-7 space-y-8">
              {/* Welcome Card */}
              <GlassPanel className="p-8 bg-gradient-to-br from-blueprint-900/90 to-slate-900/90 text-white border-white/20">
                <h2 className="text-2xl font-heading font-bold mb-2">Project Overview</h2>
                <p className="text-white/80 leading-relaxed">
                  Welcome to your dedicated project hub. Here you can track progress, view quotes, approve variations, and chat directly with the team.
                </p>
              </GlassPanel>

              <PortalTimeline quotes={quotes || []} jobs={jobs || []} />
            </div>

            {/* Right: Communication */}
            <div className="lg:col-span-5">
              <div className="sticky top-28">
                <PortalMessaging token={params.token} />
              </div>
            </div>

          </div>
        </main>

      </div>
    </div>
  )
}
