// Quick Integration Test Script
// Tests connectivity between Frontend, Backend, and AI Engine

const fetch = require('node-fetch');

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function testEndpoint(name, url, options = {}) {
    try {
        log(`\n🔍 Testing ${name}...`, 'cyan');
        log(`   URL: ${url}`, 'blue');

        const response = await fetch(url, options);
        const data = await response.json();

        if (response.ok) {
            log(`✅ ${name} - SUCCESS`, 'green');
            log(`   Status: ${response.status}`, 'green');
            return { success: true, data };
        } else {
            log(`❌ ${name} - FAILED`, 'red');
            log(`   Status: ${response.status}`, 'red');
            log(`   Error: ${JSON.stringify(data)}`, 'red');
            return { success: false, error: data };
        }
    } catch (error) {
        log(`❌ ${name} - ERROR`, 'red');
        log(`   ${error.message}`, 'red');
        return { success: false, error: error.message };
    }
}

async function runTests() {
    log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
    log('║   HealthBridge AI - Integration Test Suite           ║', 'cyan');
    log('╚════════════════════════════════════════════════════════╝', 'cyan');

    const results = {
        backend: false,
        aiEngine: false,
        symptomAnalysis: false
    };

    // Test 1: Backend Health Check
    log('\n📋 Test 1: Backend Health Check', 'yellow');
    const backendHealth = await testEndpoint(
        'Backend Health',
        'http://localhost:3000/health'
    );
    results.backend = backendHealth.success;

    // Test 2: AI Engine Health Check
    log('\n📋 Test 2: AI Engine Health Check', 'yellow');
    const aiHealth = await testEndpoint(
        'AI Engine Health',
        'http://localhost:5000/health'
    );
    results.aiEngine = aiHealth.success;

    // Test 3: Symptom Analysis (via Backend Voice Assistant)
    log('\n📋 Test 3: Symptom Analysis Integration', 'yellow');
    const symptomTest = await testEndpoint(
        'Symptom Analysis',
        'http://localhost:3000/api/voice-assistant/analyze',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: 'test-user-123',
                message: 'I have fever and headache',
                language: 'en',
                patientInfo: {
                    age: 30,
                    gender: 'male'
                }
            })
        }
    );
    results.symptomAnalysis = symptomTest.success;

    // Test 4: Direct AI Engine Analysis
    log('\n📋 Test 4: Direct AI Engine Analysis', 'yellow');
    const directAI = await testEndpoint(
        'AI Engine Direct Analysis',
        'http://localhost:5000/analyze',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: 'test-user-123',
                symptoms: 'fever and headache'
            })
        }
    );

    // Summary
    log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
    log('║                    TEST SUMMARY                        ║', 'cyan');
    log('╚════════════════════════════════════════════════════════╝', 'cyan');

    log(`\n${results.backend ? '✅' : '❌'} Backend Service (Port 3000)`,
        results.backend ? 'green' : 'red');
    log(`${results.aiEngine ? '✅' : '❌'} AI Engine Service (Port 5000)`,
        results.aiEngine ? 'green' : 'red');
    log(`${results.symptomAnalysis ? '✅' : '❌'} Symptom Analysis Integration`,
        results.symptomAnalysis ? 'green' : 'red');

    const allPassed = results.backend && results.aiEngine && results.symptomAnalysis;

    if (allPassed) {
        log('\n🎉 ALL TESTS PASSED! Integration is working correctly.', 'green');
        log('✅ Frontend can now connect to Backend and AI Engine', 'green');
        log('\n📝 Next Steps:', 'cyan');
        log('   1. Start frontend: cd frontend && npm run dev', 'blue');
        log('   2. Visit: http://localhost:3001', 'blue');
        log('   3. Test the symptom analysis feature', 'blue');
    } else {
        log('\n⚠️  SOME TESTS FAILED!', 'yellow');
        log('\n🔧 Troubleshooting:', 'cyan');

        if (!results.backend) {
            log('   • Start backend: cd backend && npm start', 'yellow');
        }
        if (!results.aiEngine) {
            log('   • Start AI engine: cd ai-engine && python app.py', 'yellow');
        }
        if (!results.symptomAnalysis) {
            log('   • Check backend and AI engine logs for errors', 'yellow');
            log('   • Verify CORS configuration', 'yellow');
        }
    }

    log('\n' + '─'.repeat(60) + '\n');

    process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
});
