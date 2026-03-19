'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore, type ThemeName } from '@/lib/stores/theme-store'

type BusinessType = 'sole_trader' | 'limited' | 'not_set_up' | null
type BankUsage = 'personal' | 'business' | 'not_sure' | null
type SetupChoice = 'sole_trader' | 'limited' | null
type LimitedOption = 'setup_fast' | 'register_only' | 'skip' | null

const MOCK_COMPANIES: Record<string, { name: string; address: string }> = {
  '12345678': { name: 'Smith Construction Ltd', address: '123 High Street, London, EC1V 9NL' },
  '87654321': { name: 'Jones Plumbing Services Ltd', address: '45 Victoria Road, Birmingham, B1 1BB' },
  '11223344': { name: 'Taylor Electrical Ltd', address: '78 Park Lane, Manchester, M1 4BH' },
  '55667788': { name: 'Wilson Roofing Ltd', address: '12 Bridge Street, Bristol, BS1 2EJ' },
}

const LOGO_COLORS = ['#3b82f6','#f97316','#dc2626','#10b981','#8b5cf6','#0891b2','#be185d','#4f46e5']

function getLogoColor(name: string): string {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return LOGO_COLORS[Math.abs(h) % LOGO_COLORS.length]
}

function simulateCompanyLookup(q: string) {
  const t = q.trim(); if (MOCK_COMPANIES[t]) return MOCK_COMPANIES[t]
  const l = t.toLowerCase()
  for (const c of Object.values(MOCK_COMPANIES)) { if (c.name.toLowerCase().includes(l)) return c }
  return null
}

const THEMES: { key: ThemeName; label: string; sub: string; preview: string }[] = [
  { key: 'molten', label: 'Command Mode', sub: 'Energetic dark interface with ember accents', preview: '#f97316' },
  { key: 'commercial', label: 'Professional Mode', sub: 'Clean corporate interface with blue accents', preview: '#3b82f6' },
  { key: 'remembrance', label: 'Respect Mode', sub: 'Calm reflective interface with crimson tones', preview: '#dc2626' },
]

function OptionButton({ label, onClick, testId }: { label: string; onClick: () => void; testId: string }) {
  return (
    <button onClick={onClick} data-testid={testId}
      className="w-full text-left px-4 py-3.5 rounded-xl glass-panel hover:edge-glow transition-all duration-200 text-sm font-medium"
      style={{ color: 'var(--text-primary)' }}>
      {label}
    </button>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const { theme, setTheme } = useThemeStore()
  const [step, setStep] = useState(1)
  const [businessType, setBusinessType] = useState<BusinessType>(null)
  const [bankUsage, setBankUsage] = useState<BankUsage>(null)
  const [setupChoice, setSetupChoice] = useState<SetupChoice>(null)
  const [limitedOption, setLimitedOption] = useState<LimitedOption>(null)
  const [businessName, setBusinessName] = useState('')
  const [companyQuery, setCompanyQuery] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [lookupResult, setLookupResult] = useState<{ name: string; address: string } | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(theme)

  const isLimitedFlow = businessType === 'limited' || (businessType === 'not_set_up' && setupChoice === 'limited')

  function getStepCount() {
    if (businessType === 'sole_trader') return 5
    if (businessType === 'limited') return 6
    if (businessType === 'not_set_up') return setupChoice === 'limited' ? 7 : 6
    return 5
  }
  const totalSteps = getStepCount()

  function handleBusinessTypeSelect(type: BusinessType) {
    setBusinessType(type); setBankUsage(null); setSetupChoice(null); setLimitedOption(null)
    setBusinessName(''); setCompanyQuery(''); setCompanyAddress(''); setLookupResult(null); setStep(2)
  }
  function handleNext() { setStep(step + 1) }
  function handleBack() { if (step > 1) setStep(step - 1) }

  function handleCompanySearch(value: string) {
    setCompanyQuery(value)
    if (value.trim().length >= 3) {
      const r = simulateCompanyLookup(value)
      if (r) { setLookupResult(r); setBusinessName(r.name); setCompanyAddress(r.address) }
      else { setLookupResult(null); setBusinessName(value.trim()); setCompanyAddress('') }
    } else { setLookupResult(null) }
  }

  async function handleConfirm() {
    setConfirming(true)
    try { await fetch('/api/onboarding/complete', { method: 'POST' }) } catch {}
    router.push('/dashboard')
  }

  // step matchers (same logic, +1 offset for theme step at end of each flow)
  const isCompanySearch = () => (businessType === 'limited' && step === 3) || (businessType === 'not_set_up' && setupChoice === 'limited' && step === 4)
  const isBusinessName = () => (businessType === 'sole_trader' && step === 3) || (businessType === 'not_set_up' && setupChoice === 'sole_trader' && step === 3)
  const isLimitedNameConfirm = () => (businessType === 'limited' && step === 4) || (businessType === 'not_set_up' && setupChoice === 'limited' && step === 5)

  const isPreview = () => {
    if (businessType === 'sole_trader' && step === 4) return true
    if (businessType === 'limited' && step === 5) return true
    if (businessType === 'not_set_up' && setupChoice === 'sole_trader' && step === 4) return true
    if (businessType === 'not_set_up' && setupChoice === 'limited' && step === 6) return true
    return false
  }

  const isThemeStep = () => {
    if (businessType === 'sole_trader' && step === 5) return true
    if (businessType === 'limited' && step === 6) return true
    if (businessType === 'not_set_up' && setupChoice === 'sole_trader' && step === 5) return true
    if (businessType === 'not_set_up' && setupChoice === 'limited' && step === 7) return true
    return false
  }

  const logoLetter = (businessName || 'B')[0].toUpperCase()
  const logoColor = getLogoColor(businessName || 'B')

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.05] pointer-events-none"
        style={{ background: `radial-gradient(circle, var(--glow-primary), transparent 70%)` }} />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-lg relative z-10">
        <div className="glass-panel-elevated overflow-hidden">
          {/* Progress */}
          <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }} data-testid="step-indicator">
                Step {step} of {totalSteps}
              </span>
              {step > 1 && <button onClick={handleBack} className="text-xs font-medium" style={{ color: 'var(--glow-primary)' }} data-testid="back-button">Back</button>}
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
              <motion.div className="h-full rounded-full" style={{ background: 'var(--glow-primary)', width: `${(step / totalSteps) * 100}%` }}
                layout transition={{ duration: 0.3 }} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }} className="p-6">

              {/* Step 1: Business Type */}
              {step === 1 && (
                <div data-testid="step-business-type">
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>What type of business are you?</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Select your business structure</p>
                  <div className="space-y-3">
                    <OptionButton label="Sole Trader" onClick={() => handleBusinessTypeSelect('sole_trader')} testId="business-type-sole_trader" />
                    <OptionButton label="Limited Company" onClick={() => handleBusinessTypeSelect('limited')} testId="business-type-limited" />
                    <OptionButton label="Not set up yet" onClick={() => handleBusinessTypeSelect('not_set_up')} testId="business-type-not_set_up" />
                  </div>
                </div>
              )}

              {/* Step 2 conditionals */}
              {step === 2 && businessType === 'sole_trader' && (
                <div data-testid="step-bank-usage">
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>How do you currently use your bank?</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>This helps us organise your transactions</p>
                  <div className="space-y-3">
                    {(['personal','business','not_sure'] as const).map(v => (
                      <OptionButton key={v} label={v === 'not_sure' ? 'Not sure' : v.charAt(0).toUpperCase() + v.slice(1)}
                        onClick={() => { setBankUsage(v); handleNext() }} testId={`bank-usage-${v}`} />
                    ))}
                  </div>
                </div>
              )}
              {step === 2 && businessType === 'not_set_up' && (
                <div data-testid="step-setup-choice">
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>What would you like to set up?</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Choose your business structure</p>
                  <div className="space-y-3">
                    <OptionButton label="Sole Trader" onClick={() => { setSetupChoice('sole_trader'); handleNext() }} testId="setup-choice-sole_trader" />
                    <OptionButton label="Limited Company" onClick={() => { setSetupChoice('limited'); handleNext() }} testId="setup-choice-limited" />
                  </div>
                </div>
              )}
              {step === 2 && businessType === 'limited' && (
                <div data-testid="step-limited-options">
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>How would you like to proceed?</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Choose your setup preference</p>
                  <div className="space-y-3">
                    <OptionButton label="Set up everything fast" onClick={() => { setLimitedOption('setup_fast'); handleNext() }} testId="limited-option-setup_fast" />
                    <OptionButton label="Register company only" onClick={() => { setLimitedOption('register_only'); handleNext() }} testId="limited-option-register_only" />
                    <OptionButton label="Skip" onClick={() => { setLimitedOption('skip'); handleNext() }} testId="limited-option-skip" />
                  </div>
                </div>
              )}
              {step === 3 && businessType === 'not_set_up' && setupChoice === 'limited' && (
                <div data-testid="step-limited-options-from-setup">
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>How would you like to proceed?</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Choose your setup preference</p>
                  <div className="space-y-3">
                    <OptionButton label="Set up everything fast" onClick={() => { setLimitedOption('setup_fast'); handleNext() }} testId="limited-setup-option-setup_fast" />
                    <OptionButton label="Register company only" onClick={() => { setLimitedOption('register_only'); handleNext() }} testId="limited-setup-option-register_only" />
                    <OptionButton label="Skip" onClick={() => { setLimitedOption('skip'); handleNext() }} testId="limited-setup-option-skip" />
                  </div>
                </div>
              )}

              {/* Company Search */}
              {isCompanySearch() && (
                <div data-testid="step-company-search">
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Company name or number</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Enter your company name or Companies House number</p>
                  <input type="text" value={companyQuery} onChange={(e) => handleCompanySearch(e.target.value)}
                    placeholder="e.g. Smith Construction Ltd or 12345678" className="glass-input w-full px-4 py-3 text-sm" data-testid="company-search-input" />
                  {lookupResult && (
                    <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }} data-testid="company-lookup-result">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: logoColor }}>
                          <span className="text-white font-bold">{lookupResult.name[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{lookupResult.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{lookupResult.address}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <button onClick={handleNext} disabled={!companyQuery.trim() || companyQuery.trim().length < 3}
                    className="btn-glow w-full py-3 text-sm mt-6" data-testid="company-search-continue">Continue</button>
                </div>
              )}

              {/* Business Name */}
              {isBusinessName() && (
                <div data-testid="step-business-name">
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>What&apos;s your business name?</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>We&apos;ll use this across your account</p>
                  <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Smith Plumbing Services" className="glass-input w-full px-4 py-3 text-sm" data-testid="business-name-input" />
                  <button onClick={handleNext} disabled={!businessName.trim()} className="btn-glow w-full py-3 text-sm mt-6" data-testid="business-name-continue">Continue</button>
                </div>
              )}

              {/* Limited Name Confirm */}
              {isLimitedNameConfirm() && (
                <div data-testid="step-confirm-name">
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Confirm your business name</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{lookupResult ? 'We found your company details' : 'Enter your business name'}</p>
                  <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Business name"
                    className="glass-input w-full px-4 py-3 text-sm" data-testid="confirm-name-input" />
                  {companyAddress && <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Business address"
                    className="glass-input w-full px-4 py-3 text-sm mt-3" data-testid="confirm-address-input" />}
                  <button onClick={handleNext} disabled={!businessName.trim()} className="btn-glow w-full py-3 text-sm mt-6" data-testid="confirm-name-continue">Continue</button>
                </div>
              )}

              {/* Preview */}
              {isPreview() && (
                <div data-testid="step-preview">
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Looking good?</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Check your details before continuing</p>
                  <div className="glass-panel p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ background: logoColor }} data-testid="preview-logo">
                        <span className="text-white font-bold text-xl">{logoLetter}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <>
                            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                              className="glass-input w-full px-3 py-1.5 text-sm font-medium mb-2" data-testid="preview-edit-name" autoFocus />
                            <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Business address"
                              className="glass-input w-full px-3 py-1.5 text-xs" data-testid="preview-edit-address" />
                          </>
                        ) : (
                          <>
                            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }} data-testid="preview-name">{businessName || 'Your Business'}</h3>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }} data-testid="preview-address">{companyAddress || 'Enter your business address'}</p>
                          </>
                        )}
                        <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(var(--glow-primary-rgb), 0.1)', color: 'var(--glow-primary)' }}>
                          {isLimitedFlow ? 'Limited Company' : 'Sole Trader'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setIsEditing(!isEditing)} className="flex-1 py-3 rounded-xl glass-panel text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }} data-testid="preview-edit-button">{isEditing ? 'Done' : 'Edit'}</button>
                    <button onClick={handleNext} className="btn-glow flex-1 py-3 text-sm" data-testid="preview-confirm-button">Continue</button>
                  </div>
                </div>
              )}

              {/* Theme Selection Step */}
              {isThemeStep() && (
                <div data-testid="step-theme-selection">
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Choose your workspace style</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>You can change this anytime in settings</p>
                  <div className="space-y-3">
                    {THEMES.map((t) => (
                      <button key={t.key} onClick={() => { setSelectedTheme(t.key); setTheme(t.key) }}
                        data-testid={`theme-option-${t.key}`}
                        className="w-full text-left p-4 rounded-xl transition-all duration-200"
                        style={{
                          background: selectedTheme === t.key ? `rgba(${t.preview === '#f97316' ? '249,115,22' : t.preview === '#3b82f6' ? '59,130,246' : '220,38,38'}, 0.08)` : 'rgba(var(--surface-rgb), 0.5)',
                          border: selectedTheme === t.key ? `1px solid ${t.preview}40` : '1px solid var(--border-color)',
                          boxShadow: selectedTheme === t.key ? `0 0 12px ${t.preview}15` : 'none',
                        }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${t.preview}20` }}>
                            <div className="w-4 h-4 rounded-full" style={{ background: t.preview, boxShadow: `0 0 8px ${t.preview}60` }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{t.sub}</p>
                          </div>
                          {selectedTheme === t.key && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: t.preview }}>
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <button onClick={handleConfirm} disabled={confirming} className="btn-glow w-full py-3 text-sm mt-6" data-testid="preview-confirm-button">
                    {confirming ? 'Setting up...' : 'Launch Command Center'}
                  </button>
                </div>
              )}

              {/* Fallback */}
              {step > 1 && !(step === 2 && businessType) && !isCompanySearch() && !isBusinessName() && !isLimitedNameConfirm() && !isPreview() && !isThemeStep()
                && !(step === 3 && businessType === 'not_set_up' && setupChoice === 'limited') && (
                <div data-testid="onboarding-fallback"><p style={{ color: 'var(--text-secondary)' }}>Setting up your workspace...</p></div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  )
}
