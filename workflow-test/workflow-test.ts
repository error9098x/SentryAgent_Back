#!/usr/bin/env npx tsx

/**
 * Mastra Web3 Audit Workflow Test
 * 
 * This script demonstrates the correct way to integrate with Mastra workflows
 * using direct OpenAPI endpoints (not the buggy SDK).
 */

const BASE_URL = 'http://localhost:4111';
const WORKFLOW_ID = 'web3AuditWorkflow';

interface WorkflowInput {
  scanId?: string;
  repoUrl: string;
  token?: string;
  includeSecurityAnalysis?: boolean;
}

interface WorkflowOutput {
  scanId: string;
  repoUrl: string;
  summary: string;
  counts: {
    filesScanned: number;
    solidityFiles: number;
    vulnerabilities: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  languages: Array<{ name: string; files: number }>;
  issues: Array<{
    id: string;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    file: string;
    line?: number;
    snippet?: string;
    problem: string;
    recommendation: string;
    confidence: number;
  }>;
  recommendations: string[];
}

/**
 * Execute a Mastra workflow using the correct OpenAPI endpoints
 */
async function runWorkflow(inputData: WorkflowInput): Promise<WorkflowOutput> {
  console.log('🚀 Starting Web3 Audit Workflow...\n');
  console.log('📋 Input Data:');
  console.log(JSON.stringify(inputData, null, 2));
  console.log('\n');

  try {
    // Step 1: Create a workflow run
    console.log('🎯 Creating workflow run...');
    const createRunResponse = await fetch(`${BASE_URL}/api/workflows/${WORKFLOW_ID}/create-run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!createRunResponse.ok) {
      throw new Error(`Failed to create run: ${createRunResponse.status} ${createRunResponse.statusText}`);
    }

    const { runId } = await createRunResponse.json();
    console.log(`✅ Run created with ID: ${runId}\n`);

    // Step 2: Start the workflow and get results
    console.log('▶️  Starting workflow execution...');
    const startTime = Date.now();
    
    const startResponse = await fetch(`${BASE_URL}/api/workflows/${WORKFLOW_ID}/start-async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: runId,
        inputData: inputData
      })
    });

    if (!startResponse.ok) {
      throw new Error(`Failed to start workflow: ${startResponse.status} ${startResponse.statusText}`);
    }

    const result = await startResponse.json();
    const executionTime = Date.now() - startTime;
    console.log(`⏱️  Execution completed in ${executionTime}ms\n`);

    if (result.status !== 'success') {
      throw new Error(`Workflow failed with status: ${result.status}`);
    }

    return result.result;

  } catch (error) {
    console.error('\n💥 Error running workflow:');
    console.error('==========================');
    console.error('Message:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Display workflow results in a formatted way
 */
function displayResults(result: WorkflowOutput) {
  console.log('📊 WORKFLOW RESULTS:');
  console.log('====================');
  
  // Summary
  console.log(`\n📄 Summary: ${result.summary}`);
  console.log(`🆔 Scan ID: ${result.scanId}`);
  console.log(`🔗 Repository: ${result.repoUrl}`);
  
  // Statistics
  console.log('\n📈 Statistics:');
  console.log(`   📁 Files Scanned: ${result.counts.filesScanned}`);
  console.log(`   📜 Solidity Files: ${result.counts.solidityFiles}`);
  console.log(`   🚨 Total Vulnerabilities: ${result.counts.vulnerabilities}`);
  
  // Severity breakdown
  console.log('\n🎯 Severity Breakdown:');
  console.log(`   🔴 Critical: ${result.counts.bySeverity.critical}`);
  console.log(`   🟠 High: ${result.counts.bySeverity.high}`);
  console.log(`   🟡 Medium: ${result.counts.bySeverity.medium}`);
  console.log(`   🔵 Low: ${result.counts.bySeverity.low}`);
  
  // Languages
  if (result.languages.length > 0) {
    console.log('\n💻 Languages Detected:');
    result.languages.forEach(lang => {
      console.log(`   • ${lang.name}: ${lang.files} files`);
    });
  }
  
  // Issues
  if (result.issues.length > 0) {
    console.log('\n🚨 Security Issues:');
    result.issues.forEach((issue, index) => {
      const severityIcon = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🔵'
      }[issue.severity] || '⚪';
      
      console.log(`\n${index + 1}. ${severityIcon} ${issue.title}`);
      console.log(`   Severity: ${issue.severity.toUpperCase()}`);
      console.log(`   File: ${issue.file}${issue.line ? ` (Line ${issue.line})` : ''}`);
      console.log(`   Problem: ${issue.problem}`);
      console.log(`   Fix: ${issue.recommendation}`);
      console.log(`   Confidence: ${Math.round(issue.confidence * 100)}%`);
    });
  }
  
  // Recommendations
  if (result.recommendations.length > 0) {
    console.log('\n💡 General Recommendations:');
    result.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n✅ Audit completed successfully!');
}

/**
 * Main execution function
 */
async function main() {
  const inputData: WorkflowInput = {
    scanId: Date.now().toString(),
    repoUrl: "https://github.com/error9098x/YieldNest",
    token: "", // Optional - add your GitHub token here if needed
    includeSecurityAnalysis: true
  };

  try {
    const result = await runWorkflow(inputData);
    displayResults(result);
    
    console.log('\n🔗 API Information:');
    console.log('===================');
    console.log(`Endpoint: ${BASE_URL}`);
    console.log(`Workflow ID: ${WORKFLOW_ID}`);
    console.log('Method: Direct OpenAPI calls (create-run → start-async)');
    console.log('✅ Integration successful!');
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('Please check:');
    console.error('1. Mastra server is running at', BASE_URL);
    console.error('2. Workflow "web3AuditWorkflow" is deployed');
    console.error('3. Repository URL is accessible');
    process.exit(1);
  }
}

// Run the test
main();