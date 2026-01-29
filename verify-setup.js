#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 HealthBridge AI - Setup Verification\n');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`, exists ? 'green' : 'red');
  return exists;
}

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'ignore' });
    log(`✅ ${description}`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description}`, 'red');
    return false;
  }
}

function checkPort(port, service) {
  try {
    const { execSync } = require('child_process');
    // Check if port is in use (Windows)
    try {
      execSync(`netstat -an | findstr :${port}`, { stdio: 'ignore' });
      log(`⚠️  Port ${port} is in use (${service})`, 'yellow');
      return true;
    } catch {
      log(`✅ Port ${port} is available (${service})`, 'green');
      return false;
    }
  } catch (error) {
    log(`❓ Could not check port ${port} (${service})`, 'yellow');
    return false;
  }
}

async function main() {
  let allGood = true;

  // 1. Check System Requirements
  log('\n📋 System Requirements:', 'bold');
  allGood &= checkCommand('node --version', 'Node.js installed');
  allGood &= checkCommand('npm --version', 'npm installed');
  allGood &= checkCommand('python --version', 'Python installed');
  allGood &= checkCommand('pip --version', 'pip installed');

  // 2. Check Project Structure
  log('\n📁 Project Structure:', 'bold');
  allGood &= checkFile('frontend/package.json', 'Frontend package.json');
  allGood &= checkFile('backend/package.json', 'Backend package.json');
  allGood &= checkFile('ai-engine/app.py', 'AI Engine main file');
  allGood &= checkFile('frontend/src/app/page.tsx', 'Frontend main page');
  allGood &= checkFile('frontend/src/components/login-modal.tsx', 'Login modal component');
  allGood &= checkFile('frontend/src/lib/api-service.ts', 'API service');

  // 3. Check Configuration Files
  log('\n⚙️  Configuration Files:', 'bold');
  allGood &= checkFile('frontend/tsconfig.json', 'TypeScript config');
  allGood &= checkFile('frontend/next.config.ts', 'Next.js config');
  allGood &= checkFile('frontend/tailwind.config.ts', 'Tailwind config');
  allGood &= checkFile('frontend/.env.local', 'Environment variables');

  // 4. Check Dependencies
  log('\n📦 Dependencies:', 'bold');
  allGood &= checkFile('frontend/node_modules', 'Frontend dependencies');
  allGood &= checkFile('backend/node_modules', 'Backend dependencies');
  
  // Check if Python packages are installed
  try {
    execSync('python -c "import flask, flask_cors"', { stdio: 'ignore' });
    log('✅ Python dependencies installed', 'green');
  } catch {
    log('❌ Python dependencies missing', 'red');
    allGood = false;
  }

  // 5. Check Ports
  log('\n🔌 Port Availability:', 'bold');
  checkPort(3000, 'Backend API');
  checkPort(3001, 'Frontend');
  checkPort(5000, 'AI Engine');

  // 6. Check TypeScript Compilation
  log('\n🔧 TypeScript Check:', 'bold');
  try {
    process.chdir('frontend');
    execSync('npm run typecheck', { stdio: 'ignore' });
    log('✅ TypeScript compilation successful', 'green');
    process.chdir('..');
  } catch (error) {
    log('❌ TypeScript compilation failed', 'red');
    log('   Run: cd frontend && npm run typecheck', 'yellow');
    allGood = false;
    process.chdir('..');
  }

  // 7. Check Build Process
  log('\n🏗️  Build Check:', 'bold');
  try {
    process.chdir('frontend');
    execSync('npm run build', { stdio: 'ignore' });
    log('✅ Frontend build successful', 'green');
    process.chdir('..');
  } catch (error) {
    log('❌ Frontend build failed', 'red');
    log('   Run: cd frontend && npm run build', 'yellow');
    allGood = false;
    process.chdir('..');
  }

  // 8. Summary
  log('\n📊 Verification Summary:', 'bold');
  if (allGood) {
    log('🎉 All checks passed! Your setup is ready.', 'green');
    log('\n🚀 Next Steps:', 'blue');
    log('1. Run: start-all.ps1 (or start-all.bat)', 'blue');
    log('2. Open: http://localhost:3001', 'blue');
    log('3. Test: http://localhost:3001/test', 'blue');
  } else {
    log('⚠️  Some issues found. Please fix them before proceeding.', 'yellow');
    log('\n🔧 Quick Fixes:', 'blue');
    log('1. Run: install-dependencies.ps1', 'blue');
    log('2. Run: fix-typescript.bat', 'blue');
    log('3. Check TROUBLESHOOTING.md', 'blue');
  }

  // 9. Service Status Check (if running)
  log('\n🌐 Service Status Check:', 'bold');
  
  const services = [
    { url: 'http://localhost:3000/health', name: 'Backend API' },
    { url: 'http://localhost:5000/health', name: 'AI Engine' },
    { url: 'http://localhost:3001', name: 'Frontend' }
  ];

  for (const service of services) {
    try {
      const response = await fetch(service.url, { 
        method: 'GET',
        timeout: 2000 
      });
      if (response.ok) {
        log(`✅ ${service.name} is running`, 'green');
      } else {
        log(`⚠️  ${service.name} responded with status ${response.status}`, 'yellow');
      }
    } catch (error) {
      log(`❌ ${service.name} is not running`, 'red');
    }
  }

  log('\n📋 Setup Complete!', 'bold');
}

// Handle fetch for Node.js versions that don't have it built-in
if (typeof fetch === 'undefined') {
  global.fetch = async (url, options = {}) => {
    const https = require('https');
    const http = require('http');
    const urlParsed = new URL(url);
    const client = urlParsed.protocol === 'https:' ? https : http;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, options.timeout || 5000);

      const req = client.request(url, { method: options.method || 'GET' }, (res) => {
        clearTimeout(timeout);
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage
        });
      });

      req.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      req.end();
    });
  };
}

main().catch(console.error);