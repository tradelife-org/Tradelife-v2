"""Static regression checks for onboarding stabilisation + Xero callback scope."""

from pathlib import Path


ROOT = Path("/app")


def _read(rel_path: str) -> str:
    return (ROOT / rel_path).read_text(encoding="utf-8")


def test_xero_callback_exports_force_dynamic_without_route_logic_loss():
    # Module: /app/app/api/xero/callback/route.ts
    content = _read("app/api/xero/callback/route.ts")

    assert "export const dynamic = 'force-dynamic'" in content
    assert "export async function GET(req: NextRequest)" in content
    assert "handleXeroCallback(req.url)" in content
    assert '"/settings?xero=connected"' in content
    assert '"/settings?error=xero_failed"' in content


def test_get_user_returns_null_on_auth_and_unexpected_failures():
    # Module: /app/lib/auth/getUser.ts
    content = _read("lib/auth/getUser.ts")

    assert "export async function getUser()" in content
    assert "try {" in content
    assert "if (error) {" in content
    assert "return null" in content
    assert "Unexpected error while fetching authenticated user" in content
    assert "return user ?? null" in content


def test_require_org_redirects_safely_and_does_not_throw_raw_errors():
    # Module: /app/lib/auth/requireOrg.ts
    content = _read("lib/auth/requireOrg.ts")

    assert "export async function requireOrg()" in content
    assert "const { user, org_id } = await getUserWithOrg()" in content
    assert 'redirect("/login")' in content
    assert 'redirect("/onboarding")' in content
    assert "catch (error)" in content
    assert "throw new Error" not in content


def test_onboarding_action_has_controlled_failures_for_missing_auth_or_org_repairs():
    # Module: /app/lib/actions/onboarding.ts
    content = _read("lib/actions/onboarding.ts")

    assert "async function ensureValidOrganisation" in content
    assert "if (userError)" in content
    assert "return { success: false, error: 'Unauthorized' }" in content
    assert "let orgId = await ensureValidOrganisation(user, input.companyName)" in content
    assert "if (!orgId)" in content
    assert "Unable to create organisation" in content
    assert "Unable to repair organisation" in content
    assert "Unable to update profile" in content
    assert "return { success: true }" in content


def test_import_review_page_has_safe_fallbacks_and_tolerates_schedule_query_errors():
    # Module: /app/app/onboarding/import-review/page.tsx
    content = _read("app/onboarding/import-review/page.tsx")

    assert "const { user, org_id, profile } = await getUserWithOrg()" in content
    assert "if (!user)" in content
    assert "redirect('/login')" in content
    assert "if (!org_id)" in content
    assert "if (!profile?.onboarding_completed)" in content
    assert "Finish onboarding to review imported schedules." in content
    assert "if (error)" in content
    assert "console.error('Failed to load import review schedules', error)" in content
    assert "<ImportReview schedules={schedules || []} />" in content
