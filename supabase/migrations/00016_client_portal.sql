-- Migration: 00016_client_portal.sql
-- Purpose: Client Portal Access & Messaging
-- Standard: ORG_ID RLS

-- ============================================================================
-- TABLE: user_availability (For Out-of-Hours Auto-Response)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_availability (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    start_time      TIME NOT NULL DEFAULT '09:00',
    end_time        TIME NOT NULL DEFAULT '17:00',
    timezone        TEXT NOT NULL DEFAULT 'Europe/London',
    auto_reply_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id)
);

ALTER TABLE user_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON user_availability FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON user_availability FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON user_availability FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON user_availability FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_user_availability_updated_at BEFORE UPDATE ON user_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: portal_invites (Secure Token Access)
-- ============================================================================

CREATE TABLE IF NOT EXISTS portal_invites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    token           TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_invites_token ON portal_invites(token);
CREATE INDEX IF NOT EXISTS idx_portal_invites_client_id ON portal_invites(client_id);

ALTER TABLE portal_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON portal_invites FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON portal_invites FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON portal_invites FOR DELETE USING (org_id = get_user_org_id());

-- Public Access Policy (for verifying token)
CREATE POLICY "Public token verify" ON portal_invites FOR SELECT USING (true); 

-- ============================================================================
-- TABLE: portal_conversations (Messaging Threads)
-- ============================================================================

CREATE TABLE IF NOT EXISTS portal_conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title           TEXT,
    status          TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, ARCHIVED
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE portal_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON portal_conversations FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON portal_conversations FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON portal_conversations FOR UPDATE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_portal_conversations_updated_at BEFORE UPDATE ON portal_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: portal_messages (Individual Messages)
-- ============================================================================

CREATE TABLE IF NOT EXISTS portal_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES portal_conversations(id) ON DELETE CASCADE,
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    sender_type     TEXT NOT NULL CHECK (sender_type IN ('ORG', 'CLIENT', 'SYSTEM', 'AI')),
    content         TEXT NOT NULL,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_messages_conversation_id ON portal_messages(conversation_id);

ALTER TABLE portal_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON portal_messages FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON portal_messages FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- ============================================================================
-- PUBLIC ACCESS FUNCTIONS (Security Definer)
-- ============================================================================

-- Function to get portal data via token without auth
CREATE OR REPLACE FUNCTION get_portal_data(p_token TEXT)
RETURNS TABLE (
    client_id UUID,
    org_id UUID,
    client_name TEXT,
    org_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.client_id,
        pi.org_id,
        c.name as client_name,
        o.name as org_name
    FROM portal_invites pi
    JOIN clients c ON c.id = pi.client_id
    JOIN organisations o ON o.id = pi.org_id
    WHERE pi.token = p_token
    AND pi.expires_at > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fetch messages for a token (Public)
CREATE OR REPLACE FUNCTION get_portal_messages(p_token TEXT)
RETURNS TABLE (
    id UUID,
    sender_type TEXT,
    content TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_client_id UUID;
    v_org_id UUID;
BEGIN
    -- Verify token
    SELECT client_id, org_id INTO v_client_id, v_org_id
    FROM portal_invites
    WHERE token = p_token AND expires_at > now();

    IF v_client_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT m.id, m.sender_type, m.content, m.created_at
    FROM portal_messages m
    JOIN portal_conversations c ON c.id = m.conversation_id
    WHERE c.client_id = v_client_id
    ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to post message from portal (Public)
CREATE OR REPLACE FUNCTION post_portal_message(p_token TEXT, p_content TEXT)
RETURNS UUID AS $$
DECLARE
    v_client_id UUID;
    v_org_id UUID;
    v_conversation_id UUID;
    v_msg_id UUID;
BEGIN
    -- Verify token
    SELECT client_id, org_id INTO v_client_id, v_org_id
    FROM portal_invites
    WHERE token = p_token AND expires_at > now();

    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired token';
    END IF;

    -- Get or create conversation
    SELECT id INTO v_conversation_id FROM portal_conversations
    WHERE client_id = v_client_id AND status = 'OPEN' LIMIT 1;

    IF v_conversation_id IS NULL THEN
        INSERT INTO portal_conversations (org_id, client_id, title)
        VALUES (v_org_id, v_client_id, 'Portal Chat')
        RETURNING id INTO v_conversation_id;
    END IF;

    -- Insert message
    INSERT INTO portal_messages (conversation_id, org_id, sender_type, content)
    VALUES (v_conversation_id, v_org_id, 'CLIENT', p_content)
    RETURNING id INTO v_msg_id;

    RETURN v_msg_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
