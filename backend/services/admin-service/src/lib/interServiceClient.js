/**
 * Inter-Service Communication Client
 * Handles HTTP calls between microservices
 */

const axios = require('axios');
const logger = require('./logger');

/**
 * Call Auth Service
 */
async function callAuthService(endpoint, method = 'GET', data = null, token = null) {
  const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
  const url = `${authServiceUrl}${endpoint}`;
  
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    logger.error('Auth Service call failed', { 
      endpoint, 
      method, 
      error: error.message,
      status: error.response?.status 
    });
    return { success: false, error: error.message };
  }
}

/**
 * Call Audit Service
 */
async function callAuditService(endpoint, method = 'POST', data = null, token = null) {
  const auditServiceUrl = process.env.AUDIT_SERVICE_URL || 'http://localhost:3004';
  const url = `${auditServiceUrl}${endpoint}`;
  
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (process.env.AUDIT_SERVICE_API_KEY) {
      config.headers['X-API-Key'] = process.env.AUDIT_SERVICE_API_KEY;
    }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    logger.error('Audit Service call failed', { 
      endpoint, 
      method, 
      error: error.message,
      status: error.response?.status 
    });
    return { success: false, error: error.message };
  }
}

/**
 * Apply approved change
 * Uses local implementation since it needs direct model access
 */
async function applyApprovedChange(approval, token = null) {
  const applyApprovedChangeImpl = require('./applyApprovedChange');
  return await applyApprovedChangeImpl(approval);
}

/**
 * Log to blockchain via Audit Service
 */
async function logToBlockchain(operation, params, auditLogId = null) {
  return await callAuditService('/api/audit/log', 'POST', {
    operation,
    params,
    auditLogId
  });
}

module.exports = {
  callAuthService,
  callAuditService,
  applyApprovedChange,
  logToBlockchain,
};
