# 🚀 Quick Start Guide - HealthBridge AI

## Prerequisites Check
- ✅ Node.js installed
- ✅ PostgreSQL installed and running
- ✅ OpenAI API key configured in `backend/.env`

## Step 1: Setup Database

### Option A: Using the migration script (Recommended)
```bash
cd database/migrations
node run-migration.js --up --seed --verify
```

### Option B: Manual setup
```bash
# Create database
createdb healthbridge

# Or using psql
psql -U postgres
CREATE DATABASE healthbridge;
\q

# Run migrations
psql -U postgres -d healthbridge -f database/migrations/001_voice_assistant_tables.sql
psql -U postgres -d healthbridge -f database/migrations/001_voice_assistant_seed_data.sql
```

## Step 2: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Step 3: Configure Environment

Your `backend/.env` is already configured with:
- ✅ Database credentials (PostgreSQL)
- ✅ OpenAI API key
- ✅ JWT secret

## Step 4: Start the Application

### Open 2 terminals:

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Wait for: `🚀 HealthBridge AI Backend running on port 3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Wait for: `Ready on http://localhost:3001`

## Step 5: Access the Application

- **Frontend**: http://localhost:3001
- **Backend Health**: http://localhost:3000/health
- **Test Page**: http://localhost:3001/test

## Troubleshooting

### Issue: "Database connection failed"
**Solution**: Make sure PostgreSQL is running and credentials in `backend/.env` are correct
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT version();"
```

### Issue: "OpenAI API error"
**Solution**: Verify your OpenAI API key in `backend/.env` is valid and has credits

### Issue: "Frontend not showing OpenAI responses"
**Solution**: 
1. Check backend is running on port 3000
2. Check browser console for errors (F12)
3. Verify database tables exist (run migrations)

### Issue: "Port already in use"
**Solution**: Kill the process or change ports
```bash
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Quick Test

1. Open http://localhost:3001
2. Click on the voice assistant
3. Type a message like "I have fever and headache"
4. You should see:
   - AI response from OpenAI
   - Routing recommendation (ASHA/PHC/CHC/Emergency)
   - Severity assessment

## Need Help?

Check the logs:
- Backend: Terminal 1 output
- Frontend: Browser console (F12)
- Database: Check `backend/logs/` folder
