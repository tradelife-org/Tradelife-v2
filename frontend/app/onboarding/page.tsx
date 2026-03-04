'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Search, ArrowRight, CheckCircle,
  Loader2, Image as ImageIcon
} from 'lucide-react'
import { completeOnboardingAction } from '@/lib/actions/onboarding'

interface CompanySearchItem {
  company_number: string
  title: string
  address_snippet: string
  company_status: string
  address?: {
    premises: string
    address_line_1: string
    locality: string
    postal_code: string
    country: string
  }
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  const [search, setSearch] = React.useState('')
  const [searching, setSearching] = React.useState(false)
  const [searchResults, setSearchResults] = React.useState<CompanySearchItem[]>([])
  const [selectedCompany, setSelectedCompany] = React.useState<CompanySearchItem | null>(null)
  
  // Form State
  const [companyName, setCompanyName] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [vatNumber, setVatNumber] = React.useState('')
  const [isVatRegistered, setIsVatRegistered] = React.useState(false)
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null)
  const [fetchingLogo, setFetchingLogo] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Step 1: Search Companies House
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) return
    setSearching(true)
    setSearchResults([])
    try {
      const res = await fetch(`/api/companies-house?q=${encodeURIComponent(search)}`)
      const data = await res.json()
      setSearchResults(data.items || [])
    } catch (err) {
      console.error('Search failed', err)
    } finally {
      setSearching(false)
    }
  }

  // Step 2: Select Company -> Auto-fill Address/VAT & Fetch Logo
  const handleSelectCompany = async (company: CompanySearchItem) => {
    setSelectedCompany(company)
    setCompanyName(company.title)
    
    // Auto-fill Address
    let addr = company.address_snippet
    if (company.address) {
       addr = [
         company.address.premises, 
         company.address.address_line_1, 
         company.address.locality, 
         company.address.postal_code,
         company.address.country
       ].filter(Boolean).join(', ')
    }
    setAddress(addr)
    
    // Auto-fill VAT (Mock logic: odd company numbers are VAT registered)
    const isVat = parseInt(company.company_number) % 2 !== 0
    setIsVatRegistered(isVat)
    setVatNumber(isVat ? `GB${company.company_number}` : '')

    // Fetch Logo
    setFetchingLogo(true)
    try {
      // Use domain derived from company name (simplified)
      const domain = company.title.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
      const res = await fetch(`/api/logo-dev?domain=${domain}`)
      const data = await res.json()
      if (data.url) {
        setLogoUrl(data.url)
      } else {
        setLogoUrl(null)
      }
    } catch (err) {
      console.error('Logo fetch failed', err)
      setLogoUrl(null)
    } finally {
      setFetchingLogo(false)
      setStep(2)
    }
  }

  const handleManualEntry = () => {
    setSelectedCompany(null)
    setCompanyName('')
    setAddress('')
    setLogoUrl(null)
    setStep(2)
  }

  // Step 3: Confirmation & Save
  const handleSave = async () => {
    if (!companyName) {
      setError('Company name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await completeOnboardingAction({
        companyName: companyName,
        address,
        vatRate: isVatRegistered ? 2000 : 0,
        vatNumber: isVatRegistered ? vatNumber : null,
        logoUrl,
        isVatRegistered
      })
      router.push('/quotes') // Redirect to dashboard
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to save organisation details.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 w-full">
          <div 
            className="h-full bg-blueprint transition-all duration-500 ease-out"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blueprint-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-blueprint">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">
              {step === 1 ? 'Find your business' : 'Confirm details'}
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {step === 1 
                ? 'Search Companies House to auto-fill your details.' 
                : 'Review the information and we\'ll set up your account.'}
            </p>
          </div>

          {step === 1 ? (
            /* Step 1: Search */
            <div>
              <form onSubmit={handleSearch} className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Company name or number..."
                  className="w-full h-12 pl-10 pr-4 text-base bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint transition-shadow"
                  autoFocus
                />
                <button 
                  type="submit" 
                  disabled={searching || !search.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blueprint text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-blueprint-700 transition-colors"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 mb-6">
                  {searchResults.map((company) => (
                    <button
                      key={company.company_number}
                      onClick={() => handleSelectCompany(company)}
                      className="w-full text-left p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{company.title}</span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blueprint transition-colors" />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 truncate">{company.address_snippet}</p>
                      <span className="inline-block mt-1.5 text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        #{company.company_number}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              
              {searchResults.length === 0 && search && !searching && (
                 <div className="text-center py-8 text-slate-400 text-sm mb-6">
                    No companies found. Try a different name.
                 </div>
              )}

              <div className="text-center">
                 <button 
                   onClick={handleManualEntry} 
                   className="text-xs text-slate-400 hover:text-slate-600 underline"
                 >
                   Skip search & enter manually
                 </button>
              </div>
            </div>
          ) : (
            /* Step 2: Confirm */
            <div className="space-y-6">
              {/* Logo Preview */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {fetchingLogo ? (
                    <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                  ) : logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Company Logo</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {logoUrl ? 'Auto-fetched from Logo.dev' : 'No logo found automatically'}
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Business Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-20 p-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint resize-none"
                    placeholder="Enter your full business address"
                  />
                </div>

                <div className="flex items-center gap-3">
                   <input 
                     type="checkbox" 
                     id="vat-reg"
                     checked={isVatRegistered}
                     onChange={(e) => setIsVatRegistered(e.target.checked)}
                     className="w-4 h-4 text-blueprint rounded border-slate-300 focus:ring-blueprint"
                   />
                   <label htmlFor="vat-reg" className="text-sm font-medium text-slate-700">
                     Registered for VAT?
                   </label>
                </div>

                {isVatRegistered && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      VAT Number
                    </label>
                    <input
                      type="text"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blueprint/30 focus:border-blueprint"
                      placeholder="GB123456789"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 h-11 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-[2] h-11 px-4 bg-blueprint text-white font-semibold rounded-xl hover:bg-blueprint-700 transition-colors shadow-lg shadow-blueprint/20 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
