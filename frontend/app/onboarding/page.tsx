import { redirect } from 'next/navigation'
import { checkOnboardingStatus } from '@/lib/actions/onboarding'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const { authenticated, onboardingCompleted } = await checkOnboardingStatus()

  // Protection: redirect if not logged in
  if (!authenticated) {
    redirect('/login?next=/onboarding')
  }

  // Protection: redirect if already onboarded
  if (onboardingCompleted === true) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-900">
          Welcome to TradeLife
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Let&apos;s set up your business
        </p>

        <OnboardingForm />
      </div>
    </main>
  )
}
