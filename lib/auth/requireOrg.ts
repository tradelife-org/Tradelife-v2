import { redirect } from "next/navigation"
import { getUserWithOrg } from "@/lib/auth/getUser"

function isRedirectError(error: unknown) {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'digest' in error &&
    typeof (error as { digest?: string }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}

export async function requireOrg() {
  try {
    const { user, org_id } = await getUserWithOrg()

    if (!user) {
      redirect("/login")
    }

    if (!org_id) {
      redirect("/onboarding")
    }

    return { user, org_id }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }

    console.error('requireOrg failed', error)
    redirect("/onboarding")
  }
}
