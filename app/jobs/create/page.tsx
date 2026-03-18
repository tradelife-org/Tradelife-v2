import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SceneLayerV3 from "@/visual-engine/scene/SceneLayerV3"
import { GlassPanel } from '@/components/ui/glass-panel'

export default async function CreateJobPage() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()

  // Fetch clients for dropdown
  const { data: clients } = await supabase.from('clients').select('id, name').eq('org_id', profile?.org_id).order('name')

  async function createJob(formData: FormData) {
    'use server'
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
    if (!profile) throw new Error('Profile not found')

    const title = formData.get('title') as string
    const clientId = formData.get('clientId') as string

    const { data: job, error } = await supabase.from('jobs').insert({
      org_id: profile.org_id,
      title,
      client_id: clientId || null,
      status: 'ENQUIRY'
    }).select().single()

    if (error) throw new Error(error.message)

    redirect(`/jobs/${job.id}`)
  }

  return (
    <SceneLayerV3 scene="remembrance">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <GlassPanel className="p-8 bg-white border-slate-200">
          <h1 className="text-2xl font-heading font-bold text-slate-900 mb-6">Create New Job</h1>
          
          <form action={createJob} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Job Title</label>
              <input 
                name="title" 
                required 
                placeholder="e.g. Boiler Repair"
                className="w-full h-12 px-4 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blueprint"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Client (Optional)</label>
              <select 
                name="clientId"
                className="w-full h-12 px-4 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blueprint"
              >
                <option value="">No Client (Internal/Lead)</option>
                {clients?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full h-12 bg-blueprint text-white font-bold rounded-xl hover:bg-blueprint-700 transition-colors shadow-lg"
            >
              Create Job
            </button>
          </form>
        </GlassPanel>
      </div>
    </SceneLayerV3>
  )
}
