# Database Migrations

This directory contains database migration files for the HealthBridge AI application.

## Migration Files

### Voice Healthcare Assistant Feature (001)

- **001_voice_assistant_tables.sql** - Creates the core tables for the voice assistant feature
- **001_voice_assistant_seed_data.sql** - Inserts test data for development and testing
- **001_voice_assistant_rollback.sql** - Removes all voice assistant tables and functions

## Tables Created

### 1. conversations
Stores voice assistant conversation sessions with users.

**Key Fields:**
- `id` - Unique conversation identifier
- `user_id` - Reference to the user
- `title` - Auto-generated or user-defined title
- `language` - Conversation language (hi, en, etc.)
- `message_count` - Automatically updated count of messages
- `status` - active, archived, or deleted

### 2. conversation_messages
Individual messages within voice assistant conversations.

**Key Fields:**
- `id` - Unique message identifier
- `conversation_id` - Reference to parent conversation
- `role` - user, assistant, or system
- `content` - Message text content
- `content_type` - text or voice
- `voice_duration` - Duration in seconds for voice messages

### 3. routing_decisions
AI-generated healthcare facility routing recommendations.

**Key Fields:**
- `id` - Unique routing decision identifier
- `conversation_id` - Reference to conversation
- `user_id` - Reference to user
- `symptoms` - JSON array of symptoms
- `severity_level` - low, medium, high, or critical
- `severity_score` - Numerical score (0-100)
- `recommended_facility` - ASHA, PHC, CHC, or EMERGENCY
- `facility_id` - Reference to healthcare_resources table
- `reasoning` - AI explanation for the routing decision
- `priority` - Urgency level
- `timeframe` - Recommended timeframe for seeking care

### 4. worker_notifications
Notifications sent to healthcare workers when patients are referred.

**Key Fields:**
- `id` - Unique notification identifier
- `worker_id` - Reference to healthcare worker user
- `worker_type` - asha, phc_staff, chc_staff, or emergency
- `patient_id` - Reference to patient user
- `routing_decision_id` - Reference to routing decision
- `notification_type` - new_referral, urgent_case, follow_up, or emergency
- `priority` - low, medium, high, or critical
- `patient_summary` - JSON with patient details and symptoms
- `status` - pending, acknowledged, responded, completed, or cancelled
- `sent_via` - JSON array of delivery channels (app, sms, call)

## Routing Logic

The system routes patients based on severity scores:

| Severity Score | Severity Level | Recommended Facility |
|---------------|----------------|---------------------|
| 0-40          | low            | ASHA Worker         |
| 41-60         | medium         | PHC (Primary Health Centre) |
| 61-80         | high           | CHC (Community Health Centre) |
| 81-100        | critical       | Emergency Services  |

## How to Apply Migrations

### PostgreSQL (Production)

```bash
# Apply main migration
psql -U postgres -d healthbridge -f database/migrations/001_voice_assistant_tables.sql

# Apply seed data (optional, for testing)
psql -U postgres -d healthbridge -f database/migrations/001_voice_assistant_seed_data.sql

# Rollback if needed
psql -U postgres -d healthbridge -f database/migrations/001_voice_assistant_rollback.sql
```

### Using Node.js/Backend

```javascript
// In your backend setup or migration script
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function runMigration() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Run main migration
    const migration = fs.readFileSync(
      'database/migrations/001_voice_assistant_tables.sql', 
      'utf8'
    );
    await client.query(migration);
    
    // Run seed data (optional)
    const seedData = fs.readFileSync(
      'database/migrations/001_voice_assistant_seed_data.sql',
      'utf8'
    );
    await client.query(seedData);
    
    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

runMigration();
```

## Verification Queries

After applying migrations, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'conversation_messages', 'routing_decisions', 'worker_notifications');

-- Check table row counts
SELECT 
  (SELECT COUNT(*) FROM conversations) as conversations,
  (SELECT COUNT(*) FROM conversation_messages) as messages,
  (SELECT COUNT(*) FROM routing_decisions) as routing_decisions,
  (SELECT COUNT(*) FROM worker_notifications) as notifications;

-- View sample data
SELECT c.title, c.message_count, c.status, u.name as user_name
FROM conversations c
JOIN users u ON c.user_id = u.id
ORDER BY c.last_message_at DESC
LIMIT 5;
```

## Indexes

The following indexes are created for performance optimization:

**conversations:**
- `idx_conversations_user_id` - Fast user conversation lookup
- `idx_conversations_last_message` - Ordered by recent activity
- `idx_conversations_status` - Filter by status

**conversation_messages:**
- `idx_messages_conversation_id` - Fast message retrieval by conversation
- `idx_messages_created_at` - Chronological ordering
- `idx_messages_role` - Filter by message role

**routing_decisions:**
- `idx_routing_user_id` - User routing history
- `idx_routing_conversation_id` - Routing by conversation
- `idx_routing_severity` - Filter by severity level
- `idx_routing_facility` - Filter by facility type
- `idx_routing_created_at` - Chronological ordering
- `idx_routing_priority` - Filter by priority

**worker_notifications:**
- `idx_worker_notif_worker_id` - Worker's notifications
- `idx_worker_notif_patient_id` - Patient's referrals
- `idx_worker_notif_status` - Filter by status
- `idx_worker_notif_priority` - Filter by priority
- `idx_worker_notif_created` - Chronological ordering
- `idx_worker_notif_type` - Filter by notification type
- `idx_worker_notif_worker_type` - Filter by worker type

## Triggers

### update_conversation_message_count
Automatically increments `message_count` and updates `last_message_at` when a new message is added to a conversation.

### update_notification_timestamp
Automatically updates the `updated_at` timestamp when a worker notification is modified.

## Seed Data

The seed data includes:

- **3 test citizen users** with varying medical histories
- **2 ASHA workers** for different areas
- **1 PHC staff member**
- **3 sample conversations** demonstrating low, medium, and critical severity cases
- **Multiple messages** showing conversation flow
- **3 routing decisions** for each severity level
- **3 worker notifications** in different states (pending, acknowledged)

This data is useful for:
- Development and testing
- Demonstrating the system workflow
- Integration testing
- UI/UX testing

## Notes

- All tables use UUID primary keys for better scalability
- JSONB columns are used for flexible metadata storage
- Foreign key constraints ensure data integrity
- Check constraints validate enum-like values
- Timestamps use PostgreSQL's CURRENT_TIMESTAMP
- ON DELETE CASCADE ensures orphaned records are cleaned up
- Comments are added to tables and columns for documentation

## Troubleshooting

### Error: relation already exists
The tables may already exist. Run the rollback script first:
```bash
psql -U postgres -d healthbridge -f database/migrations/001_voice_assistant_rollback.sql
```

### Error: foreign key constraint violation
Ensure the base schema (users, healthcare_resources tables) exists before running this migration.

### Error: function gen_random_uuid() does not exist
Enable the pgcrypto extension:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## Future Migrations

When creating new migrations:
1. Use sequential numbering (002, 003, etc.)
2. Include both forward and rollback scripts
3. Document all changes in this README
4. Test migrations on a development database first
5. Include verification queries
