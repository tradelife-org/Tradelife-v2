'use client'

import * as React from 'react'
import { Mic, MicOff, Loader2, ArrowRight } from 'lucide-react'
import { parseQuoteRequestAction, ParsedQuote } from '@/lib/actions/intake'
import { useRouter } from 'next/navigation'

export default function VoiceIntake() {
  const router = useRouter()
  const [isListening, setIsListening] = React.useState(false)
  const [input, setInput] = React.useState('')
  const [processing, setProcessing] = React.useState(false)
  
  // Speech Recognition Ref
  const recognitionRef = React.useRef<any>(null)

  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      
      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript
        }
        setInput(prev => prev + ' ' + transcript)
      }
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error)
        setIsListening(false)
      }
      
      recognitionRef.current = recognition
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser.')
      return
    }
    
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setInput('') // Clear previous? Or append? Let's clear for fresh start.
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleProcess = async () => {
    if (!input.trim()) return
    setProcessing(true)
    try {
      const result = await parseQuoteRequestAction(input)
      // Store result in local storage or query params to pre-fill Create Quote page?
      // Or auto-create draft?
      // "Build a simple voice/text intake component... return a structured JSON"
      // Ideally we redirect to /quotes/create with data.
      // Let's use localStorage for now to pass data to /quotes/create.
      localStorage.setItem('quoteDraft', JSON.stringify(result))
      router.push('/quotes/create?intake=true')
    } catch (err) {
      console.error(err)
      alert('Failed to process request')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-8">
      <h3 className="text-sm font-heading font-bold text-slate-900 mb-3 flex items-center gap-2">
        <Mic className="w-4 h-4 text-blueprint" />
        Van Voice Intake
      </h3>
      
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe the job (e.g., 'Installing 6 spots in a kitchen for Mr Jones')..."
          className="w-full h-24 p-3 pr-12 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint resize-none"
        />
        <button
          onClick={toggleListening}
          className={`absolute right-3 bottom-3 p-2 rounded-full transition-colors ${
            isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white text-slate-400 hover:text-slate-600 shadow-sm border border-slate-200'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex justify-end mt-3">
        <button
          onClick={handleProcess}
          disabled={!input.trim() || processing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blueprint text-white text-sm font-semibold rounded-lg hover:bg-blueprint-700 disabled:opacity-50 transition-colors"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Process Request
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
