const handleCreateOrganisation = async () => {
  if (!businessName) return

  setLoading(true)

  const { data: userData } = await supabase.auth.getUser()

  const user = userData?.user

  if (!user) {
    setLoading(false)
    return
  }

  const { data: org, error: orgError } = await supabase
    .from("organisations")
    .insert({
      name: businessName
    })
    .select()
    .single()

  if (orgError) {
    console.error("Org creation failed:", orgError)
    setLoading(false)
    return
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      org_id: org.id,
      active_org_id: org.id,
      onboarding_completed: true
    })
    .eq("id", user.id)

  if (profileError) {
    console.error("Profile update failed:", profileError)
    setLoading(false)
    return
  }

  router.push("/dashboard")
}