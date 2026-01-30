# Quick Start Guide - Voice Assistant Migrations

## Prerequisites

1. PostgreSQL database running
2. Environment variables configured in `backend/.env`:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=healthbridge
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```
3. Base schema already applied (users, healthcare_resources tables must exist)

## Running Migrations

### Option 1: Using npm scripts (Recommended)

From the `backend` directory:

```bash
# Apply migrations without seed data
npm run migrate:up

# Apply migrations with test seed data
npm run migrate:up:seed

# Rollback migrations
npm run migrate:down

# Verify migrations
npm run migrate:verify
```

### Option 2: Using Node.js directly

From the project root:

```bash
# Apply migrations
node database/migrations/run-migration.js --up --verify

# Apply migrations with seed data
node database/migrations/run-migration.js --up --seed --verify

# Rollback migrations
node database/migrations/run-migration.js --down
```

### Option 3: Using psql directly

```bash
# Apply migrations
psql -U postgres -d healthbridge -f database/migrations/001_voice_assistant_tables.sql

# Apply seed data
psql -U postgres -d healthbridge -f database/migrations/001_voice_assistant_seed_data.sql

# Rollback
psql -U postgres -d healthbridge -f database/migrations/001_voice_assistant_rollback.sql
```

## What Gets Created

### Tables
- ✅ `conversations` - Voice assistant conversation sessions
- ✅ `conversation_messages` - Individual messages in conversations
- ✅ `routing_decisions` - AI routing recommendations
- ✅ `worker_notifications` - Notifications to healthcare workers

### Indexes
- ✅ 17 performance-optimized indexes across all tables

### Triggers
- ✅ Auto-update message count in conversations
- ✅ Auto-update notification timestamps

### Seed Data (if --seed flag used)
- ✅ 3 test citizen users
- ✅ 2 ASHA workers
- ✅ 1 PHC staff member
- ✅ 3 sample conversations (low, medium, critical severity)
- ✅ Multiple conversation messages
- ✅ 3 routing decisions
- ✅ 3 worker notifications

## Verification

After running migrations, verify success:

```bash
# Using npm script
npm run migrate:verify

# Or using psql
psql -U postgres -d healthbridge -c "
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('conversations', 'conversation_messages', 'routing_decisions', 'worker_notifications');
"
```

Expected output: 4 tables listed

## Troubleshooting

### Error: "relation already exists"
**Solution:** Tables already exist. Run rollback first:
```bash
npm run migrate:down
```

### Error: "relation users does not exist"
**Solution:** Base schema not applied. Run the main schema first:
```bash
psql -U postgres -d healthbridge -f database/schema.sql
```

### Error: "function gen_random_uuid() does not exist"
**Solution:** Enable pgcrypto extension:
```bash
psql -U postgres -d healthbridge -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

### Error: "connection refused"
**Solution:** Check PostgreSQL is running and environment variables are correct:
```bash
# Check PostgreSQL status
pg_isready

# Verify environment variables
echo $DB_HOST $DB_PORT $DB_NAME
```

## Next Steps

After successful migration:

1. ✅ Verify tables exist
2. ✅ Check seed data (if applied)
3. ✅ Start implementing backend services (Task 2.1)
4. ✅ Test API endpoints with sample data

## Rollback

If you need to undo the migration:

```bash
# Using npm
npm run migrate:down

# Or directly
node database/migrations/run-migration.js --down
```

This will:
- Drop all 4 tables
- Remove all indexes
- Remove all triggers and functions
- Clean up all related data

## Support

For issues or questions:
1. Check the main README.md in this directory
2. Review the SQL files for detailed comments
3. Check PostgreSQL logs for detailed error messages
