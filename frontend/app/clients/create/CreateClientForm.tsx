'use client'

import { useState } from 'react'
import { createClientAction } from '@/lib/actions/clients'

export default function CreateClientForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    const result = await createClientAction(formData)

    if (!result.success) {
      setError(result.error || 'Something went wrong')
      setLoading(false)
    }
    // If success, server action redirects to /clients
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label 
          htmlFor="name" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="Client name"
          data-testid="client-name-input"
        />
      </div>

      <div>
        <label 
          htmlFor="email" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="client@example.com"
          data-testid="client-email-input"
        />
      </div>

      <div>
        <label 
          htmlFor="phone" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="+1 234 567 890"
          data-testid="client-phone-input"
        />
      </div>

      {error && (
        <div 
          className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm"
          data-testid="create-client-error"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="create-client-submit"
      >
        {loading ? 'Creating...' : 'Create Client'}
      </button>
    </form>
  )
}
