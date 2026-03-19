'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const STEPS = ['Welcome', 'Business', 'Trade', 'Team', 'Theme', 'Finish']

const TRADE_TYPES = ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Roofing', 'General Builder', 'Other']
const TEAM_SIZES = ['Just me', '2-5', '6-15', '16-50', '50+']
const THEMES = [
  { id: 'molten', label: 'Molten', desc: 'Warm copper energy' },
  { id: 'commercial', label: 'Commercial', desc: 'Cool professional blue' },
  { id: 'remembrance', label: 'Remembrance', desc: 'Deep muted red' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [businessName, setBusinessName] = useState('')
  const [tradeType, setTradeType] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [theme, setTheme] = useState('molten')

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1)
    else router.push('/dashboard')
  }

  function back() {
    if (step > 0) setStep(step - 1)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      {/* Minimal top bar */}
      <div className="h-14 border-b border-[var(--panel-border)] topbar-material px-6 flex items-center">
        <div className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center">
          <span className="text-white font-bold text-xs">T</span>
        </div>
        <span className="font-semibold text-sm text-[var(--text-primary)] tracking-tight ml-3">TradeLife</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[520px]">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-8" data-testid="onboarding-steps">
            {STEPS.map((s, i) => (
              <div
                key={s}
                data-testid={`step-indicator-${i}`}
                className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-[var(--accent)]' : 'bg-[var(--border-strong)]'}`}
              />
            ))}
          </div>

          {/* Step panel */}
          <div
            data-testid="onboarding-panel"
            className="panel-material p-8"
          >
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div data-testid="step-welcome">
                <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Welcome to TradeLife</h1>
                <p className="text-sm text-[var(--text-secondary)] mb-6">Let&apos;s set up your workspace in a few quick steps.</p>
                <Button data-testid="onboarding-next" variant="primary" className="w-full" onClick={next}>Get Started</Button>
              </div>
            )}

            {/* Step 1: Business Name */}
            {step === 1 && (
              <div data-testid="step-business">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Your business</h2>
                <p className="text-xs text-[var(--text-secondary)] mb-5">What&apos;s your business called?</p>
                <Input data-testid="business-name" placeholder="e.g. Smith & Sons Plumbing" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                <div className="flex gap-3 mt-6">
                  <Button variant="ghost" onClick={back}>Back</Button>
                  <Button data-testid="onboarding-next" variant="primary" className="flex-1" onClick={next}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 2: Trade Type */}
            {step === 2 && (
              <div data-testid="step-trade">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Your trade</h2>
                <p className="text-xs text-[var(--text-secondary)] mb-5">What type of work do you do?</p>
                <div className="grid grid-cols-2 gap-2">
                  {TRADE_TYPES.map((t) => (
                    <button
                      key={t}
                      data-testid={`trade-option-${t.toLowerCase().replace(/\s/g, '-')}`}
                      className={`px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-medium text-left border ${tradeType === t ? 'border-[var(--accent)] text-[var(--accent)] inset-material' : 'border-[var(--panel-border)] text-[var(--text-secondary)] inset-material'}`}
                      onClick={() => setTradeType(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="ghost" onClick={back}>Back</Button>
                  <Button data-testid="onboarding-next" variant="primary" className="flex-1" onClick={next}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 3: Team Size */}
            {step === 3 && (
              <div data-testid="step-team">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Team size</h2>
                <p className="text-xs text-[var(--text-secondary)] mb-5">How big is your team?</p>
                <div className="flex flex-wrap gap-2">
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
                <div className="flex gap-3 mt-6">
                  <Button variant="ghost" onClick={back}>Back</Button>
                  <Button data-testid="onboarding-next" variant="primary" className="flex-1" onClick={next}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 4: Theme */}
            {step === 4 && (
              <div data-testid="step-theme">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Choose a style</h2>
                <p className="text-xs text-[var(--text-secondary)] mb-5">Pick your workspace theme.</p>
                <div className="space-y-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      data-testid={`theme-option-${t.id}`}
                      className={`w-full px-4 py-3 rounded-[var(--radius-md)] text-left border flex items-center gap-3 ${theme === t.id ? 'border-[var(--accent)] inset-material' : 'border-[var(--panel-border)] inset-material'}`}
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
                <div className="flex gap-3 mt-6">
                  <Button variant="ghost" onClick={back}>Back</Button>
                  <Button data-testid="onboarding-next" variant="primary" className="flex-1" onClick={next}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 5: Finish */}
            {step === 5 && (
              <div data-testid="step-finish" className="text-center">
                <div className="w-16 h-16 rounded-2xl inset-material border border-[var(--panel-border)] flex items-center justify-center mx-auto mb-5">
                  <span className="text-2xl font-bold text-[var(--accent)]">T</span>
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">You&apos;re all set</h2>
                <p className="text-xs text-[var(--text-secondary)] mb-6">Your workspace is ready. Let&apos;s get to work.</p>
                <Button data-testid="onboarding-finish" variant="primary" className="w-full" onClick={next}>Enter Dashboard</Button>
              </div>
            )}
          </div>

          {/* Step label */}
          <p className="text-[10px] text-[var(--text-muted)] text-center mt-4">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>
      </div>
    </div>
  )
}
