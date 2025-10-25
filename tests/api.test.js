const http = require('http');

const API_BASE = 'http://localhost:3000/api';

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Starting Yacht Delivery Platform Tests...\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: API Root
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api',
      method: 'GET'
    });
    
    if (response.statusCode === 200 && response.data.message) {
      console.log('✓ API Root endpoint works');
      passed++;
    } else {
      console.log('✗ API Root endpoint failed');
      failed++;
    }
  } catch (error) {
    console.log('✗ API Root endpoint failed:', error.message);
    failed++;
  }

  // Test 2: Get all yachts
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/yachts',
      method: 'GET'
    });
    
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      console.log('✓ GET /api/yachts works');
      passed++;
    } else {
      console.log('✗ GET /api/yachts failed');
      failed++;
    }
  } catch (error) {
    console.log('✗ GET /api/yachts failed:', error.message);
    failed++;
  }

  // Test 3: Get all captains
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/captains',
      method: 'GET'
    });
    
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      console.log('✓ GET /api/captains works');
      passed++;
    } else {
      console.log('✗ GET /api/captains failed');
      failed++;
    }
  } catch (error) {
    console.log('✗ GET /api/captains failed:', error.message);
    failed++;
  }

  // Test 4: Get all deliveries
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/deliveries',
      method: 'GET'
    });
    
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      console.log('✓ GET /api/deliveries works');
      passed++;
    } else {
      console.log('✗ GET /api/deliveries failed');
      failed++;
    }
  } catch (error) {
    console.log('✗ GET /api/deliveries failed:', error.message);
    failed++;
  }

  // Test 5: Create a new yacht
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/yachts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        name: 'Test Yacht',
        type: 'sailboat',
        length: 50,
        owner: 'Test Owner',
        homePort: 'Test Port'
      }
    });
    
    if (response.statusCode === 201 && response.data.name === 'Test Yacht') {
      console.log('✓ POST /api/yachts works');
      passed++;
    } else {
      console.log('✗ POST /api/yachts failed');
      failed++;
    }
  } catch (error) {
    console.log('✗ POST /api/yachts failed:', error.message);
    failed++;
  }

  // Test 6: Create a new captain
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/captains',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        name: 'Test Captain',
        license: 'TEST-123',
        experience: 5,
        specializations: ['sailboat']
      }
    });
    
    if (response.statusCode === 201 && response.data.name === 'Test Captain') {
      console.log('✓ POST /api/captains works');
      passed++;
    } else {
      console.log('✗ POST /api/captains failed');
      failed++;
    }
  } catch (error) {
    console.log('✗ POST /api/captains failed:', error.message);
    failed++;
  }

  // Test 7: Create a new delivery
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/deliveries',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        yachtId: 1,
        captainId: 1,
        origin: 'Test Origin',
        destination: 'Test Destination',
        departureDate: '2025-12-01',
        estimatedArrival: '2025-12-05',
        status: 'scheduled'
      }
    });
    
    if (response.statusCode === 201 && response.data.origin === 'Test Origin') {
      console.log('✓ POST /api/deliveries works');
      passed++;
    } else {
      console.log('✗ POST /api/deliveries failed');
      failed++;
    }
  } catch (error) {
    console.log('✗ POST /api/deliveries failed:', error.message);
    failed++;
  }

  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

// Wait for server to be ready
setTimeout(runTests, 1000);
