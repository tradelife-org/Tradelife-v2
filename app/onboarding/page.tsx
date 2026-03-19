'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type BusinessType = 'sole_trader' | 'limited' | 'not_set_up' | null
type BankUsage = 'personal' | 'business' | 'not_sure' | null
type SetupChoice = 'sole_trader' | 'limited' | null
type LimitedOption = 'setup_fast' | 'register_only' | 'skip' | null

// Mock Companies House data
const MOCK_COMPANIES: Record<string, { name: string; address: string }> = {
  '12345678': { name: 'Smith Construction Ltd', address: '123 High Street, London, EC1V 9NL' },
  '87654321': { name: 'Jones Plumbing Services Ltd', address: '45 Victoria Road, Birmingham, B1 1BB' },
  '11223344': { name: 'Taylor Electrical Ltd', address: '78 Park Lane, Manchester, M1 4BH' },
  '55667788': { name: 'Wilson Roofing Ltd', address: '12 Bridge Street, Bristol, BS1 2EJ' },
}

const LOGO_COLORS = [
  '#0047AB', '#2563eb', '#059669', '#d97706', '#dc2626',
  '#7c3aed', '#0891b2', '#be185d', '#4f46e5', '#0d9488',
]

function getLogoColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length]
}

function simulateCompanyLookup(query: string): { name: string; address: string } | null {
  const trimmed = query.trim()
  // Check by company number
  if (MOCK_COMPANIES[trimmed]) {
    return MOCK_COMPANIES[trimmed]
  }
  // Check by name (partial match)
  const lower = trimmed.toLowerCase()
  for (const company of Object.values(MOCK_COMPANIES)) {
    if (company.name.toLowerCase().includes(lower)) {
      return company
    }
  }
  return null
}

export default function OnboardingPage() {
  const router = useRouter()
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
  const [ready, setReady] = useState(true)

  const isLimitedFlow =
    businessType === 'limited' ||
    (businessType === 'not_set_up' && setupChoice === 'limited')

  const totalSteps = getStepCount()

  function getStepCount() {
    if (businessType === 'sole_trader') return 4
    if (businessType === 'limited') return 5
    if (businessType === 'not_set_up') {
      return setupChoice === 'limited' ? 6 : 5
    }
    return 4
  }

  function handleBusinessTypeSelect(type: BusinessType) {
    setBusinessType(type)
    setBankUsage(null)
    setSetupChoice(null)
    setLimitedOption(null)
    setBusinessName('')
    setCompanyQuery('')
    setCompanyAddress('')
    setLookupResult(null)
    setStep(2)
  }

  function handleNext() {
    setStep(step + 1)
  }

  function handleBack() {
    if (step > 1) setStep(step - 1)
  }

  function handleCompanySearch(value: string) {
    setCompanyQuery(value)
    if (value.trim().length >= 3) {
      const result = simulateCompanyLookup(value)
      if (result) {
        setLookupResult(result)
        setBusinessName(result.name)
        setCompanyAddress(result.address)
      } else {
        setLookupResult(null)
        setBusinessName(value.trim())
        setCompanyAddress('')
      }
    } else {
      setLookupResult(null)
    }
  }

  async function handleConfirm() {
    setConfirming(true)
    try {
      await fetch('/api/onboarding/complete', { method: 'POST' })
    } catch (err) {
      console.error('Failed to complete onboarding:', err)
    }
    router.push('/dashboard')
  }

  const logoLetter = (businessName || 'B')[0].toUpperCase()
  const logoColor = getLogoColor(businessName || 'B')

  // Safety: always show UI
  if (!ready) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-slate-500" data-testid="onboarding-fallback">Setting up your workspace...</p>
      </main>
    )
  }

  // Determine which step content to show for Limited Company flow
  function isCompanySearchStep(): boolean {
    if (businessType === 'limited' && step === 3) return true
    if (businessType === 'not_set_up' && setupChoice === 'limited' && step === 4) return true
    return false
  }

  function isBusinessNameStep(): boolean {
    if (businessType === 'sole_trader' && step === 3) return true
    if (businessType === 'not_set_up' && setupChoice === 'sole_trader' && step === 3) return true
    // For limited: business name is set via company search, so name step = search step + 1
    if (businessType === 'limited' && step === 4 && !isLimitedFlow) return true
    if (businessType === 'not_set_up' && setupChoice === 'sole_trader' && step === 4) return false
    return false
  }

  function isPreviewStep(): boolean {
    if (businessType === 'sole_trader' && step === 4) return true
    if (businessType === 'limited' && step === 5) return true
    if (businessType === 'not_set_up' && setupChoice === 'sole_trader' && step === 4) return true
    if (businessType === 'not_set_up' && setupChoice === 'limited' && step === 6) return true
    return false
  }

  // For limited flow: after company search, go to a "confirm name" step, then preview
  function isLimitedNameConfirmStep(): boolean {
    if (businessType === 'limited' && step === 4) return true
    if (businessType === 'not_set_up' && setupChoice === 'limited' && step === 5) return true
    return false
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-lg border border-slate-200 shadow-sm">
        {/* Progress */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 font-medium" data-testid="step-indicator">
              Step {step} of {totalSteps}
            </span>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="text-sm text-blueprint-600 hover:text-blueprint-700 font-medium"
                data-testid="back-button"
              >
                Back
              </button>
            )}
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-blueprint-600 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Business Type */}
          {step === 1 && (
            <div data-testid="step-business-type">
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
                What type of business are you?
              </h2>
              <p className="text-slate-500 text-sm mb-6">Select your business structure</p>
              <div className="space-y-3">
                {[
                  { value: 'sole_trader' as const, label: 'Sole Trader' },
                  { value: 'limited' as const, label: 'Limited Company' },
                  { value: 'not_set_up' as const, label: 'Not set up yet' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleBusinessTypeSelect(opt.value)}
                    className="w-full text-left px-4 py-3.5 rounded-lg border border-slate-200 hover:border-blueprint-400 hover:bg-blueprint-50 transition-colors text-slate-800 font-medium"
                    data-testid={`business-type-${opt.value}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Sole Trader → Bank usage */}
          {step === 2 && businessType === 'sole_trader' && (
            <div data-testid="step-bank-usage">
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
                How do you currently use your bank?
              </h2>
              <p className="text-slate-500 text-sm mb-6">This helps us organise your transactions</p>
              <div className="space-y-3">
                {[
                  { value: 'personal' as const, label: 'Personal' },
                  { value: 'business' as const, label: 'Business' },
                  { value: 'not_sure' as const, label: 'Not sure' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setBankUsage(opt.value); handleNext() }}
                    className="w-full text-left px-4 py-3.5 rounded-lg border border-slate-200 hover:border-blueprint-400 hover:bg-blueprint-50 transition-colors text-slate-800 font-medium"
                    data-testid={`bank-usage-${opt.value}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Not set up → Choose type */}
          {step === 2 && businessType === 'not_set_up' && (
            <div data-testid="step-setup-choice">
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
                What would you like to set up?
              </h2>
              <p className="text-slate-500 text-sm mb-6">Choose your business structure</p>
              <div className="space-y-3">
                {[
                  { value: 'sole_trader' as const, label: 'Sole Trader' },
                  { value: 'limited' as const, label: 'Limited Company' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSetupChoice(opt.value); handleNext() }}
                    className="w-full text-left px-4 py-3.5 rounded-lg border border-slate-200 hover:border-blueprint-400 hover:bg-blueprint-50 transition-colors text-slate-800 font-medium"
                    data-testid={`setup-choice-${opt.value}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Limited → Options */}
          {step === 2 && businessType === 'limited' && (
            <div data-testid="step-limited-options">
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
                How would you like to proceed?
              </h2>
              <p className="text-slate-500 text-sm mb-6">Choose your setup preference</p>
              <div className="space-y-3">
                {[
                  { value: 'setup_fast' as const, label: 'Set up everything fast' },
                  { value: 'register_only' as const, label: 'Register company only' },
                  { value: 'skip' as const, label: 'Skip' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setLimitedOption(opt.value); handleNext() }}
                    className="w-full text-left px-4 py-3.5 rounded-lg border border-slate-200 hover:border-blueprint-400 hover:bg-blueprint-50 transition-colors text-slate-800 font-medium"
                    data-testid={`limited-option-${opt.value}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: not_set_up + limited → Limited options */}
          {step === 3 && businessType === 'not_set_up' && setupChoice === 'limited' && (
            <div data-testid="step-limited-options-from-setup">
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
                How would you like to proceed?
              </h2>
              <p className="text-slate-500 text-sm mb-6">Choose your setup preference</p>
              <div className="space-y-3">
                {[
                  { value: 'setup_fast' as const, label: 'Set up everything fast' },
                  { value: 'register_only' as const, label: 'Register company only' },
                  { value: 'skip' as const, label: 'Skip' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setLimitedOption(opt.value); handleNext() }}
                    className="w-full text-left px-4 py-3.5 rounded-lg border border-slate-200 hover:border-blueprint-400 hover:bg-blueprint-50 transition-colors text-slate-800 font-medium"
                    data-testid={`limited-setup-option-${opt.value}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Company Search Step (Limited flows) */}
          {isCompanySearchStep() && (
            <div data-testid="step-company-search">
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
                Company name or number
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Enter your company name or Companies House number
              </p>
              <input
                type="text"
                value={companyQuery}
                onChange={(e) => handleCompanySearch(e.target.value)}
                placeholder="e.g. Smith Construction Ltd or 12345678"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blueprint-400 focus:ring-1 focus:ring-blueprint-400 outline-none text-slate-800"
                data-testid="company-search-input"
              />

              {lookupResult && (
                <div className="mt-4 p-4 rounded-lg border border-emerald-200 bg-emerald-50" data-testid="company-lookup-result">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: logoColor }}
                    >
                      <span className="text-white font-heading font-bold text-lg">
                        {lookupResult.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{lookupResult.name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{lookupResult.address}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleNext}
                disabled={!companyQuery.trim() || companyQuery.trim().length < 3}
                className="mt-6 w-full py-3 rounded-lg bg-blueprint-600 text-white font-medium hover:bg-blueprint-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                data-testid="company-search-continue"
              >
                Continue
              </button>
            </div>
          )}

          {/* Business Name Step (Sole Trader flows) */}
          {isBusinessNameStep() && (
            <div data-testid="step-business-name">
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
                What&apos;s your business name?
              </h2>
              <p className="text-slate-500 text-sm mb-6">We&apos;ll use this across your account</p>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Smith Plumbing Services"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blueprint-400 focus:ring-1 focus:ring-blueprint-400 outline-none text-slate-800"
                data-testid="business-name-input"
              />
              <button
                onClick={handleNext}
                disabled={!businessName.trim()}
                className="mt-6 w-full py-3 rounded-lg bg-blueprint-600 text-white font-medium hover:bg-blueprint-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                data-testid="business-name-continue"
              >
                Continue
              </button>
            </div>
          )}

          {/* Confirm Name Step (Limited flows - after company search) */}
          {isLimitedNameConfirmStep() && (
            <div data-testid="step-confirm-name">
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
                Confirm your business name
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                {lookupResult ? 'We found your company details' : 'Enter your business name'}
              </p>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Business name"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blueprint-400 focus:ring-1 focus:ring-blueprint-400 outline-none text-slate-800"
                data-testid="confirm-name-input"
              />
              {companyAddress && (
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Business address"
                  className="w-full mt-3 px-4 py-3 rounded-lg border border-slate-200 focus:border-blueprint-400 focus:ring-1 focus:ring-blueprint-400 outline-none text-slate-800"
                  data-testid="confirm-address-input"
                />
              )}
              <button
                onClick={handleNext}
                disabled={!businessName.trim()}
                className="mt-6 w-full py-3 rounded-lg bg-blueprint-600 text-white font-medium hover:bg-blueprint-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                data-testid="confirm-name-continue"
              >
                Continue
              </button>
            </div>
          )}

          {/* Preview / Confirm Step */}
          {isPreviewStep() && (
            <div data-testid="step-preview">
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
                Looking good?
              </h2>
              <p className="text-slate-500 text-sm mb-6">Check your details before continuing</p>

              <div className="border border-slate-200 rounded-lg p-5">
                <div className="flex items-start gap-4">
                  {/* Generated logo */}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: logoColor }}
                    data-testid="preview-logo"
                  >
                    <span className="text-white font-heading font-bold text-xl">
                      {logoLetter}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded border border-slate-200 focus:border-blueprint-400 outline-none text-slate-800 font-medium mb-2"
                          data-testid="preview-edit-name"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={companyAddress}
                          onChange={(e) => setCompanyAddress(e.target.value)}
                          placeholder="Business address"
                          className="w-full px-3 py-1.5 rounded border border-slate-200 focus:border-blueprint-400 outline-none text-slate-800 text-sm"
                          data-testid="preview-edit-address"
                        />
                      </>
                    ) : (
                      <>
                        <h3 className="font-heading font-bold text-slate-900 text-lg" data-testid="preview-name">
                          {businessName || 'Your Business'}
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5" data-testid="preview-address">
                          {companyAddress || 'Enter your business address'}
                        </p>
                      </>
                    )}
                    <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">
                      {isLimitedFlow ? 'Limited Company' : 'Sole Trader'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex-1 py-3 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  data-testid="preview-edit-button"
                >
                  {isEditing ? 'Done' : 'Edit'}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="flex-1 py-3 rounded-lg bg-blueprint-600 text-white font-medium hover:bg-blueprint-700 disabled:opacity-50 transition-colors"
                  data-testid="preview-confirm-button"
                >
                  {confirming ? 'Confirming...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}

          {/* Fallback: no step matched - safety */}
          {step > 1 &&
            !isCompanySearchStep() &&
            !isBusinessNameStep() &&
            !isLimitedNameConfirmStep() &&
            !isPreviewStep() &&
            !(step === 2 && businessType === 'sole_trader') &&
            !(step === 2 && businessType === 'not_set_up') &&
            !(step === 2 && businessType === 'limited') &&
            !(step === 3 && businessType === 'not_set_up' && setupChoice === 'limited') && (
            <div data-testid="onboarding-fallback">
              <p className="text-slate-500">Setting up your workspace...</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
