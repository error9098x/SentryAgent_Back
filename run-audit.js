#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');

// Configuration
const BASE_URL = 'https://sparse-incalculable-house.mastra.cloud';
const WORKFLOW_ID = 'web3AuditWorkflow';
const REPO_URL = 'https://github.com/error9098x/yieldnest';

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Create a workflow run
async function createRun() {
  console.log('📝 Creating workflow run...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/workflows/${WORKFLOW_ID}/create-run`, {
      method: 'POST'
    });
    
    if (response.status === 200) {
      return response.data.runId;
    } else {
      throw new Error(`Failed to create run: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('❌ Error creating run:', error.message);
    throw error;
  }
}

// Start the workflow
async function startWorkflow(runId) {
  console.log('🚀 Starting workflow execution...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/workflows/${WORKFLOW_ID}/start`, {
      method: 'POST',
      body: {
        runId: runId,
        inputData: {
          scanId: `yieldnest-audit-${Date.now()}`,
          repoUrl: REPO_URL,
          token: '',
          includeSecurityAnalysis: true
        }
      }
    });
    
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Failed to start workflow: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('❌ Error starting workflow:', error.message);
    throw error;
  }
}

// Check workflow status
async function checkStatus(runId) {
  try {
    const response = await makeRequest(`${BASE_URL}/api/workflows/${WORKFLOW_ID}/runs/${runId}`);
    
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Failed to check status: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('❌ Error checking status:', error.message);
    throw error;
  }
}

// Get execution result
async function getResult(runId) {
  console.log('📋 Fetching audit report...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/workflows/${WORKFLOW_ID}/runs/${runId}/execution-result`);
    
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Failed to get result: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('❌ Error getting result:', error.message);
    throw error;
  }
}

// Monitor workflow progress
async function monitorProgress(runId) {
  console.log('⏳ Monitoring workflow progress...');
  
  while (true) {
    try {
      const status = await checkStatus(runId);
      console.log(`Status: ${status.status}`);
      
      if (status.status === 'success') {
        console.log('✅ Workflow completed successfully!');
        return true;
      } else if (status.status === 'failed') {
        console.log('❌ Workflow failed!');
        console.log('Error details:', JSON.stringify(status, null, 2));
        return false;
      }
      
      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error('❌ Error monitoring progress:', error.message);
      return false;
    }
  }
}

// Main execution function
async function runAudit() {
  try {
    console.log('🔍 Starting YieldNest repository audit...');
    console.log(`Repository: ${REPO_URL}`);
    console.log(`Workflow: ${WORKFLOW_ID}`);
    console.log('---');
    
    // Step 1: Create run
    const runId = await createRun();
    console.log(`✅ Run ID: ${runId}`);
    
    // Step 2: Start workflow
    await startWorkflow(runId);
    console.log('✅ Workflow started');
    
    // Step 3: Monitor progress
    const success = await monitorProgress(runId);
    
    if (success) {
      // Step 4: Get result
      const result = await getResult(runId);
      console.log('---');
      console.log('🎯 Audit Report:');
      console.log(JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the audit
if (require.main === module) {
  runAudit();
}

module.exports = {
  runAudit,
  createRun,
  startWorkflow,
  checkStatus,
  getResult,
  monitorProgress
};

