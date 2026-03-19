'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type BusinessType = 'sole_trader' | 'limited' | 'not_set_up' | null
type BankUsage = 'personal' | 'business' | 'not_sure' | null
type SetupChoice = 'sole_trader' | 'limited' | null
type LimitedOption = 'setup_fast' | 'register_only' | 'skip' | null

interface CompanyPreview {
  name: string
  address: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [businessType, setBusinessType] = useState<BusinessType>(null)
  const [bankUsage, setBankUsage] = useState<BankUsage>(null)
  const [setupChoice, setSetupChoice] = useState<SetupChoice>(null)
  const [limitedOption, setLimitedOption] = useState<LimitedOption>(null)
  const [businessName, setBusinessName] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const totalSteps = getStepCount()

  function getStepCount() {
    if (businessType === 'sole_trader') return 4
    if (businessType === 'not_set_up') return 5
    if (businessType === 'limited') return 5
    return 4
  }

  function handleBusinessTypeSelect(type: BusinessType) {
    setBusinessType(type)
    setBankUsage(null)
    setSetupChoice(null)
    setLimitedOption(null)
    setStep(2)
  }

  function handleNext() {
    setStep(step + 1)
  }

  function handleBack() {
    if (step > 1) setStep(step - 1)
  }

  function handleConfirm() {
    router.push('/dashboard')
  }

  const preview: CompanyPreview = {
    name: businessName || 'Your Business',
    address: 'Enter your business address',
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

          {/* Step 2: Conditional based on business type */}
          {step === 2 && businessType === 'sole_trader' && (
            <div data-testid="step-bank-usage">
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
                How do you currently use your bank?
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                This helps us organise your transactions
              </p>
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

          {/* Step 3 for not_set_up with limited choice */}
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

          {/* Business Name Step */}
          {((step === 3 && (businessType === 'sole_trader' || businessType === 'limited')) ||
            (step === 3 && businessType === 'not_set_up' && setupChoice === 'sole_trader') ||
            (step === 4 && businessType === 'not_set_up' && setupChoice === 'limited')) && (
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

          {/* Preview / Confirm Step */}
          {((step === 4 && (businessType === 'sole_trader' || businessType === 'limited')) ||
            (step === 4 && businessType === 'not_set_up' && setupChoice === 'sole_trader') ||
            (step === 5 && businessType === 'not_set_up' && setupChoice === 'limited')) && (
            <div data-testid="step-preview">
              <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">
                Looking good?
              </h2>
              <p className="text-slate-500 text-sm mb-6">Check your details before continuing</p>

              <div className="border border-slate-200 rounded-lg p-5">
                <div className="flex items-start gap-4">
                  {/* Logo placeholder */}
                  <div className="w-14 h-14 rounded-lg bg-blueprint-50 border border-blueprint-100 flex items-center justify-center shrink-0">
                    <span className="text-blueprint-600 font-heading font-bold text-xl">
                      {(businessName || 'B')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded border border-slate-200 focus:border-blueprint-400 outline-none text-slate-800 font-medium mb-1"
                        data-testid="preview-edit-name"
                        autoFocus
                      />
                    ) : (
                      <h3 className="font-heading font-bold text-slate-900 text-lg" data-testid="preview-name">
                        {preview.name}
                      </h3>
                    )}
                    <p className="text-sm text-slate-500 mt-0.5">{preview.address}</p>
                    <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">
                      {businessType === 'not_set_up'
                        ? setupChoice === 'limited' ? 'Limited Company' : 'Sole Trader'
                        : businessType === 'limited' ? 'Limited Company' : 'Sole Trader'}
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
                  className="flex-1 py-3 rounded-lg bg-blueprint-600 text-white font-medium hover:bg-blueprint-700 transition-colors"
                  data-testid="preview-confirm-button"
                >
                  Confirm
                </button>
              </div>
              <button
                onClick={handleConfirm}
                className="mt-3 w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                data-testid="preview-continue-button"
              >
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
