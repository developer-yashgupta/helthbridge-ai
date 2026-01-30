const https = require('https');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey === 'your_gemini_api_key_here') {
  console.error('❌ Please set a valid GEMINI_API_KEY in .env file');
  process.exit(1);
}

console.log('Fetching available Gemini models...\n');

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models?key=${apiKey}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.error) {
        console.error('❌ Error:', response.error.message);
        console.log('\n💡 Your API key might be invalid or restricted.');
        console.log('Get a new key from: https://aistudio.google.com/app/apikey');
        return;
      }

      if (response.models) {
        console.log('✅ Available models:\n');
        response.models.forEach(model => {
          console.log(`📦 ${model.name}`);
          console.log(`   Display Name: ${model.displayName}`);
          console.log(`   Supported: ${model.supportedGenerationMethods?.join(', ')}`);
          console.log('');
        });
      } else {
        console.log('Response:', JSON.stringify(response, null, 2));
      }
    } catch (error) {
      console.error('❌ Parse error:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.end();
