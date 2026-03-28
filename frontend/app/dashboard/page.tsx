import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  // Initialize Supabase client
  let supabase
  try {
    supabase = await createClient()
  } catch {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center p-8" data-testid="dashboard-error">
          <p className="text-red-600">Failed to initialize service</p>
        </div>
      </main>
    )
  }

  if (!supabase) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center p-8" data-testid="dashboard-error">
          <p className="text-red-600">Service unavailable</p>
        </div>
      </main>
    )
  }

  // Get authenticated user
  let user
  try {
    const { data, error: userError } = await supabase.auth.getUser()
    if (userError || !data?.user) {
      redirect('/login?next=/dashboard')
    }
    user = data.user
  } catch {
    redirect('/login?next=/dashboard')
  }

  if (!user || !user.id) {
    redirect('/login?next=/dashboard')
  }

  // Fetch profile
  let profile
  try {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('id, org_id, onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profileError || !data) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center p-8" data-testid="dashboard-error">
            <p className="text-red-600">Profile not found</p>
            <a href="/login" className="text-blue-600 hover:underline mt-4 inline-block">
              Return to login
            </a>
          </div>
        </main>
      )
    }
    profile = data
  } catch {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center p-8" data-testid="dashboard-error">
          <p className="text-red-600">Failed to load profile</p>
        </div>
      </main>
    )
  }

  // Redirect if onboarding not completed
  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  // Fetch organisation
  let organisation = null
  if (profile.org_id) {
    try {
      const { data, error: orgError } = await supabase
        .from('organisations')
        .select('id, name')
        .eq('id', profile.org_id)
        .single()

      if (!orgError && data) {
        organisation = data
      }
    } catch {
      // Organisation fetch failed - continue with null
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6" data-testid="dashboard">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="dashboard-welcome">
            Welcome, {user.email}
          </h1>
        </header>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h2>
          
          <dl className="space-y-4">
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-gray-600">Organisation</dt>
              <dd className="text-gray-900 font-medium" data-testid="dashboard-org-name">
                {organisation?.name || 'Not set'}
              </dd>
            </div>

            <div className="flex justify-between border-b border-gray-100 pb-3">
              <dt className="text-gray-600">Onboarding Complete</dt>
              <dd data-testid="dashboard-onboarding-status">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {profile.onboarding_completed ? 'true' : 'false'}
                </span>
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-gray-600">Email</dt>
              <dd className="text-gray-900" data-testid="dashboard-email">
                {user.email}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  )
}
