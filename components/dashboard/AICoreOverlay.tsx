'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Zap, TrendingUp, AlertTriangle, Clock } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'

const DAILY_BRIEF = [
  { icon: TrendingUp, label: 'Revenue up 12% this month', color: 'var(--success)' },
  { icon: AlertTriangle, label: '3 invoices overdue — £2,400 outstanding', color: 'var(--warning)' },
  { icon: Clock, label: 'VAT return due in 5 days', color: 'var(--danger)' },
  { icon: Zap, label: 'Kitchen Renovation at 72% — on track', color: 'var(--accent)' },
]

const MOCK_RESPONSES: Record<string, string> = {
  default: 'Analysing your workspace. All systems nominal. 3 active projects, 4 trades deployed. Net profit margin holding at 66.5%.',
  revenue: 'Monthly revenue stands at £24,500, a 12% increase from last period. Primary driver: Kitchen Renovation milestone payments.',
  invoice: 'You have 3 overdue invoices totalling £2,400. Oldest: Invoice #042 to Apex Ltd — 14 days past due. Recommend immediate follow-up.',
  schedule: 'Today: Site visit at Unit 4 (09:00), supplier call with BuildCo (11:30), client meeting with Smith (14:00), Plot 12 inspection (16:30).',
  project: 'Active projects: Kitchen Renovation (72%), Office Fit-Out (45%), Bathroom Remodel (90%). Bathroom Remodel on track for completion this week.',
}

function getResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes('revenue') || lower.includes('money') || lower.includes('profit')) return MOCK_RESPONSES.revenue
  if (lower.includes('invoice') || lower.includes('overdue') || lower.includes('payment')) return MOCK_RESPONSES.invoice
  if (lower.includes('schedule') || lower.includes('today') || lower.includes('calendar')) return MOCK_RESPONSES.schedule
  if (lower.includes('project') || lower.includes('kitchen') || lower.includes('renovation')) return MOCK_RESPONSES.project
  return MOCK_RESPONSES.default
}

interface Message {
  id: string
  from: 'system' | 'user'
  text: string
}

export function AICoreOverlay() {
  const open = useUIStore((s) => s.aiCoreOpen)
  const setOpen = useUIStore((s) => s.setAiCoreOpen)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setMessages([])
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!input.trim()) return
    const userMsg: Message = { id: Date.now().toString(), from: 'user', text: input.trim() }
    const response = getResponse(input)
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), from: 'system', text: response }])
    }, 400)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    if (e.key === 'Escape') setOpen(false)
  }

  if (!open) return null

  return (
    <div
      data-testid="ai-core-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Core panel */}
      <div
        data-testid="ai-core-panel"
        className="relative w-full max-w-[640px] mx-4 panel-material flex flex-col"
        style={{ maxHeight: '75vh' }}
      >
        <div className="relative z-[1] flex flex-col" style={{ maxHeight: '75vh' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full relative">
                <div className="absolute inset-[15%] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.5),rgba(59,130,246,0.15)_60%,transparent)]" />
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.12),transparent_70%)]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">System Intelligence</h2>
                <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">Core Active</p>
              </div>
            </div>
            <button
              data-testid="ai-core-close"
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Daily brief — shown when no messages */}
          {messages.length === 0 && (
            <div className="px-6 py-5" data-testid="ai-daily-brief">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-3">Daily Brief</p>
              <div className="space-y-2.5">
                {DAILY_BRIEF.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] inset-material">
                    <item.icon className="w-3.5 h-3.5 shrink-0" style={{ color: item.color }} />
                    <span className="text-xs text-[var(--text-primary)]">{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-4 text-center font-mono">Ask me anything below</p>
            </div>
          )}

          {/* Conversation thread */}
          {messages.length > 0 && (
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ minHeight: '200px' }}>
              {messages.map((msg) => (
                <div key={msg.id} data-testid={`ai-message-${msg.from}`}>
                  {msg.from === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--accent)] text-white text-xs">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full shrink-0 mt-0.5 relative">
                        <div className="absolute inset-[15%] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.5),transparent_70%)]" />
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] leading-relaxed font-mono">
                        {msg.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-6 pb-5 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                data-testid="ai-core-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask the system..."
                className="flex-1 bg-[var(--bg-inset)] border border-[var(--border)] rounded-[var(--radius-md)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--border-strong)] font-mono"
              />
              <button
                data-testid="ai-core-send"
                onClick={handleSend}
                className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--accent)] flex items-center justify-center text-white shrink-0 hover:bg-[var(--accent-dim)]"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
