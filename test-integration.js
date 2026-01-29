// Simple integration test script
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
const AI_ENGINE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3001';

async function testServices() {
  console.log('🧪 Testing HealthBridge AI Integration...\n');

  // Test Backend Health
  try {
    console.log('📡 Testing Backend (Node.js)...');
    const backendResponse = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend is running');
  } catch (error) {
    console.log('❌ Backend is not responding');
    console.log('   Make sure to start: cd backend && npm start');
  }

  // Test AI Engine Health
  try {
    console.log('🤖 Testing AI Engine (Python)...');
    const aiResponse = await axios.get(`${AI_ENGINE_URL}/health`, { timeout: 5000 });
    console.log('✅ AI Engine is running');
  } catch (error) {
    console.log('❌ AI Engine is not responding');
    console.log('   Make sure to start: cd ai-engine && python enhanced_app.py');
  }

  // Test Frontend Health
  try {
    console.log('🌐 Testing Frontend (Next.js)...');
    const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 5000 });
    console.log('✅ Frontend is running');
  } catch (error) {
    console.log('❌ Frontend is not responding');
    console.log('   Make sure to start: cd frontend && npm run dev');
  }

  console.log('\n🚀 Integration Test Complete!');
  console.log('📋 Access URLs:');
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log(`   Backend API: ${API_BASE_URL}`);
  console.log(`   AI Engine: ${AI_ENGINE_URL}`);
}

// Run if axios is available
if (typeof require !== 'undefined') {
  try {
    testServices().catch(console.error);
  } catch (error) {
    console.log('❌ axios not installed. Run: npm install axios');
    console.log('📋 Manual testing URLs:');
    console.log(`   Frontend: ${FRONTEND_URL}`);
    console.log(`   Backend API: ${API_BASE_URL}`);
    console.log(`   AI Engine: ${AI_ENGINE_URL}`);
  }
} else {
  console.log('📋 Testing URLs:');
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log(`   Backend API: ${API_BASE_URL}`);
  console.log(`   AI Engine: ${AI_ENGINE_URL}`);
}