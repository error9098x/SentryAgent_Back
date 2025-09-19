#!/usr/bin/env node

// This version uses the actual Mastra Client SDK
// First install it: npm install @mastra/client-js

const { MastraClient } = require('@mastra/client-js');

// Configuration
const BASE_URL = 'https://sparse-incalculable-house.mastra.cloud';

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

// Initialize Mastra Client
const mastraClient = new MastraClient({
  baseUrl: BASE_URL,
  retries: 3,
  backoffMs: 300,
  maxBackoffMs: 5000,
});

// Format and display the audit report
function displayReport(result) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}🎯 WEB3 SECURITY AUDIT REPORT${colors.reset}`);
  console.log('='.repeat(80));
  
  // Handle different result structures
  let reportData = result;
  if (result.payload && result.payload.workflowState) {
    // Extract the final result from workflow state
    const steps = result.payload.workflowState.steps;
    const finalStep = Object.values(steps).find(step => step.status === 'success');
    if (finalStep && finalStep.output) {
      reportData = finalStep.output;
    }
  }
  
  if (reportData.summary) {
    console.log(`\n${colors.bright}Summary:${colors.reset}`);
    console.log(reportData.summary);
  }
  
  if (reportData.counts) {
    console.log(`\n${colors.bright}Statistics:${colors.reset}`);
    console.log(`Files Scanned: ${reportData.counts.filesScanned}`);
    console.log(`Solidity Files: ${reportData.counts.solidityFiles}`);
    console.log(`Total Vulnerabilities: ${reportData.counts.vulnerabilities}`);
    
    if (reportData.counts.bySeverity) {
      console.log(`\n${colors.bright}Vulnerabilities by Severity:${colors.reset}`);
      console.log(`  Critical: ${colors.red}${reportData.counts.bySeverity.critical}${colors.reset}`);
      console.log(`  High: ${colors.red}${reportData.counts.bySeverity.high}${colors.reset}`);
      console.log(`  Medium: ${colors.yellow}${reportData.counts.bySeverity.medium}${colors.reset}`);
      console.log(`  Low: ${colors.blue}${reportData.counts.bySeverity.low}${colors.reset}`);
    }
  }
  
  if (reportData.languages && reportData.languages.length > 0) {
    console.log(`\n${colors.bright}Languages Detected:${colors.reset}`);
    reportData.languages.forEach(lang => {
      console.log(`  ${lang.name}: ${lang.files} files`);
    });
  }
  
  if (reportData.issues && reportData.issues.length > 0) {
    console.log(`\n${colors.bright}Security Issues:${colors.reset}`);
    reportData.issues.forEach((issue, index) => {
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
  
  if (reportData.recommendations && reportData.recommendations.length > 0) {
    console.log(`\n${colors.bright}General Recommendations:${colors.reset}`);
    reportData.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

// Main execution function using Mastra Client SDK
async function runAudit(repoUrl, options = {}) {
  try {
    console.log(`${colors.bright}${colors.cyan}🔍 WEB3 SECURITY AUDIT TOOL${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}================================${colors.reset}\n`);
    console.log(`Repository: ${colors.blue}${repoUrl}${colors.reset}`);
    console.log(`Workflow: ${colors.blue}web3AuditWorkflow${colors.reset}`);
    console.log(`Scan ID: ${colors.blue}${options.scanId || `audit-${Date.now()}`}${colors.reset}`);
    console.log('---\n');
    
    // Get workflow instance
    console.log(`${colors.blue}📝 Getting workflow instance...${colors.reset}`);
    const workflow = mastraClient.getWorkflow("web3AuditWorkflow");
    
    // Create run
    console.log(`${colors.blue}📝 Creating workflow run...${colors.reset}`);
    const run = await workflow.createRun();
    console.log(`Run ID: ${colors.green}${run.runId}${colors.reset}\n`);
    
    // Set up watch callback
    console.log(`${colors.cyan}⏳ Setting up workflow monitoring...${colors.reset}`);
    workflow.watch({ runId: run.runId }, (record) => {
      const status = record.payload?.workflowState?.status;
      if (status) {
        console.log(`${colors.magenta}Status: ${status}${colors.reset}`);
      }
    });
    
    // Start workflow asynchronously
    console.log(`${colors.blue}🚀 Starting workflow execution...${colors.reset}`);
    const result = await workflow.startAsync({
      runId: run.runId,
      inputData: {
        scanId: options.scanId || `audit-${Date.now()}`,
        repoUrl: repoUrl,
        token: options.token || '',
        includeSecurityAnalysis: options.includeSecurityAnalysis !== false
      }
    });
    
    console.log(`${colors.green}✅ Workflow completed!${colors.reset}\n`);
    
    // Display the result
    displayReport(result);
    
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
Usage: node run-audit-sdk.js [options]

Options:
  -r, --repo <url>        Repository URL to audit (default: https://github.com/error9098x/yieldnest)
  -s, --scan-id <id>      Custom scan ID
  -t, --token <token>     GitHub token for private repos
  --no-security           Skip security analysis
  -h, --help              Show this help message

Examples:
  node run-audit-sdk.js
  node run-audit-sdk.js --repo https://github.com/user/repo
  node run-audit-sdk.js --repo https://github.com/user/repo --token ghp_xxx

Note: This script requires @mastra/client-js package.
Install it with: npm install @mastra/client-js
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
  displayReport
};

