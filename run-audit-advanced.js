#!/usr/bin/env node

const https = require('https');
const { URL } = require('url');
const readline = require('readline');

// Configuration
const BASE_URL = 'https://sparse-incalculable-house.mastra.cloud';
const WORKFLOW_ID = 'web3AuditWorkflow';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SentryAgent-Audit/1.0.0',
        ...options.headers
      },
      timeout: options.timeout || 30000
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (error) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Create a workflow run
async function createRun() {
  console.log(`${colors.blue}📝 Creating workflow run...${colors.reset}`);
  try {
    const response = await makeRequest(`${BASE_URL}/api/workflows/${WORKFLOW_ID}/createRun`, {
      method: 'POST'
    });
    
    if (response.status === 200) {
      console.log(`${colors.green}✅ Run created successfully${colors.reset}`);
      return response.data.runId;
    } else {
      throw new Error(`Failed to create run: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error creating run:${colors.reset}`, error.message);
    throw error;
  }
}

// Start the workflow
async function startWorkflow(runId, repoUrl, options = {}) {
  console.log(`${colors.blue}🚀 Starting workflow execution...${colors.reset}`);
  try {
    const response = await makeRequest(`${BASE_URL}/api/workflows/${WORKFLOW_ID}/start`, {
      method: 'POST',
      body: {
        runId: runId,
        inputData: {
          scanId: options.scanId || `audit-${Date.now()}`,
          repoUrl: repoUrl,
          token: options.token || '',
          includeSecurityAnalysis: options.includeSecurityAnalysis !== false
        }
      }
    });
    
    if (response.status === 200) {
      console.log(`${colors.green}✅ Workflow started successfully${colors.reset}`);
      return response.data;
    } else {
      throw new Error(`Failed to start workflow: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error starting workflow:${colors.reset}`, error.message);
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
    console.error(`${colors.red}❌ Error checking status:${colors.reset}`, error.message);
    throw error;
  }
}

// Get execution result
async function getResult(runId) {
  console.log(`${colors.blue}📋 Fetching audit report...${colors.reset}`);
  try {
    const response = await makeRequest(`${BASE_URL}/api/workflows/${WORKFLOW_ID}/runs/${runId}/execution-result`);
    
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Failed to get result: ${response.status} - ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error getting result:${colors.reset}`, error.message);
    throw error;
  }
}

// Monitor workflow progress with detailed output
async function monitorProgress(runId) {
  console.log(`${colors.cyan}⏳ Monitoring workflow progress...${colors.reset}`);
  console.log(`${colors.yellow}Press Ctrl+C to cancel${colors.reset}\n`);
  
  let lastStatus = '';
  let progressCount = 0;
  
  while (true) {
    try {
      const status = await checkStatus(runId);
      
      // Show progress indicator
      if (status.status !== lastStatus) {
        console.log(`${colors.magenta}Status: ${status.status}${colors.reset}`);
        lastStatus = status.status;
      } else {
        // Show progress dots
        process.stdout.write('.');
        progressCount++;
        if (progressCount % 20 === 0) {
          process.stdout.write('\n');
        }
      }
      
      if (status.status === 'success') {
        console.log(`\n${colors.green}✅ Workflow completed successfully!${colors.reset}`);
        return true;
      } else if (status.status === 'failed') {
        console.log(`\n${colors.red}❌ Workflow failed!${colors.reset}`);
        console.log(`${colors.red}Error details:${colors.reset}`, JSON.stringify(status, null, 2));
        return false;
      }
      
      // Wait 3 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`\n${colors.red}❌ Error monitoring progress:${colors.reset}`, error.message);
      return false;
    }
  }
}

// Format and display the audit report
function displayReport(result) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}🎯 WEB3 SECURITY AUDIT REPORT${colors.reset}`);
  console.log('='.repeat(80));
  
  if (result.summary) {
    console.log(`\n${colors.bright}Summary:${colors.reset}`);
    console.log(result.summary);
  }
  
  if (result.counts) {
    console.log(`\n${colors.bright}Statistics:${colors.reset}`);
    console.log(`Files Scanned: ${result.counts.filesScanned}`);
    console.log(`Solidity Files: ${result.counts.solidityFiles}`);
    console.log(`Total Vulnerabilities: ${result.counts.vulnerabilities}`);
    
    if (result.counts.bySeverity) {
      console.log(`\n${colors.bright}Vulnerabilities by Severity:${colors.reset}`);
      console.log(`  Critical: ${colors.red}${result.counts.bySeverity.critical}${colors.reset}`);
      console.log(`  High: ${colors.red}${result.counts.bySeverity.high}${colors.reset}`);
      console.log(`  Medium: ${colors.yellow}${result.counts.bySeverity.medium}${colors.reset}`);
      console.log(`  Low: ${colors.blue}${result.counts.bySeverity.low}${colors.reset}`);
    }
  }
  
  if (result.languages && result.languages.length > 0) {
    console.log(`\n${colors.bright}Languages Detected:${colors.reset}`);
    result.languages.forEach(lang => {
      console.log(`  ${lang.name}: ${lang.files} files`);
    });
  }
  
  if (result.issues && result.issues.length > 0) {
    console.log(`\n${colors.bright}Security Issues:${colors.reset}`);
    result.issues.forEach((issue, index) => {
      const severityColor = issue.severity === 'critical' ? colors.red :
                           issue.severity === 'high' ? colors.red :
                           issue.severity === 'medium' ? colors.yellow : colors.blue;
      
      console.log(`\n${index + 1}. ${severityColor}[${issue.severity.toUpperCase()}]${colors.reset} ${issue.title}`);
      console.log(`   File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
      console.log(`   Description: ${issue.description}`);
      if (issue.snippet) {
        console.log(`   Code: ${issue.snippet}`);
      }
      console.log(`   Remediation: ${issue.remediation}`);
      console.log(`   Confidence: ${(issue.confidence * 100).toFixed(1)}%`);
    });
  }
  
  if (result.recommendations && result.recommendations.length > 0) {
    console.log(`\n${colors.bright}General Recommendations:${colors.reset}`);
    result.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

// Main execution function
async function runAudit(repoUrl, options = {}) {
  try {
    console.log(`${colors.bright}${colors.cyan}🔍 WEB3 SECURITY AUDIT TOOL${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}================================${colors.reset}\n`);
    console.log(`Repository: ${colors.blue}${repoUrl}${colors.reset}`);
    console.log(`Workflow: ${colors.blue}${WORKFLOW_ID}${colors.reset}`);
    console.log(`Scan ID: ${colors.blue}${options.scanId || `audit-${Date.now()}`}${colors.reset}`);
    console.log('---\n');
    
    // Step 1: Create run
    const runId = await createRun();
    console.log(`Run ID: ${colors.green}${runId}${colors.reset}\n`);
    
    // Step 2: Start workflow
    await startWorkflow(runId, repoUrl, options);
    console.log('');
    
    // Step 3: Monitor progress
    const success = await monitorProgress(runId);
    
    if (success) {
      // Step 4: Get result
      const result = await getResult(runId);
      displayReport(result);
    } else {
      console.log(`${colors.red}❌ Audit failed to complete${colors.reset}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`${colors.red}💥 Fatal error:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  let repoUrl = 'https://github.com/error9098x/yieldnest'; // default
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--repo':
      case '-r':
        repoUrl = args[++i];
        break;
      case '--scan-id':
      case '-s':
        options.scanId = args[++i];
        break;
      case '--token':
      case '-t':
        options.token = args[++i];
        break;
      case '--no-security':
        options.includeSecurityAnalysis = false;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node run-audit-advanced.js [options]

Options:
  -r, --repo <url>        Repository URL to audit (default: https://github.com/error9098x/yieldnest)
  -s, --scan-id <id>      Custom scan ID
  -t, --token <token>     GitHub token for private repos
  --no-security           Skip security analysis
  -h, --help              Show this help message

Examples:
  node run-audit-advanced.js
  node run-audit-advanced.js --repo https://github.com/user/repo
  node run-audit-advanced.js --repo https://github.com/user/repo --token ghp_xxx
        `);
        process.exit(0);
        break;
    }
  }
  
  return { repoUrl, options };
}

// Run the audit
if (require.main === module) {
  const { repoUrl, options } = parseArgs();
  runAudit(repoUrl, options);
}

module.exports = {
  runAudit,
  createRun,
  startWorkflow,
  checkStatus,
  getResult,
  monitorProgress,
  displayReport
};
