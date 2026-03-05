'use client'

import { useState } from 'react'
import { createVisitAction } from '@/lib/actions/calendar'
import { GlassPanel } from '@/components/ui/glass-panel'
import { Calendar, Clock, Users, X } from 'lucide-react'

interface VisitFormProps {
  jobs: any[]
  staff: any[]
  onClose: () => void
}

export default function VisitForm({ jobs, staff, onClose }: VisitFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    jobId: '',
    title: '',
    visitType: 'SITE_VISIT',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    clientVisible: true,
    assignedUserIds: [] as string[]
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.jobId) return alert('Select a job')
    
    setLoading(true)
    try {
      const start = new Date(`${formData.date}T${formData.startTime}:00`).toISOString()
      const end = new Date(`${formData.date}T${formData.endTime}:00`).toISOString()

      await createVisitAction({
        jobId: formData.jobId,
        title: formData.title || 'Site Visit',
        visitType: formData.visitType,
        startTime: start,
        endTime: end,
        clientVisible: formData.clientVisible,
        assignedUserIds: formData.assignedUserIds
      })
      onClose()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <GlassPanel className="w-full max-w-lg bg-white p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-heading font-bold mb-6 text-slate-900">Schedule Visit</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job</label>
            <select 
              required
              className="w-full h-10 px-3 border rounded-lg bg-slate-50"
              value={formData.jobId}
              onChange={e => setFormData({...formData, jobId: e.target.value})}
            >
              <option value="">Select Job...</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title} ({j.clients?.name})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
            <input 
              className="w-full h-10 px-3 border rounded-lg"
              placeholder="e.g. Initial Inspection"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
              <input 
                type="date" required
                className="w-full h-10 px-3 border rounded-lg"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
              <select 
                className="w-full h-10 px-3 border rounded-lg"
                value={formData.visitType}
                onChange={e => setFormData({...formData, visitType: e.target.value})}
              >
                <option value="SITE_VISIT">Site Visit</option>
                <option value="INSTALL">Installation</option>
                <option value="SNAGGING">Snagging</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start</label>
              <input 
                type="time" required
                className="w-full h-10 px-3 border rounded-lg"
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End</label>
              <input 
                type="time" required
                className="w-full h-10 px-3 border rounded-lg"
                value={formData.endTime}
                onChange={e => setFormData({...formData, endTime: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Staff</label>
            <div className="flex flex-wrap gap-2">
              {staff.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    const exists = formData.assignedUserIds.includes(s.id)
                    setFormData(prev => ({
                      ...prev,
                      assignedUserIds: exists 
                        ? prev.assignedUserIds.filter(id => id !== s.id)
                        : [...prev.assignedUserIds, s.id]
                    }))
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                    ${formData.assignedUserIds.includes(s.id) 
                      ? 'bg-blueprint text-white border-blueprint' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blueprint'}`}
                >
                  {s.full_name || s.email}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="visible"
              checked={formData.clientVisible}
              onChange={e => setFormData({...formData, clientVisible: e.target.checked})}
              className="rounded border-slate-300 text-blueprint focus:ring-blueprint"
            />
            <label htmlFor="visible" className="text-sm text-slate-600">Visible on Client Portal</label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-blueprint text-white font-bold rounded-xl hover:bg-blueprint-700 transition-colors shadow-lg disabled:opacity-50 mt-4"
          >
            {loading ? 'Scheduling...' : 'Confirm Visit'}
          </button>
        </form>
      </GlassPanel>
    </div>
  )
}
