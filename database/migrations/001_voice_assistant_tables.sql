-- Voice Healthcare Assistant Migration
-- Adds tables for conversations, messages, routing decisions, and worker notifications
-- Migration: 001_voice_assistant_tables
-- Created: 2026-01-29

-- ============================================================================
-- CONVERSATIONS TABLE
-- Stores voice assistant conversation sessions
-- ============================================================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    title VARCHAR(200),
    language VARCHAR(5) DEFAULT 'hi',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    metadata JSONB DEFAULT '{}'
);

-- Indexes for conversations table
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_status ON conversations(status);

-- ============================================================================
-- CONVERSATION MESSAGES TABLE
-- Stores individual messages within conversations
-- ============================================================================
CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'voice')),
    voice_duration INTEGER, -- in seconds, if voice message
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Indexes for conversation_messages table
CREATE INDEX idx_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_messages_created_at ON conversation_messages(created_at);
CREATE INDEX idx_messages_role ON conversation_messages(role);

-- ============================================================================
-- ROUTING DECISIONS TABLE
-- Stores AI-generated routing decisions for healthcare facility recommendations
-- ============================================================================
CREATE TABLE routing_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    message_id UUID REFERENCES conversation_messages(id),
    user_id UUID REFERENCES users(id),
    symptoms JSONB NOT NULL,
    severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    severity_score INTEGER NOT NULL CHECK (severity_score >= 0 AND severity_score <= 100),
    recommended_facility VARCHAR(20) NOT NULL CHECK (recommended_facility IN ('ASHA', 'PHC', 'CHC', 'EMERGENCY')),
    facility_id UUID REFERENCES healthcare_resources(id),
    reasoning TEXT NOT NULL,
    ai_confidence DECIMAL(3,2),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    timeframe VARCHAR(50), -- e.g., 'immediate', 'within_4_hours', 'within_24_hours'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for routing_decisions table
CREATE INDEX idx_routing_user_id ON routing_decisions(user_id);
CREATE INDEX idx_routing_conversation_id ON routing_decisions(conversation_id);
CREATE INDEX idx_routing_severity ON routing_decisions(severity_level);
CREATE INDEX idx_routing_facility ON routing_decisions(recommended_facility);
CREATE INDEX idx_routing_created_at ON routing_decisions(created_at DESC);
CREATE INDEX idx_routing_priority ON routing_decisions(priority);

-- ============================================================================
-- WORKER NOTIFICATIONS TABLE
-- Stores notifications sent to healthcare workers when patients are referred
-- ============================================================================
CREATE TABLE worker_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES users(id) NOT NULL,
    worker_type VARCHAR(20) NOT NULL CHECK (worker_type IN ('asha', 'phc_staff', 'chc_staff', 'emergency')),
    patient_id UUID REFERENCES users(id) NOT NULL,
    routing_decision_id UUID REFERENCES routing_decisions(id),
    notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('new_referral', 'urgent_case', 'follow_up', 'emergency')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    patient_summary JSONB NOT NULL, -- {symptoms, age, gender, location, contact}
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'responded', 'completed', 'cancelled')),
    acknowledged_at TIMESTAMP,
    response_text TEXT,
    sent_via JSONB DEFAULT '["app"]', -- ['app', 'sms', 'call']
    delivery_status JSONB DEFAULT '{}', -- {app: 'delivered', sms: 'sent', etc}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for worker_notifications table
CREATE INDEX idx_worker_notif_worker_id ON worker_notifications(worker_id);
CREATE INDEX idx_worker_notif_patient_id ON worker_notifications(patient_id);
CREATE INDEX idx_worker_notif_status ON worker_notifications(status);
CREATE INDEX idx_worker_notif_priority ON worker_notifications(priority);
CREATE INDEX idx_worker_notif_created ON worker_notifications(created_at DESC);
CREATE INDEX idx_worker_notif_type ON worker_notifications(notification_type);
CREATE INDEX idx_worker_notif_worker_type ON worker_notifications(worker_type);

-- ============================================================================
-- TRIGGERS
-- Automatically update timestamps and counts
-- ============================================================================

-- Trigger to update conversation message count
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET message_count = message_count + 1,
        last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_message_count
AFTER INSERT ON conversation_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_message_count();

-- Trigger to update worker_notifications updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_timestamp
BEFORE UPDATE ON worker_notifications
FOR EACH ROW
EXECUTE FUNCTION update_notification_timestamp();

-- ============================================================================
-- COMMENTS
-- Add table and column descriptions for documentation
-- ============================================================================

COMMENT ON TABLE conversations IS 'Stores voice assistant conversation sessions with users';
COMMENT ON TABLE conversation_messages IS 'Individual messages within voice assistant conversations';
COMMENT ON TABLE routing_decisions IS 'AI-generated healthcare facility routing recommendations';
COMMENT ON TABLE worker_notifications IS 'Notifications sent to healthcare workers for patient referrals';

COMMENT ON COLUMN conversations.title IS 'Auto-generated or user-defined conversation title';
COMMENT ON COLUMN conversations.metadata IS 'Additional conversation metadata (device info, session data, etc)';
COMMENT ON COLUMN conversation_messages.voice_duration IS 'Duration in seconds if message was voice input';
COMMENT ON COLUMN routing_decisions.severity_score IS 'Numerical severity score from 0-100';
COMMENT ON COLUMN routing_decisions.timeframe IS 'Recommended timeframe for seeking care';
COMMENT ON COLUMN worker_notifications.patient_summary IS 'JSON containing patient symptoms, demographics, and contact info';
COMMENT ON COLUMN worker_notifications.sent_via IS 'Array of delivery channels used (app, sms, call)';
