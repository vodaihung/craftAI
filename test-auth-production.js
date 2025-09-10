#!/usr/bin/env node

/**
 * Production Authentication Test Script
 * 
 * This script tests the authentication flow to help debug production issues.
 * Run with: node test-auth-production.js
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';

console.log('🧪 Testing Authentication Flow');
console.log('Base URL:', BASE_URL);
console.log('Test Email:', TEST_EMAIL);
console.log('---');

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const lib = options.protocol === 'https:' ? https : http;
    
    const req = lib.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Test functions
async function testLoginAPI() {
  console.log('1️⃣ Testing Login API...');
  
  const url = new URL('/api/auth/login', BASE_URL);
  const postData = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  try {
    const response = await makeRequest(options, postData);
    
    console.log('   Status:', response.statusCode);
    console.log('   Has Set-Cookie:', !!response.headers['set-cookie']);
    
    if (response.headers['set-cookie']) {
      const cookies = response.headers['set-cookie'];
      const authCookie = cookies.find(cookie => cookie.includes('auth-token'));
      console.log('   Auth Cookie:', authCookie ? '✅ Present' : '❌ Missing');
      
      if (authCookie) {
        console.log('   Cookie Details:', authCookie.substring(0, 100) + '...');
      }
    }
    
    try {
      const data = JSON.parse(response.body);
      console.log('   Success:', data.success);
      console.log('   Has User:', !!data.user);
      
      if (data.error) {
        console.log('   Error:', data.error);
      }
      
      return {
        success: data.success,
        cookies: response.headers['set-cookie'] || []
      };
    } catch (parseError) {
      console.log('   Response Body:', response.body.substring(0, 200));
      return { success: false, cookies: [] };
    }
  } catch (error) {
    console.log('   ❌ Login API Error:', error.message);
    return { success: false, cookies: [] };
  }
}

async function testSessionAPI(cookies = []) {
  console.log('2️⃣ Testing Session API...');
  
  const url = new URL('/api/auth/session', BASE_URL);
  const cookieHeader = cookies.join('; ');
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'GET',
    headers: {
      'Cookie': cookieHeader
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    console.log('   Status:', response.statusCode);
    
    try {
      const data = JSON.parse(response.body);
      console.log('   Success:', data.success);
      console.log('   Has Session:', !!data.session);
      console.log('   Has User:', !!data.session?.user);
      
      if (data.session?.user) {
        console.log('   User Email:', data.session.user.email);
      }
      
      return data.success && data.session?.user;
    } catch (parseError) {
      console.log('   Response Body:', response.body.substring(0, 200));
      return false;
    }
  } catch (error) {
    console.log('   ❌ Session API Error:', error.message);
    return false;
  }
}

async function testProtectedRoute(cookies = []) {
  console.log('3️⃣ Testing Protected Route Access...');
  
  const url = new URL('/dashboard', BASE_URL);
  const cookieHeader = cookies.join('; ');
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'GET',
    headers: {
      'Cookie': cookieHeader
    },
    // Don't follow redirects automatically
    followRedirect: false
  };
  
  try {
    const response = await makeRequest(options);
    
    console.log('   Status:', response.statusCode);
    
    if (response.statusCode >= 300 && response.statusCode < 400) {
      console.log('   Redirect Location:', response.headers.location);
      
      if (response.headers.location?.includes('/auth/signin')) {
        console.log('   ❌ Redirected to login (authentication failed)');
        return false;
      } else {
        console.log('   ✅ Redirected elsewhere (might be OK)');
        return true;
      }
    } else if (response.statusCode === 200) {
      console.log('   ✅ Access granted');
      return true;
    } else {
      console.log('   ❌ Unexpected status');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Protected Route Error:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Authentication Tests\n');
  
  // Test 1: Login API
  const loginResult = await testLoginAPI();
  console.log('');
  
  if (!loginResult.success) {
    console.log('❌ Login failed - stopping tests');
    return;
  }
  
  // Wait a bit for cookie propagation
  console.log('⏳ Waiting for cookie propagation...');
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('');
  
  // Test 2: Session API
  const sessionValid = await testSessionAPI(loginResult.cookies);
  console.log('');
  
  // Test 3: Protected Route
  const routeAccess = await testProtectedRoute(loginResult.cookies);
  console.log('');
  
  // Summary
  console.log('📊 Test Summary:');
  console.log('   Login API:', loginResult.success ? '✅ Pass' : '❌ Fail');
  console.log('   Session API:', sessionValid ? '✅ Pass' : '❌ Fail');
  console.log('   Protected Route:', routeAccess ? '✅ Pass' : '❌ Fail');
  
  if (loginResult.success && sessionValid && routeAccess) {
    console.log('\n🎉 All tests passed! Authentication flow is working.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    
    if (loginResult.success && !sessionValid) {
      console.log('💡 Tip: Login succeeded but session validation failed. This suggests a cookie propagation issue.');
    }
    
    if (sessionValid && !routeAccess) {
      console.log('💡 Tip: Session is valid but protected route access failed. Check middleware configuration.');
    }
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
