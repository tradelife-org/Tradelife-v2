import { createClient } from '@supabase/supabase-js'

export default async function ProposalTokenPage({ params }: { params: { token: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('token', params.token)
    .single()

  if (error || !data) {
    return <div>Proposal not found</div>
  }

  return (
    <div>
      <h1>Proposal</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
