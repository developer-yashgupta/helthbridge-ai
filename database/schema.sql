-- HealthBridge AI Database Schema
-- PostgreSQL Database Schema for Production
-- SQLite Schema for Development/Offline

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    user_type VARCHAR(20) DEFAULT 'citizen' CHECK (user_type IN ('citizen', 'asha', 'phc_staff', 'doctor')),
    language VARCHAR(5) DEFAULT 'hi',
    location JSONB,
    abha_id VARCHAR(50),
    medical_history JSONB DEFAULT '[]',
    emergency_contacts JSONB DEFAULT '[]',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Symptom analyses table
CREATE TABLE symptom_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    symptoms JSONB NOT NULL,
    input_type VARCHAR(20) DEFAULT 'text' CHECK (input_type IN ('text', 'voice', 'image')),
    language VARCHAR(5) DEFAULT 'hi',
    patient_age INTEGER,
    patient_gender VARCHAR(10),
    risk_score INTEGER NOT NULL,
    risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('green', 'amber', 'red')),
    analysis_result JSONB NOT NULL,
    ai_confidence DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Healthcare resources table
CREATE TABLE healthcare_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('PHC', 'CHC', 'ASHA', 'HOSPITAL', 'CLINIC')),
    location JSONB NOT NULL, -- {lat, lng, address}
    contact_info JSONB NOT NULL, -- {phone, email, etc}
    services JSONB DEFAULT '[]',
    availability_status VARCHAR(20) DEFAULT 'unknown',
    capacity_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ASHA workers table
CREATE TABLE asha_workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    registration_number VARCHAR(50) UNIQUE,
    coverage_area JSONB NOT NULL,
    experience_years INTEGER,
    languages JSONB DEFAULT '["hi"]',
    specializations JSONB DEFAULT '[]',
    performance_metrics JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient records table
CREATE TABLE patient_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES users(id),
    asha_id UUID REFERENCES asha_workers(id),
    medical_history JSONB DEFAULT '{}',
    current_conditions JSONB DEFAULT '[]',
    medications JSONB DEFAULT '[]',
    allergies JSONB DEFAULT '[]',
    vital_signs JSONB,
    risk_factors JSONB DEFAULT '[]',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ASHA visits table
CREATE TABLE asha_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asha_id UUID REFERENCES asha_workers(id),
    patient_id UUID REFERENCES users(id),
    visit_type VARCHAR(20) DEFAULT 'routine' CHECK (visit_type IN ('routine', 'follow_up', 'emergency', 'referral')),
    symptoms JSONB,
    vital_signs JSONB,
    assessment JSONB,
    treatment_given JSONB,
    referral_made BOOLEAN DEFAULT FALSE,
    referral_details JSONB,
    notes TEXT,
    next_follow_up DATE,
    visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referrals table
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES users(id),
    referring_asha_id UUID REFERENCES asha_workers(id),
    facility_id UUID REFERENCES healthcare_resources(id),
    urgency VARCHAR(20) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
    reason TEXT NOT NULL,
    symptoms JSONB,
    vital_signs JSONB,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
    appointment_time TIMESTAMP,
    outcome JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teleconsultations table
CREATE TABLE teleconsultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES users(id),
    doctor_id UUID REFERENCES users(id),
    asha_id UUID REFERENCES asha_workers(id), -- Optional facilitator
    symptoms JSONB,
    consultation_type VARCHAR(20) DEFAULT 'general',
    scheduled_time TIMESTAMP NOT NULL,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    meeting_link VARCHAR(500),
    consultation_fee DECIMAL(10,2),
    diagnosis TEXT,
    prescription JSONB,
    follow_up_instructions TEXT,
    next_appointment TIMESTAMP,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Digital prescriptions table
CREATE TABLE digital_prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES teleconsultations(id),
    patient_id UUID REFERENCES users(id),
    doctor_id UUID REFERENCES users(id),
    diagnosis TEXT NOT NULL,
    medications JSONB NOT NULL,
    instructions TEXT,
    valid_until DATE,
    is_dispensed BOOLEAN DEFAULT FALSE,
    dispensed_at TIMESTAMP,
    dispensed_by VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Health alerts table
CREATE TABLE health_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    target_audience JSONB, -- {user_types: [], locations: [], age_groups: []}
    language VARCHAR(5) DEFAULT 'hi',
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User notifications table
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    sent_via JSONB DEFAULT '[]', -- ['app', 'sms', 'voice']
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Offline sync queue table
CREATE TABLE offline_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    data JSONB NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP
);

-- Analytics and metrics table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(100),
    user_agent TEXT,
    ip_address INET,
    location JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System configuration table
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_symptom_analyses_user_id ON symptom_analyses(user_id);
CREATE INDEX idx_symptom_analyses_created_at ON symptom_analyses(created_at);
CREATE INDEX idx_symptom_analyses_risk_level ON symptom_analyses(risk_level);
CREATE INDEX idx_healthcare_resources_type ON healthcare_resources(type);
CREATE INDEX idx_healthcare_resources_location ON healthcare_resources USING GIN(location);
CREATE INDEX idx_asha_workers_user_id ON asha_workers(user_id);
CREATE INDEX idx_asha_visits_asha_id ON asha_visits(asha_id);
CREATE INDEX idx_asha_visits_patient_id ON asha_visits(patient_id);
CREATE INDEX idx_asha_visits_date ON asha_visits(visit_date);
CREATE INDEX idx_referrals_patient_id ON referrals(patient_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_teleconsultations_patient_id ON teleconsultations(patient_id);
CREATE INDEX idx_teleconsultations_doctor_id ON teleconsultations(doctor_id);
CREATE INDEX idx_teleconsultations_scheduled_time ON teleconsultations(scheduled_time);
CREATE INDEX idx_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_notifications_is_read ON user_notifications(is_read);
CREATE INDEX idx_sync_queue_status ON offline_sync_queue(sync_status);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);

-- Insert default system configuration
INSERT INTO system_config (key, value, description) VALUES
('app_version', '"1.0.0"', 'Current app version'),
('maintenance_mode', 'false', 'System maintenance mode'),
('supported_languages', '["hi", "en", "ta", "te", "bn", "gu", "mr"]', 'Supported languages'),
('emergency_numbers', '{"ambulance": "108", "police": "100", "fire": "101"}', 'Emergency contact numbers'),
('ai_model_version', '"1.0"', 'Current AI model version'),
('offline_sync_interval', '300', 'Offline sync interval in seconds'),
('max_symptom_history', '50', 'Maximum symptom history records per user');

-- Insert sample healthcare resources
INSERT INTO healthcare_resources (id, name, type, location, contact_info, services) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Primary Health Centre Rampur', 'PHC', 
 '{"lat": 28.6139, "lng": 77.2090, "address": "Village Rampur, Block Sohna, Gurugram"}',
 '{"phone": "+91-9876543210", "email": "phc.rampur@gov.in"}',
 '["general_medicine", "maternal_care", "vaccination", "emergency_care"]'),
 
('550e8400-e29b-41d4-a716-446655440002', 'Community Health Centre Sohna', 'CHC',
 '{"lat": 28.2500, "lng": 77.0667, "address": "Sohna Road, Gurugram"}',
 '{"phone": "+91-9876543211", "email": "chc.sohna@gov.in"}',
 '["emergency", "surgery", "specialist_consultation", "laboratory", "radiology"]');

-- Insert sample health alerts
INSERT INTO health_alerts (alert_type, title, message, severity, target_audience, language) VALUES
('disease_outbreak', 'डेंगू की रोकथाम', 'बारिश के मौसम में डेंगू से बचाव के लिए पानी जमा न होने दें। बुखार होने पर तुरंत डॉक्टर से मिलें।', 'high', 
 '{"user_types": ["citizen"], "locations": ["rural"], "age_groups": ["all"]}', 'hi'),
 
('vaccination_reminder', 'बच्चों का टीकाकरण', 'अपने बच्चों का समय पर टीकाकरण कराना न भूलें। नजदीकी PHC से संपर्क करें।', 'medium',
 '{"user_types": ["citizen"], "locations": ["all"], "age_groups": ["0-5"]}', 'hi'),
 
('health_tip', 'स्वच्छता का महत्व', 'कोविड-19 से बचाव के लिए बार-बार हाथ धोएं, मास्क पहनें और सामाजिक दूरी बनाए रखें।', 'medium',
 '{"user_types": ["all"], "locations": ["all"], "age_groups": ["all"]}', 'hi');