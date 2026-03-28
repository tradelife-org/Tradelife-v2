'use client'

import { useState } from 'react'
import { createJobFromQuoteAction } from '@/lib/actions/jobs'

type Props = {
  quoteId: string
}

export default function ConvertToJobButton({ quoteId }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setError(null)
    setLoading(true)

    const result = await createJobFromQuoteAction(quoteId)

    if (!result.success) {
      setError(result.error || 'Failed to create job')
      setLoading(false)
    }
    // If success, server action redirects to /jobs
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="convert-to-job-button"
      >
        {loading ? 'Converting...' : 'Convert to Job'}
      </button>

      {error && (
        <div 
          className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm"
          data-testid="convert-to-job-error"
        >
          {error}
        </div>
      )}
    </div>
  )
}
