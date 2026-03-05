-- Migration: 00012_assistant.sql
-- Purpose: Store AI assistant conversations and context
-- Standard: ORG_ID RLS

CREATE TABLE IF NOT EXISTS ai_conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title           TEXT,
    context_type    TEXT, -- e.g., 'quote', 'job', 'general'
    context_id      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content         TEXT NOT NULL,
    tokens_used     INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_org_id ON ai_conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_org_id ON ai_messages(org_id);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS
CREATE POLICY "Org isolation select" ON ai_conversations FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON ai_conversations FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON ai_conversations FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON ai_conversations FOR DELETE USING (org_id = get_user_org_id());

-- Messages RLS
CREATE POLICY "Org isolation select" ON ai_messages FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON ai_messages FOR INSERT WITH CHECK (org_id = get_user_org_id());
-- Messages are typically append-only log, but allow update/delete for cleanup
CREATE POLICY "Org isolation update" ON ai_messages FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON ai_messages FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
