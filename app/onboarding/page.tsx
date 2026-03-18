import { redirect } from 'next/navigation'

import { completeOnboardingAction } from '@/lib/actions/onboarding'
import { getUserWithOrg } from '@/lib/auth/getUser'

export default async function OnboardingPage() {
  let authState: Awaited<ReturnType<typeof getUserWithOrg>> | null = null

  try {
    authState = await getUserWithOrg()
  } catch (error) {
    console.error('Failed to load onboarding page state', error)
    return <div>Setting up your workspace...</div>
  }

  if (!authState?.user) {
    redirect('/login')
  }

  if (authState.profile?.onboarding_completed) {
    redirect('/dashboard')
  }

  async function submitOnboarding(formData: FormData) {
    'use server'

    const result = await completeOnboardingAction({
      companyName: String(formData.get('companyName') || '').trim(),
      companyNumber: String(formData.get('companyNumber') || '').trim() || null,
      address: String(formData.get('address') || '').trim(),
      vatRate: Number(formData.get('vatRate') || 2000),
      vatNumber: String(formData.get('vatNumber') || '').trim() || null,
      logoUrl: String(formData.get('logoUrl') || '').trim() || null,
      isVatRegistered: formData.get('isVatRegistered') === 'on',
    })

    if (result?.success) {
      redirect('/dashboard')
    }

    redirect('/onboarding')
  }

  return (
    <main>
      <h1>Onboarding</h1>

      {!authState.org_id && <p>Setting up your workspace...</p>}

      <p>Complete a few details to finish setting up your workspace.</p>

      <form action={submitOnboarding}>
        <div>
          <label htmlFor="companyName">Company name</label>
          <input id="companyName" name="companyName" type="text" required />
        </div>

        <div>
          <label htmlFor="companyNumber">Company number</label>
          <input id="companyNumber" name="companyNumber" type="text" />
        </div>

        <div>
          <label htmlFor="address">Address</label>
          <textarea id="address" name="address" rows={4} />
        </div>

        <div>
          <label htmlFor="vatRate">VAT rate</label>
          <input id="vatRate" name="vatRate" type="number" defaultValue={2000} />
        </div>

        <div>
          <label htmlFor="vatNumber">VAT number</label>
          <input id="vatNumber" name="vatNumber" type="text" />
        </div>

        <div>
          <label htmlFor="logoUrl">Logo URL</label>
          <input id="logoUrl" name="logoUrl" type="url" />
        </div>

        <div>
          <label htmlFor="isVatRegistered">VAT registered</label>
          <input id="isVatRegistered" name="isVatRegistered" type="checkbox" />
        </div>

        <button type="submit">Continue</button>
      </form>
    </main>
  )
}
