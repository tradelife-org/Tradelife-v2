'use client'

import { useState, useEffect, useRef } from 'react'
import { sendPortalJobMessage, fetchPortalJobMessages } from '@/lib/actions/portal'
import { Send, User, MessageSquare } from 'lucide-react'
import { GlassPanel } from '@/components/ui/glass-panel'

export default function JobChat({ token, jobId, jobTitle }: { token: string, jobId: string, jobTitle: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const data = await fetchPortalJobMessages(token, jobId)
      setMessages(data)
    }
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [token, jobId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return

    const tempMsg = {
      id: 'temp-' + Date.now(),
      sender_type: 'CLIENT',
      content: input,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, tempMsg])
    setInput('')
    setSending(true)

    try {
      await sendPortalJobMessage(token, jobId, tempMsg.content)
      const data = await fetchPortalJobMessages(token, jobId)
      setMessages(data)
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <GlassPanel className="h-[500px] flex flex-col bg-white/10 border-white/20 shadow-2xl">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-blueprint-300" />
        <div>
          <h3 className="font-heading font-bold text-white text-sm">Project Chat</h3>
          <p className="text-xs text-white/50">{jobTitle}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_type === 'CLIENT'
          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                ${isMe ? 'bg-white/20 text-white' : 'bg-blueprint-500 text-white'}`}>
                <User className="w-4 h-4" />
              </div>
              
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm 
                ${isMe 
                  ? 'bg-white text-slate-900 rounded-tr-none' 
                  : 'bg-slate-800 text-white border border-white/10 rounded-tl-none'}`}>
                <p>{msg.content}</p>
                <p className="text-[10px] opacity-50 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message the team..."
            className="w-full h-10 pl-4 pr-10 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blueprint-400"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-blueprint-300 hover:text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </GlassPanel>
  )
}
