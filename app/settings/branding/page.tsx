'use client'

import * as React from 'react'
import { AppShell } from '@/components/app-shell'
import { GlassPanel } from '@/components/ui/glass-panel'
import {
  ImageIcon,
  Plus,
  Sparkles,
  CheckCircle2,
  Layout,
  Download,
  Trash2,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function BrandingGalleryPage() {
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)
  const [prompt, setPrompt] = React.useState('')

  const fetchGallery = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile) return

    const { data } = await supabase
      .from('branding_gallery')
      .select('*')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })

    setItems(data || [])
    setLoading(false)
  }

  React.useEffect(() => {
    fetchGallery()
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    // Mocking AI generation
    setTimeout(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user?.id).single()

      const newItem = {
        org_id: profile?.org_id,
        image_url: `https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2071&auto=format&fit=crop`, // Placeholder
        prompt: prompt,
        type: 'LOGO',
        is_selected: false
      }

      await supabase.from('branding_gallery').insert(newItem)
      setPrompt('')
      setGenerating(false)
      fetchGallery()
    }, 2000)
  }

  const handleSelect = async (id: string, type: string) => {
    const supabase = createClient()
    // Deselect others of same type
    await supabase.from('branding_gallery').update({ is_selected: false }).eq('type', type)
    // Select this one
    await supabase.from('branding_gallery').update({ is_selected: true }).eq('id', id)
    fetchGallery()
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-slate-900">AI Branding Gallery</h1>
          <p className="text-slate-500">Generate and manage your AI-powered brand assets.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generator Panel */}
          <div className="lg:col-span-1">
            <GlassPanel className="p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blueprint" />
                Asset Generator
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your logo or mockup style..."
                    className="w-full h-32 p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blueprint/20 focus:border-blueprint outline-none resize-none"
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !prompt}
                  className="w-full h-12 bg-blueprint text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blueprint-700 transition-colors disabled:opacity-50"
                >
                  {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Generate Asset
                </button>
              </div>
            </GlassPanel>
          </div>

          {/* Gallery Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-2 py-20 flex flex-col items-center text-slate-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-2" />
                  <p>Loading your gallery...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="col-span-2 py-20 flex flex-col items-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                  <p>Your gallery is empty. Start by generating an asset!</p>
                </div>
              ) : (
                items.map((item) => (
                  <GlassPanel key={item.id} className={`overflow-hidden group transition-all ${item.is_selected ? 'ring-2 ring-blueprint' : ''}`}>
                    <div className="aspect-square relative bg-slate-100">
                      <img src={item.image_url} alt={item.prompt} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleSelect(item.id, item.type)}
                          className="p-2 bg-white text-blueprint rounded-lg hover:bg-blueprint hover:text-white transition-colors"
                          title="Select as primary"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button className="p-2 bg-white text-slate-600 rounded-lg hover:bg-slate-100 transition-colors" title="Download">
                          <Download className="w-5 h-5" />
                        </button>
                        <button className="p-2 bg-white text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      {item.is_selected && (
                        <div className="absolute top-2 right-2 bg-blueprint text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                          Active {item.type}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.type}</span>
                        <span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1 italic">"{item.prompt}"</p>
                    </div>
                  </GlassPanel>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
