-- Voice Healthcare Assistant Seed Data
-- Test data for development and testing
-- Migration: 001_voice_assistant_seed_data
-- Created: 2026-01-29

-- ============================================================================
-- SAMPLE USERS
-- Create test users for different roles
-- ============================================================================

-- Insert test citizen users if they don't exist
INSERT INTO users (id, phone, name, user_type, language, location, medical_history, created_at)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', '+919876543201', 'Rajesh Kumar', 'citizen', 'hi', 
     '{"lat": 28.6139, "lng": 77.2090, "address": "Village Rampur, Gurugram"}',
     '[{"condition": "diabetes", "diagnosed": "2020-01-15"}, {"condition": "hypertension", "diagnosed": "2019-06-20"}]',
     CURRENT_TIMESTAMP - INTERVAL '6 months'),
    
    ('a0000000-0000-0000-0000-000000000002', '+919876543202', 'Priya Sharma', 'citizen', 'hi',
     '{"lat": 28.6200, "lng": 77.2100, "address": "Village Sohna, Gurugram"}',
     '[]',
     CURRENT_TIMESTAMP - INTERVAL '3 months'),
    
    ('a0000000-0000-0000-0000-000000000003', '+919876543203', 'Amit Patel', 'citizen', 'en',
     '{"lat": 28.6150, "lng": 77.2080, "address": "Village Badshahpur, Gurugram"}',
     '[{"condition": "asthma", "diagnosed": "2018-03-10"}]',
     CURRENT_TIMESTAMP - INTERVAL '1 year')
ON CONFLICT (phone) DO NOTHING;

-- Insert test ASHA workers
INSERT INTO users (id, phone, name, user_type, language, location, created_at)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', '+919876543211', 'Sunita Devi', 'asha', 'hi',
     '{"lat": 28.6139, "lng": 77.2090, "address": "PHC Rampur, Gurugram"}',
     CURRENT_TIMESTAMP - INTERVAL '2 years'),
    
    ('b0000000-0000-0000-0000-000000000002', '+919876543212', 'Meena Kumari', 'asha', 'hi',
     '{"lat": 28.6200, "lng": 77.2100, "address": "PHC Sohna, Gurugram"}',
     CURRENT_TIMESTAMP - INTERVAL '3 years')
ON CONFLICT (phone) DO NOTHING;

-- Insert test PHC staff
INSERT INTO users (id, phone, name, user_type, language, location, created_at)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', '+919876543221', 'Dr. Ramesh Singh', 'phc_staff', 'hi',
     '{"lat": 28.6139, "lng": 77.2090, "address": "PHC Rampur, Gurugram"}',
     CURRENT_TIMESTAMP - INTERVAL '5 years')
ON CONFLICT (phone) DO NOTHING;

-- ============================================================================
-- SAMPLE CONVERSATIONS
-- Create test conversation sessions
-- ============================================================================

INSERT INTO conversations (id, user_id, title, language, started_at, last_message_at, message_count, status)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 
     'Fever and headache consultation', 'hi', 
     CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days', 4, 'archived'),
    
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002',
     'Stomach pain inquiry', 'hi',
     CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day', 6, 'active'),
    
    ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003',
     'Chest pain emergency', 'en',
     CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours', 3, 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE CONVERSATION MESSAGES
-- Create test messages within conversations
-- ============================================================================

-- Conversation 1: Fever and headache (Low severity - ASHA)
INSERT INTO conversation_messages (id, conversation_id, role, content, content_type, created_at)
VALUES 
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'user',
     'मुझे बुखार और सिर दर्द है। क्या करूं?', 'voice',
     CURRENT_TIMESTAMP - INTERVAL '2 days'),
    
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'assistant',
     'मैं समझता हूं कि आपको बुखार और सिर दर्द है। कृपया बताएं कि बुखार कितने दिनों से है और तापमान कितना है?', 'text',
     CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '5 seconds'),
    
    ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'user',
     'बुखार 2 दिन से है, 100 डिग्री के आसपास है।', 'voice',
     CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '30 seconds'),
    
    ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'assistant',
     'आपके लक्षणों के आधार पर, यह सामान्य वायरल बुखार हो सकता है। मैं आपको अपने नजदीकी ASHA कार्यकर्ता से मिलने की सलाह देता हूं। वे आपकी जांच करेंगी और आवश्यक दवाई देंगी।', 'text',
     CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '35 seconds')
ON CONFLICT (id) DO NOTHING;

-- Conversation 2: Stomach pain (Medium severity - PHC)
INSERT INTO conversation_messages (id, conversation_id, role, content, content_type, created_at)
VALUES 
    ('e0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000002', 'user',
     'मेरे पेट में बहुत दर्द हो रहा है और उल्टी भी हो रही है।', 'voice',
     CURRENT_TIMESTAMP - INTERVAL '1 day'),
    
    ('e0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000002', 'assistant',
     'पेट दर्द और उल्टी गंभीर हो सकती है। कृपया बताएं कि दर्द कब से है और कितना तेज है?', 'text',
     CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '5 seconds'),
    
    ('e0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000002', 'user',
     'दर्द सुबह से है, बहुत तेज है। 3 बार उल्टी हो चुकी है।', 'voice',
     CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '25 seconds'),
    
    ('e0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000002', 'assistant',
     'आपके लक्षण मध्यम गंभीर हैं। मैं आपको तुरंत Primary Health Centre (PHC) जाने की सलाह देता हूं। वहां डॉक्टर आपकी जांच करेंगे।', 'text',
     CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '30 seconds')
ON CONFLICT (id) DO NOTHING;

-- Conversation 3: Chest pain (Critical severity - Emergency)
INSERT INTO conversation_messages (id, conversation_id, role, content, content_type, created_at)
VALUES 
    ('e0000000-0000-0000-0000-000000000021', 'd0000000-0000-0000-0000-000000000003', 'user',
     'I have severe chest pain and difficulty breathing.', 'voice',
     CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    
    ('e0000000-0000-0000-0000-000000000022', 'd0000000-0000-0000-0000-000000000003', 'assistant',
     '⚠️ EMERGENCY: Your symptoms indicate a potentially serious condition. Please call 108 immediately for an ambulance or go to the nearest emergency room right away. Do not delay!', 'text',
     CURRENT_TIMESTAMP - INTERVAL '3 hours' + INTERVAL '3 seconds'),
    
    ('e0000000-0000-0000-0000-000000000023', 'd0000000-0000-0000-0000-000000000003', 'system',
     'Emergency services have been notified. Help is on the way.', 'text',
     CURRENT_TIMESTAMP - INTERVAL '3 hours' + INTERVAL '10 seconds')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE ROUTING DECISIONS
-- Create test routing recommendations
-- ============================================================================

INSERT INTO routing_decisions (id, conversation_id, message_id, user_id, symptoms, severity_level, severity_score, 
                               recommended_facility, facility_id, reasoning, ai_confidence, priority, timeframe, created_at)
VALUES 
    -- Low severity - ASHA
    ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 
     'e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
     '["fever", "headache", "mild_symptoms"]', 'low', 35, 'ASHA', NULL,
     'Based on the symptoms of mild fever (100°F) and headache for 2 days, this appears to be a common viral infection. An ASHA worker can provide initial assessment and basic treatment.',
     0.85, 'low', 'within_24_hours', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    
    -- Medium severity - PHC
    ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002',
     'e0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000002',
     '["severe_abdominal_pain", "vomiting", "dehydration_risk"]', 'medium', 55, 'PHC', 
     '550e8400-e29b-41d4-a716-446655440001',
     'Severe abdominal pain with multiple episodes of vomiting requires medical evaluation. PHC can provide proper diagnosis and treatment to prevent complications.',
     0.78, 'medium', 'within_4_hours', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    
    -- Critical severity - Emergency
    ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003',
     'e0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000003',
     '["chest_pain", "difficulty_breathing", "cardiac_emergency"]', 'critical', 95, 'EMERGENCY',
     '550e8400-e29b-41d4-a716-446655440002',
     'Chest pain with breathing difficulty is a medical emergency that could indicate heart attack or other life-threatening conditions. Immediate emergency care is required.',
     0.92, 'critical', 'immediate', CURRENT_TIMESTAMP - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE WORKER NOTIFICATIONS
-- Create test notifications for healthcare workers
-- ============================================================================

INSERT INTO worker_notifications (id, worker_id, worker_type, patient_id, routing_decision_id, 
                                 notification_type, priority, title, message, patient_summary, 
                                 status, sent_via, created_at)
VALUES 
    -- ASHA notification for low severity case
    ('g0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'asha',
     'a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
     'new_referral', 'low', 'New Patient Referral - Fever Case',
     'A patient in your area has been referred to you for fever and headache symptoms.',
     '{"name": "Rajesh Kumar", "age": 45, "gender": "male", "phone": "+919876543201", 
       "symptoms": ["fever", "headache"], "duration": "2 days", "temperature": "100°F",
       "location": "Village Rampur, Gurugram", "medical_history": ["diabetes", "hypertension"]}',
     'acknowledged', '["app", "sms"]', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    
    -- PHC notification for medium severity case
    ('g0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'phc_staff',
     'a0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002',
     'urgent_case', 'medium', 'Urgent Patient - Severe Abdominal Pain',
     'A patient with severe abdominal pain and vomiting needs immediate medical attention at PHC.',
     '{"name": "Priya Sharma", "age": 32, "gender": "female", "phone": "+919876543202",
       "symptoms": ["severe_abdominal_pain", "vomiting"], "duration": "since_morning", "vomit_count": 3,
       "location": "Village Sohna, Gurugram", "medical_history": []}',
     'pending', '["app", "sms"]', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    
    -- Emergency notification for critical case
    ('g0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'emergency',
     'a0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003',
     'emergency', 'critical', '🚨 EMERGENCY - Chest Pain Patient',
     'CRITICAL: Patient with chest pain and breathing difficulty. Ambulance dispatched.',
     '{"name": "Amit Patel", "age": 58, "gender": "male", "phone": "+919876543203",
       "symptoms": ["chest_pain", "difficulty_breathing"], "severity": "critical",
       "location": "Village Badshahpur, Gurugram", "medical_history": ["asthma"]}',
     'acknowledged', '["app", "sms", "call"]', CURRENT_TIMESTAMP - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Update acknowledged notification
UPDATE worker_notifications 
SET acknowledged_at = CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '15 minutes',
    response_text = 'Patient visited. Prescribed paracetamol and advised rest. Will follow up in 2 days.'
WHERE id = 'g0000000-0000-0000-0000-000000000001';

UPDATE worker_notifications 
SET acknowledged_at = CURRENT_TIMESTAMP - INTERVAL '3 hours' + INTERVAL '5 minutes',
    response_text = 'Patient received. Emergency team on standby.'
WHERE id = 'g0000000-0000-0000-0000-000000000003';

-- ============================================================================
-- VERIFICATION QUERIES
-- Use these to verify the seed data was inserted correctly
-- ============================================================================

-- Uncomment to run verification queries:
-- SELECT COUNT(*) as conversation_count FROM conversations;
-- SELECT COUNT(*) as message_count FROM conversation_messages;
-- SELECT COUNT(*) as routing_count FROM routing_decisions;
-- SELECT COUNT(*) as notification_count FROM worker_notifications;

-- View sample conversation with messages:
-- SELECT c.title, cm.role, cm.content, cm.created_at
-- FROM conversations c
-- JOIN conversation_messages cm ON c.id = cm.conversation_id
-- WHERE c.id = 'd0000000-0000-0000-0000-000000000001'
-- ORDER BY cm.created_at;

-- View routing decisions with severity:
-- SELECT u.name, rd.severity_level, rd.severity_score, rd.recommended_facility, rd.reasoning
-- FROM routing_decisions rd
-- JOIN users u ON rd.user_id = u.id
-- ORDER BY rd.severity_score DESC;

-- View worker notifications:
-- SELECT w.name as worker_name, wn.priority, wn.title, wn.status, wn.created_at
-- FROM worker_notifications wn
-- JOIN users w ON wn.worker_id = w.id
-- ORDER BY wn.created_at DESC;
