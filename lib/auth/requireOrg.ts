import { redirect } from "next/navigation"
import { getUserWithOrg } from "@/lib/auth/getUser"

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
    console.error('requireOrg failed', error)
    redirect("/onboarding")
  }
}
