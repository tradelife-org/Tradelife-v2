'use client'

import { useState } from 'react'
import { initiateProxyCallAction, sendOnMyWaySMS } from '@/lib/actions/voice'
import { Phone, MessageSquare, Loader2 } from 'lucide-react'

export default function JobCommsActions({ jobId }: { jobId: string }) {
  const [calling, setCalling] = useState(false)
  const [texting, setTexting] = useState(false)

  async function handleCall() {
    setCalling(true)
    try {
      await initiateProxyCallAction(jobId)
      alert('Calling... Pick up your phone.')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCalling(false)
    }
  }

  async function handleSMS() {
    setTexting(true)
    try {
      await sendOnMyWaySMS(jobId)
      alert('SMS Sent')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setTexting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button 
        onClick={handleCall}
        disabled={calling}
        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        title="Call Client (Proxy)"
      >
        {calling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
      </button>
      <button 
        onClick={handleSMS}
        disabled={texting}
        className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
        title="Send 'On My Way'"
      >
        {texting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
      </button>
    </div>
  )
}
