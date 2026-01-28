const fs = require('fs');
const path = require('path');

console.log('🏥 HealthBridge AI - Status Check\n');

// Check project structure
const requiredFiles = [
  'backend/package.json',
  'backend/server.js',
  'frontend/package.json',
  'frontend/App.js',
  'ai-engine/app.py',
  'ai-engine/requirements.txt',
  'database/schema.sql'
];

console.log('📁 Checking project structure...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check backend dependencies
console.log('\n📦 Checking backend dependencies...');
try {
  const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const nodeModulesExists = fs.existsSync('backend/node_modules');
  
  console.log(`✅ Backend package.json loaded`);
  console.log(`${nodeModulesExists ? '✅' : '❌'} Backend node_modules ${nodeModulesExists ? 'exists' : 'missing'}`);
} catch (error) {
  console.log(`❌ Backend package.json error: ${error.message}`);
}

// Check frontend dependencies
console.log('\n📱 Checking frontend dependencies...');
try {
  const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  const nodeModulesExists = fs.existsSync('frontend/node_modules');
  
  console.log(`✅ Frontend package.json loaded`);
  console.log(`${nodeModulesExists ? '✅' : '❌'} Frontend node_modules ${nodeModulesExists ? 'exists' : 'missing'}`);
} catch (error) {
  console.log(`❌ Frontend package.json error: ${error.message}`);
}

// Check AI engine
console.log('\n🤖 Checking AI engine...');
const aiRequirementsExists = fs.existsSync('ai-engine/requirements.txt');
console.log(`${aiRequirementsExists ? '✅' : '❌'} AI requirements.txt ${aiRequirementsExists ? 'exists' : 'missing'}`);

// Summary
console.log('\n📊 Summary:');
if (allFilesExist) {
  console.log('✅ All core files are present');
} else {
  console.log('❌ Some core files are missing');
}

console.log('\n🚀 To start the application:');
console.log('1. Backend: cd backend && npm start');
console.log('2. AI Engine: cd ai-engine && python app.py');
console.log('3. Frontend: cd frontend && npm start');
console.log('\nOr run: start-dev.bat (Windows)');

console.log('\n🌐 Access URLs:');
console.log('- Backend API: http://localhost:3000');
console.log('- AI Engine: http://localhost:5000');
console.log('- Frontend Metro: http://localhost:8081');

console.log('\n✨ HealthBridge AI is ready for development!');