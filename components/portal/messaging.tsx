'use client'

import { useState, useEffect, useRef } from 'react'
import { sendPortalMessage, fetchPortalMessages } from '@/lib/actions/portal'
import { Send, User, Bot, Loader2 } from 'lucide-react'
import { GlassPanel } from '@/components/ui/glass-panel'

export default function PortalMessaging({ token }: { token: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const data = await fetchPortalMessages(token)
      setMessages(data)
    }
    load()
    
    // Poll every 5s for new messages (Simple MVP real-time)
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [token])

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
      await sendPortalMessage(token, tempMsg.content)
      // Refresh to get server timestamp/ID and potential auto-reply
      const data = await fetchPortalMessages(token)
      setMessages(data)
    } catch (err) {
      console.error('Send failed', err)
      // Ideally remove temp message or show error
    } finally {
      setSending(false)
    }
  }

  return (
    <GlassPanel className="h-[600px] flex flex-col bg-white/40 border-white/40 shadow-2xl backdrop-blur-[14px]">
      <div className="p-4 border-b border-white/20 bg-white/10">
        <h3 className="font-heading font-bold text-slate-800">Messages</h3>
        <p className="text-xs text-slate-500">Ask us anything about your project</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_type === 'CLIENT'
          const isAI = msg.sender_type === 'AI'
          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                ${isMe ? 'bg-slate-200 text-slate-600' : isAI ? 'bg-blueprint text-white' : 'bg-safety text-white'}`}>
                {isMe ? <User className="w-4 h-4" /> : isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm 
                ${isMe 
                  ? 'bg-slate-800 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 shadow-sm rounded-tl-none border border-white/50'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-white/20 bg-white/20">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            className="w-full h-12 pl-4 pr-12 rounded-xl border border-white/40 bg-white/60 focus:bg-white focus:ring-2 focus:ring-blueprint/50 focus:border-transparent transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blueprint text-white rounded-lg hover:bg-blueprint-700 disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </GlassPanel>
  )
}
