// Simple test script to verify backend connection
const fetch = require('node-fetch');

async function testConnection() {
  try {
    console.log('Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test CORS with a simple OPTIONS request
    const corsResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3002',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('CORS test status:', corsResponse.status);
    console.log('CORS headers:', corsResponse.headers.raw());
    
  } catch (error) {
    console.error('Connection test failed:', error.message);
  }
}

testConnection();
