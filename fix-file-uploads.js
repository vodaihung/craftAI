#!/usr/bin/env node

/**
 * Quick Fix Script for File Upload Restrictions
 * 
 * This script removes file type restrictions from all forms in the database.
 * Run with: node fix-file-uploads.js
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('🔧 File Upload Restrictions Fix Script');
console.log('Base URL:', BASE_URL);
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

// Check current restrictions
async function checkRestrictions() {
  console.log('1️⃣ Checking current file upload restrictions...');
  
  const url = new URL('/api/admin/fix-file-uploads', BASE_URL);
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      
      console.log('   ✅ Successfully checked restrictions');
      console.log(`   📊 Total forms: ${data.totalForms}`);
      console.log(`   🚫 Forms with restrictions: ${data.formsWithRestrictions}`);
      console.log(`   ✅ Unrestricted forms: ${data.totalForms - data.formsWithRestrictions}`);
      
      if (data.forms && data.forms.length > 0) {
        console.log('\n   📋 Forms with restrictions:');
        data.forms.forEach(form => {
          console.log(`      - ${form.title} (${form.restrictedFields.length} restricted fields)`);
        });
      }
      
      return data;
    } else {
      console.log(`   ❌ Failed to check restrictions (Status: ${response.statusCode})`);
      console.log(`   Response: ${response.body.substring(0, 200)}`);
      return null;
    }
  } catch (error) {
    console.log('   ❌ Error checking restrictions:', error.message);
    return null;
  }
}

// Fix all restrictions
async function fixAllRestrictions() {
  console.log('2️⃣ Removing all file upload restrictions...');
  
  const url = new URL('/api/admin/fix-file-uploads', BASE_URL);
  const postData = JSON.stringify({ removeAll: true });
  
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
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      
      console.log('   ✅ Successfully removed restrictions');
      console.log(`   📝 ${data.message}`);
      
      if (data.summary) {
        console.log(`   📊 Updated: ${data.summary.updated} forms`);
        console.log(`   ❌ Failed: ${data.summary.failed} forms`);
      }
      
      if (data.updatedForms && data.updatedForms.length > 0) {
        console.log('\n   📋 Updated forms:');
        data.updatedForms.forEach(form => {
          console.log(`      - ${form.title}`);
        });
      }
      
      if (data.errors && data.errors.length > 0) {
        console.log('\n   ⚠️  Errors:');
        data.errors.forEach(error => {
          console.log(`      - Form ${error.formId}: ${error.error}`);
        });
      }
      
      return data;
    } else {
      console.log(`   ❌ Failed to fix restrictions (Status: ${response.statusCode})`);
      console.log(`   Response: ${response.body.substring(0, 200)}`);
      return null;
    }
  } catch (error) {
    console.log('   ❌ Error fixing restrictions:', error.message);
    return null;
  }
}

// Verify fix
async function verifyFix() {
  console.log('3️⃣ Verifying fix...');
  
  const data = await checkRestrictions();
  
  if (data) {
    if (data.formsWithRestrictions === 0) {
      console.log('   ✅ All restrictions removed successfully!');
      return true;
    } else {
      console.log(`   ⚠️  Still ${data.formsWithRestrictions} forms with restrictions`);
      return false;
    }
  }
  
  return false;
}

// Main function
async function main() {
  console.log('🚀 Starting File Upload Fix Process\n');
  
  // Step 1: Check current state
  const initialData = await checkRestrictions();
  console.log('');
  
  if (!initialData) {
    console.log('❌ Failed to check initial state - stopping');
    return;
  }
  
  if (initialData.formsWithRestrictions === 0) {
    console.log('🎉 No file upload restrictions found - nothing to fix!');
    return;
  }
  
  // Step 2: Fix restrictions
  const fixResult = await fixAllRestrictions();
  console.log('');
  
  if (!fixResult || !fixResult.success) {
    console.log('❌ Failed to fix restrictions - stopping');
    return;
  }
  
  // Step 3: Verify fix
  const verified = await verifyFix();
  console.log('');
  
  // Summary
  console.log('📊 Summary:');
  console.log(`   Initial restrictions: ${initialData.formsWithRestrictions} forms`);
  console.log(`   Fixed: ${fixResult.summary?.updated || 0} forms`);
  console.log(`   Failed: ${fixResult.summary?.failed || 0} forms`);
  
  if (verified) {
    console.log('\n🎉 All file upload restrictions have been successfully removed!');
    console.log('   Users can now upload any file type (except dangerous executables).');
  } else {
    console.log('\n⚠️  Some restrictions may still exist. Check the admin panel for details.');
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Script execution failed:', error);
  process.exit(1);
});
