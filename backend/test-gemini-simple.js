const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('Testing Gemini API...');
  console.log('API Key:', apiKey ? apiKey.substring(0, 20) + '...' : 'NOT FOUND');

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('❌ Please set a valid GEMINI_API_KEY in .env file');
    console.log('Get your free key from: https://makersuite.google.com/app/apikey');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try the simplest model
    console.log('\nTrying gemini-pro...');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = 'Say hello in one sentence';
    console.log('Sending prompt:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ SUCCESS! Gemini is working!');
    console.log('Response:', text);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n💡 Your API key appears to be invalid.');
      console.log('Please check:');
      console.log('1. The key is correct (no extra spaces)');
      console.log('2. The key is enabled in Google AI Studio');
      console.log('3. Get a new key from: https://makersuite.google.com/app/apikey');
    }
  }
}

testGemini();
