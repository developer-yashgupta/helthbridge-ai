// Quick test of the backend voice assistant API
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api/voice-assistant/analyze';

async function testBackend() {
  console.log('Testing backend voice assistant API...\n');

  const requestData = {
    userId: '3dfd7ac0-8b57-46df-8232-9efe2750183c',
    message: 'I have a headache and fever',
    language: 'en',
    patientInfo: {
      age: 30,
      gender: 'male',
      location: {
        village: 'Test Village',
        district: 'Test District'
      }
    }
  };

  console.log('Request:', JSON.stringify(requestData, null, 2));
  console.log('\nSending request...\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());

    const data = await response.json();
    console.log('\nResponse data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ SUCCESS!');
      console.log('AI Response:', data.response);
      console.log('Severity:', data.routing.severity);
      console.log('Facility Type:', data.routing.facilityType);
    } else {
      console.log('\n❌ FAILED!');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testBackend();
