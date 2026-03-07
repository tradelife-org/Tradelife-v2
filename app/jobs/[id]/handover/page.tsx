'use client'

import * as React from 'react'
import { AppShell } from '@/components/app-shell'
import { GlassPanel } from '@/components/ui/glass-panel'
import {
  FileText,
  CheckCircle2,
  Download,
  ShieldCheck,
  Building2,
  Users
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function HandoverPackPage({ params }: { params: { id: string } }) {
  const [mockup, setMockup] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchMockup = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
      if (!profile) return

      const { data } = await supabase
        .from('branding_gallery')
        .select('image_url')
        .eq('org_id', profile.org_id)
        .eq('type', 'MOCKUP')
        .eq('is_selected', true)
        .single()

      setMockup(data)
      setLoading(false)
    }
    fetchMockup()
  }, [])

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-900">Handover Pack</h1>
            <p className="text-slate-500">Project completion documentation and brand assets.</p>
          </div>
          <button className="flex items-center gap-2 bg-blueprint text-white px-4 py-2 rounded-xl font-bold hover:bg-blueprint-700 transition-colors">
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        </header>

        {mockup && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-xl border border-slate-200 relative aspect-[21/9]">
            <img src={mockup.image_url} alt="Brand Mockup" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center p-12">
              <div className="max-w-md">
                <h2 className="text-3xl font-heading font-black text-white mb-2">Project Completed</h2>
                <p className="text-white/80">Thank you for choosing us for your project. Here is your complete handover documentation.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassPanel className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blueprint" />
              Documentation
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-between text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                <span className="flex items-center gap-2 text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Completion Certificate
                </span>
                <Download className="w-4 h-4 text-slate-400" />
              </li>
              <li className="flex items-center justify-between text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                <span className="flex items-center gap-2 text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Building Regs Approval
                </span>
                <Download className="w-4 h-4 text-slate-400" />
              </li>
              <li className="flex items-center justify-between text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                <span className="flex items-center gap-2 text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Electrical Safety Certificate
                </span>
                <Download className="w-4 h-4 text-slate-400" />
              </li>
            </ul>
          </GlassPanel>

          <GlassPanel className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blueprint" />
              Warranties
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-between text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                <span className="flex items-center gap-2 text-slate-600">
                  Structural Warranty (10 Year)
                </span>
                <Download className="w-4 h-4 text-slate-400" />
              </li>
              <li className="flex items-center justify-between text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                <span className="flex items-center gap-2 text-slate-600">
                  Workmanship Guarantee
                </span>
                <Download className="w-4 h-4 text-slate-400" />
              </li>
            </ul>
          </GlassPanel>
        </div>
      </div>
    </AppShell>
  )
}
