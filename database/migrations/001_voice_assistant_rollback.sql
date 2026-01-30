-- Voice Healthcare Assistant Rollback Migration
-- Removes tables and functions created for voice assistant feature
-- Migration: 001_voice_assistant_rollback
-- Created: 2026-01-29

-- ============================================================================
-- DROP TRIGGERS
-- Remove triggers before dropping functions
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_message_count ON conversation_messages;
DROP TRIGGER IF EXISTS trigger_update_notification_timestamp ON worker_notifications;

-- ============================================================================
-- DROP FUNCTIONS
-- Remove trigger functions
-- ============================================================================

DROP FUNCTION IF EXISTS update_conversation_message_count();
DROP FUNCTION IF EXISTS update_notification_timestamp();

-- ============================================================================
-- DROP TABLES
-- Remove tables in reverse order of dependencies
-- ============================================================================

-- Drop worker_notifications (references routing_decisions)
DROP TABLE IF EXISTS worker_notifications CASCADE;

-- Drop routing_decisions (references conversations, conversation_messages, users)
DROP TABLE IF EXISTS routing_decisions CASCADE;

-- Drop conversation_messages (references conversations)
DROP TABLE IF EXISTS conversation_messages CASCADE;

-- Drop conversations (references users)
DROP TABLE IF EXISTS conversations CASCADE;

-- ============================================================================
-- VERIFICATION
-- Confirm tables have been removed
-- ============================================================================

-- Uncomment to verify tables are dropped:
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('conversations', 'conversation_messages', 'routing_decisions', 'worker_notifications');
