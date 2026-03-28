'use client'

import { useState } from 'react'
import { completeOnboardingAction } from '@/lib/actions/onboarding'

const TRADE_TYPES = [
  'Plumber',
  'Electrician',
  'Carpenter',
  'Painter',
  'Roofer',
  'HVAC Technician',
  'Landscaper',
  'General Contractor',
  'Mason',
  'Tiler',
  'Other'
]

export default function OnboardingForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    const result = await completeOnboardingAction(formData)

    if (!result.success) {
      setError(result.error || 'Something went wrong')
      setLoading(false)
    }
    // If success, the server action will redirect
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label 
          htmlFor="business_name" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Business Name <span className="text-red-500">*</span>
        </label>
        <input
          id="business_name"
          name="business_name"
          type="text"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="e.g. Smith Plumbing Services"
          data-testid="onboarding-business-name-input"
        />
      </div>

      <div>
        <label 
          htmlFor="trade_type" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Trade Type <span className="text-red-500">*</span>
        </label>
        <select
          id="trade_type"
          name="trade_type"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          data-testid="onboarding-trade-type-select"
        >
          <option value="">Select your trade</option>
          {TRADE_TYPES.map((trade) => (
            <option key={trade} value={trade.toLowerCase().replace(/\s+/g, '_')}>
              {trade}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div 
          className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm"
          data-testid="onboarding-error-message"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="onboarding-submit-button"
      >
        {loading ? 'Setting up...' : 'Complete Setup'}
      </button>
    </form>
  )
}
