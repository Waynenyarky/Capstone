#!/usr/bin/env node

// Test script to debug payment creation issues
const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testPaymentCreation() {
  try {
    console.log('🧪 Testing payment creation flow...');
    
    // Test 1: Check if service is running
    console.log('\n1. Health check...');
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Service healthy:', health.data);
    
    // Test 2: Try to create a payment without auth (should fail with 401)
    console.log('\n2. Test payment creation without auth...');
    try {
      const paymentData = {
        businessId: 'test-business-123',
        paymentType: 'mayors_fee',
        description: 'Test payment',
        amount: 1000,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      const payment = await axios.post(`${BASE_URL}/api/business/payments`, paymentData);
      console.log('❌ Unexpected success:', payment.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Auth working as expected');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    
    // Test 3: Check if business endpoint exists (without auth)
    console.log('\n3. Test business endpoint...');
    try {
      const business = await axios.get(`${BASE_URL}/api/business/businesses/test-id`);
      console.log('❌ Unexpected success:', business.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Business endpoint exists and requires auth');
      } else if (error.response?.status === 404) {
        console.log('❌ Business endpoint not found');
      } else {
        console.log('❓ Unexpected error:', error.response?.data || error.message);
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log('- Service is running');
    console.log('- Auth is required (good)');
    console.log('- Need to test with valid auth token');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPaymentCreation();
