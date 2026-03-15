import { requireOrg } from "@/lib/auth/requireOrg"

export default async function DashboardPage() {

  const { user, org_id } = await requireOrg()

  return (
    <div>
      <h1>TradeLife Dashboard</h1>
      <p>Organisation: {org_id}</p>
    </div>
  )
}
