'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { AIOrb } from '@/components/ui/AIOrb'

const TRADE_TYPES = ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Roofing', 'General Builder', 'Other']
const TEAM_SIZES = ['Just me', '2-5', '6-15', '16-50', '50+']
const THEMES = [
  { id: 'molten', label: 'Molten', desc: 'Warm copper energy' },
  { id: 'commercial', label: 'Commercial', desc: 'Cool professional blue' },
  { id: 'remembrance', label: 'Remembrance', desc: 'Deep muted red' },
]

const STEP_COUNT = 6

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [businessName, setBusinessName] = useState('')
  const [tradeType, setTradeType] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [theme, setTheme] = useState('commercial')

  function next() {
    if (step < STEP_COUNT - 1) setStep(step + 1)
    else router.push('/dashboard')
  }
  function back() {
    if (step > 0) setStep(step - 1)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal top bar */}
      <div className="h-14 border-b border-white/[0.06] px-4 sm:px-6 flex items-center" style={{ background: 'rgba(12,15,22,0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center">
          <span className="text-white font-bold text-xs">T</span>
        </div>
        <span className="font-semibold text-sm text-[var(--text-primary)] tracking-tight ml-3">TradeLife</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:p-8">
        <div className="w-full max-w-[480px]">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-6" data-testid="onboarding-steps">
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <div
                key={i}
                data-testid={`step-indicator-${i}`}
                className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-[var(--accent)]' : 'bg-[var(--border-strong)]'}`}
              />
            ))}
          </div>

          {/* Orb — always visible, AI-guided feel */}
          <div className="flex justify-center mb-6">
            <AIOrb size="sm" clickable={false} data-testid="onboarding-orb" />
          </div>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div data-testid="step-welcome" className="text-center">
              <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Welcome to TradeLife</h1>
              <p className="text-sm text-[var(--text-secondary)] mb-8">Let&apos;s set up your workspace.</p>
              <Button data-testid="onboarding-next" variant="primary" className="w-full" onClick={next}>Get Started</Button>
            </div>
          )}

          {/* Step 1: Business Name */}
          {step === 1 && (
            <div data-testid="step-business" className="text-center">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">What&apos;s your business called?</h2>
              <p className="text-xs text-[var(--text-secondary)] mb-6">We&apos;ll personalise your workspace.</p>
              <Input data-testid="business-name" placeholder="e.g. Smith & Sons Plumbing" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              <div className="flex gap-3 mt-8">
                <Button variant="ghost" onClick={back}>Back</Button>
                <Button data-testid="onboarding-next" variant="primary" className="flex-1" onClick={next}>Continue</Button>
              </div>
            </div>
          )}

          {/* Step 2: Trade Type */}
          {step === 2 && (
            <div data-testid="step-trade" className="text-center">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">What type of work do you do?</h2>
              <p className="text-xs text-[var(--text-secondary)] mb-6">Select your primary trade.</p>
              <div className="grid grid-cols-2 gap-2 text-left">
                {TRADE_TYPES.map((t) => (
                  <button
                    key={t}
                    data-testid={`trade-option-${t.toLowerCase().replace(/\s/g, '-')}`}
                    className={`px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-medium border ${tradeType === t ? 'border-[var(--accent)] text-[var(--accent)] inset-material' : 'border-[var(--panel-border)] text-[var(--text-secondary)] inset-material'}`}
                    onClick={() => setTradeType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-8">
                <Button variant="ghost" onClick={back}>Back</Button>
                <Button data-testid="onboarding-next" variant="primary" className="flex-1" onClick={next}>Continue</Button>
              </div>
            </div>
          )}

          {/* Step 3: Team Size */}
          {step === 3 && (
            <div data-testid="step-team" className="text-center">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">How big is your team?</h2>
              <p className="text-xs text-[var(--text-secondary)] mb-6">This helps us configure your workspace.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {TEAM_SIZES.map((s) => (
                  <button
                    key={s}
                    data-testid={`team-option-${s.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                    className={`px-4 py-2.5 rounded-[var(--radius-md)] text-xs font-medium border ${teamSize === s ? 'border-[var(--accent)] text-[var(--accent)] inset-material' : 'border-[var(--panel-border)] text-[var(--text-secondary)] inset-material'}`}
                    onClick={() => setTeamSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-8">
                <Button variant="ghost" onClick={back}>Back</Button>
                <Button data-testid="onboarding-next" variant="primary" className="flex-1" onClick={next}>Continue</Button>
              </div>
            </div>
          )}

          {/* Step 4: Theme */}
          {step === 4 && (
            <div data-testid="step-theme" className="text-center">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Pick your style</h2>
              <p className="text-xs text-[var(--text-secondary)] mb-6">You can change this later.</p>
              <div className="space-y-2 text-left">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    data-testid={`theme-option-${t.id}`}
                    className={`w-full px-4 py-3 rounded-[var(--radius-md)] border flex items-center gap-3 ${theme === t.id ? 'border-[var(--accent)] inset-material' : 'border-[var(--panel-border)] inset-material'}`}
                    onClick={() => setTheme(t.id)}
                  >
                    <div className={`w-3 h-3 rounded-full ${t.id === 'molten' ? 'bg-orange-500' : t.id === 'commercial' ? 'bg-blue-500' : 'bg-red-600'}`} />
                    <div>
                      <span className={`text-sm font-medium ${theme === t.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{t.label}</span>
                      <span className="text-[10px] text-[var(--text-muted)] ml-2">{t.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-8">
                <Button variant="ghost" onClick={back}>Back</Button>
                <Button data-testid="onboarding-next" variant="primary" className="flex-1" onClick={next}>Continue</Button>
              </div>
            </div>
          )}

          {/* Step 5: Finish */}
          {step === 5 && (
            <div data-testid="step-finish" className="text-center">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">You&apos;re all set</h2>
              <p className="text-xs text-[var(--text-secondary)] mb-8">Your workspace is ready. Let&apos;s get to work.</p>
              <Button data-testid="onboarding-finish" variant="primary" className="w-full" onClick={next}>Enter Dashboard</Button>
            </div>
          )}

          {/* Step label */}
          <p className="text-[10px] text-[var(--text-muted)] text-center mt-6">
            Step {step + 1} of {STEP_COUNT}
          </p>
        </div>
      </div>
    </div>
  )
}
