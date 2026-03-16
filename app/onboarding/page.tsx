const handleCreateOrganisation = async () => {

  console.log("STEP 1: starting onboarding")

  const { data: userData, error: userError } = await supabase.auth.getUser()

  console.log("STEP 2: user", userData, userError)

  if (!userData?.user) {
    alert("No user session")
    return
  }

  const user = userData.user

  const { data: org, error: orgError } = await supabase
    .from("organisations")
    .insert({
      name: businessName
    })
    .select()
    .single()

  console.log("STEP 3: org result", org, orgError)

  if (orgError) {
    alert("Org creation failed")
    console.error(orgError)
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

  console.log("STEP 4: profile update", profileError)

  if (profileError) {
    alert("Profile update failed")
    console.error(profileError)
    return
  }

  console.log("STEP 5: redirecting")

  window.location.href = "/dashboard"
}