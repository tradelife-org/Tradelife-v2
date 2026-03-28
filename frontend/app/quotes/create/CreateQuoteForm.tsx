'use client'

import { useState } from 'react'
import { createQuoteAction } from '@/lib/actions/quotes'

type Client = {
  id: string
  name: string
}

type Props = {
  clients: Client[]
}

export default function CreateQuoteForm({ clients }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    const result = await createQuoteAction(formData)

    if (!result.success) {
      setError(result.error || 'Something went wrong')
      setLoading(false)
    }
    // If success, server action redirects to /quotes
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label 
          htmlFor="title" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Quote Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="e.g. Kitchen Renovation Quote"
          data-testid="quote-title-input"
        />
      </div>

      <div>
        <label 
          htmlFor="client_id" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Client <span className="text-red-500">*</span>
        </label>
        <select
          id="client_id"
          name="client_id"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          data-testid="quote-client-select"
        >
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div 
          className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm"
          data-testid="create-quote-error"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="create-quote-submit"
      >
        {loading ? 'Creating...' : 'Create Quote'}
      </button>
    </form>
  )
}
