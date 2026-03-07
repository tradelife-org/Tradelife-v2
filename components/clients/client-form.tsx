'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, updateClient, deleteClient } from '@/lib/actions/clients'
import { GlassPanel } from '@/components/ui/glass-panel'

export function ClientForm({ client = null }: { client?: any }) {
  const router = useRouter()
  const isEdit = !!client
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (isEdit) {
        await updateClient(client.id, formData)
      } else {
        await createClient(formData)
      }
      router.refresh()
      router.push('/clients')
    } catch (error) {
      console.error('Failed to save client:', error)
      alert('Failed to save client. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (confirm('Are you sure you want to delete this client?')) {
      setIsLoading(true)
      try {
        await deleteClient(client.id)
        router.refresh()
        router.push('/clients')
      } catch (error) {
        console.error('Failed to delete client:', error)
        alert('Failed to delete client.')
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <GlassPanel className="w-full max-w-2xl p-8 shadow-2xl backdrop-blur-[14px] bg-white/60 border-white/40 rounded-2xl">
        <h2 className="text-3xl font-bold mb-8 text-slate-900 font-heading text-center">
          {isEdit ? 'Edit Client' : 'Create New Client'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
              Client Name <span className="text-safety">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-safety focus:border-safety bg-white/70 backdrop-blur-sm transition-all shadow-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Acme Corp or John Doe"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-safety focus:border-safety bg-white/70 backdrop-blur-sm transition-all shadow-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@example.com"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-safety focus:border-safety bg-white/70 backdrop-blur-sm transition-all shadow-sm"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+44 7700 900000"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-slate-700 mb-2">
              Billing Address
            </label>
            <textarea
              id="address"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-safety focus:border-safety bg-white/70 backdrop-blur-sm transition-all shadow-sm"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 High Street, London..."
            />
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-200/50">
             {isEdit ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-6 py-3 text-red-600 hover:text-red-700 font-medium transition-colors hover:bg-red-50 rounded-lg"
                >
                  Delete Client
                </button>
              ) : <div></div>}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isLoading}
                className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-safety hover:bg-safety-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Saving...
                  </>
                ) : (
                  isEdit ? 'Update Client' : 'Create Client'
                )}
              </button>
            </div>
          </div>
        </form>
      </GlassPanel>
    </div>
  )
}
