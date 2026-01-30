/**
 * Performance Test Script
 * Tests the optimized voice assistant API response time
 */

const API_URL = 'http://localhost:3000/api/voice-assistant/analyze';

async function testPerformance() {
  console.log('🚀 Testing Voice Assistant Performance\n');
  console.log('=' .repeat(60));

  const testCases = [
    {
      name: 'Greeting (No Symptoms)',
      message: 'Hello, how are you?',
      expectedTime: 3000 // 3 seconds
    },
    {
      name: 'Simple Symptoms',
      message: 'I have fever and cough',
      expectedTime: 4000 // 4 seconds
    },
    {
      name: 'Hindi Symptoms',
      message: 'मुझे बुखार और खांसी है',
      expectedTime: 4000 // 4 seconds
    },
    {
      name: 'Emergency Case',
      message: 'I have severe chest pain and difficulty breathing',
      expectedTime: 3000 // 3 seconds (should be fast)
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`   Message: "${testCase.message}"`);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: '3dfd7ac0-8b57-46df-8232-9efe2750183c',
          message: testCase.message,
          language: testCase.message.includes('मुझे') ? 'hi' : 'en',
          patientInfo: {
            age: 30,
            gender: 'unknown',
            location: {
              district: 'Test',
              block: 'Test',
              village: 'Test'
            }
          }
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const data = await response.json();
      
      const status = duration <= testCase.expectedTime ? '✅ PASS' : '⚠️  SLOW';
      const emoji = duration <= testCase.expectedTime ? '🚀' : '🐌';
      
      console.log(`   ${status} ${emoji} Response time: ${duration}ms (expected: <${testCase.expectedTime}ms)`);
      console.log(`   Severity: ${data.routing?.severity || 'N/A'}`);
      console.log(`   Facility: ${data.routing?.facilityType || 'N/A'}`);
      
      results.push({
        test: testCase.name,
        duration,
        expected: testCase.expectedTime,
        passed: duration <= testCase.expectedTime,
        severity: data.routing?.severity
      });

    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`);
      results.push({
        test: testCase.name,
        duration: -1,
        expected: testCase.expectedTime,
        passed: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERFORMANCE SUMMARY\n');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const avgTime = results
    .filter(r => r.duration > 0)
    .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.duration > 0).length;

  console.log(`Tests Passed: ${passed}/${total}`);
  console.log(`Average Response Time: ${Math.round(avgTime)}ms`);
  console.log(`Target: < 4000ms`);
  
  if (avgTime <= 4000) {
    console.log('\n🎉 EXCELLENT! Response times are within target!');
  } else if (avgTime <= 6000) {
    console.log('\n⚠️  ACCEPTABLE: Response times are okay but could be better');
  } else {
    console.log('\n❌ SLOW: Response times need optimization');
  }

  console.log('\n' + '='.repeat(60));
}

// Run the test
console.log('⏳ Starting performance test...');
console.log('Make sure the backend server is running on http://localhost:3000\n');

testPerformance().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
