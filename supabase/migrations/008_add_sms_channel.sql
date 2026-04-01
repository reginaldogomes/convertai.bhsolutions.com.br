-- ============================================================
-- 008: Add SMS channel and campaign channel support
-- Multi-channel communication: Email, WhatsApp, SMS
-- ============================================================

-- 1. Add 'sms' to message_channel type
-- Since PostgreSQL enums can't be altered in a transaction-safe way easily,
-- we use ALTER TYPE ... ADD VALUE which is safe for adding new values
DO $$
BEGIN
    -- Check if 'sms' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'sms'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'message_channel')
    ) THEN
        ALTER TYPE message_channel ADD VALUE 'sms';
    END IF;
END $$;

-- 2. Add channel column to campaigns (default 'email' for backward compatibility)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'email';

-- 3. Add CHECK constraint for valid campaign channels
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_channel_check'
    ) THEN
        ALTER TABLE campaigns ADD CONSTRAINT campaigns_channel_check
            CHECK (channel IN ('email', 'sms', 'whatsapp'));
    END IF;
END $$;
