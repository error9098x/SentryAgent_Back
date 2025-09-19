# Mastra Workflow Integration Guide

Complete guide for integrating Mastra workflows with frontend applications using the **correct OpenAPI endpoints**.

## 🚨 Important Notice

**The `@mastra/client-js` SDK has bugs and doesn't follow the OpenAPI specification correctly.** This guide shows you how to use the direct API endpoints that actually work.

## 📁 Project Structure

```
workflow-test/
├── README.md                 # This documentation
├── workflow-test.ts          # Node.js/TypeScript test script
├── workflow-tester.html      # Browser-based tester (no setup required)
├── frontend-examples/        # Frontend integration examples
│   ├── react-example.tsx     # React component example
│   ├── vanilla-js.html       # Pure JavaScript example
│   └── vue-example.vue       # Vue.js component example
└── package.json              # Dependencies and scripts
```

## 🚀 Quick Start

### Option 1: Command Line Test
```bash
npm install
npm run test
```

### Option 2: Browser Test (No Setup)
```bash
npm run test:html
# or just open workflow-tester.html in your browser
```

## 🔧 Configuration

### Server Settings
- **Local Development**: `http://localhost:4111`
- **Production**: Your deployed Mastra server URL
- **Workflow ID**: `web3AuditWorkflow`

### Input Schema
```typescript
interface WorkflowInput {
  scanId?: string;           // Optional scan identifier
  repoUrl: string;          // Required: GitHub repository URL
  token?: string;           // Optional: GitHub access token
  includeSecurityAnalysis?: boolean; // Default: true
}
```

### Output Schema
```typescript
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
  languages: Array<{
    name: string;
    files: number;
  }>;
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
```

## ✅ Correct API Usage

### Method 1: Direct API Calls (Recommended)

```typescript
const BASE_URL = 'http://localhost:4111';
const WORKFLOW_ID = 'web3AuditWorkflow';

async function runWorkflow(inputData: WorkflowInput): Promise<WorkflowOutput> {
  // Step 1: Create a workflow run
  const createRunResponse = await fetch(`${BASE_URL}/api/workflows/${WORKFLOW_ID}/create-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!createRunResponse.ok) {
    throw new Error(`Failed to create run: ${createRunResponse.status}`);
  }
  
  const { runId } = await createRunResponse.json();
  
  // Step 2: Start the workflow and get results
  const startResponse = await fetch(`${BASE_URL}/api/workflows/${WORKFLOW_ID}/start-async`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      runId: runId,
      inputData: inputData
    })
  });
  
  if (!startResponse.ok) {
    throw new Error(`Failed to start workflow: ${startResponse.status}`);
  }
  
  const result = await startResponse.json();
  
  if (result.status !== 'success') {
    throw new Error(`Workflow failed: ${result.status}`);
  }
  
  return result.result;
}

// Usage
const result = await runWorkflow({
  repoUrl: 'https://github.com/error9098x/YieldNest',
  includeSecurityAnalysis: true
});
```

### Method 2: Polling Pattern (For Long-Running Workflows)

```typescript
async function runWorkflowWithPolling(inputData: WorkflowInput): Promise<WorkflowOutput> {
  // Create run
  const createResponse = await fetch(`${BASE_URL}/api/workflows/${WORKFLOW_ID}/create-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const { runId } = await createResponse.json();
  
  // Start workflow (non-blocking)
  await fetch(`${BASE_URL}/api/workflows/${WORKFLOW_ID}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId, inputData })
  });
  
  // Poll for results
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
    
    const resultResponse = await fetch(`${BASE_URL}/api/workflows/${WORKFLOW_ID}/runs/${runId}/execution-result`);
    
    if (resultResponse.ok) {
      const result = await resultResponse.json();
      if (result.status === 'success') {
        return result.result;
      }
    }
  }
  
  throw new Error('Workflow timed out');
}
```

## ❌ What NOT to Use (Broken SDK)

```typescript
// ❌ DON'T USE - This is broken
import { MastraClient } from '@mastra/client-js';

const mastraClient = new MastraClient({ baseUrl: 'http://localhost:4111' });
const workflow = mastraClient.getWorkflow('web3AuditWorkflow');
const run = await workflow.createRunAsync();
const result = await run.start({ inputData }); // Only returns { message: "Workflow run started" }
```

## 🌐 Frontend Integration Examples

### React Hook Example

```typescript
import { useState, useCallback } from 'react';

interface UseWorkflowResult {
  runWorkflow: (input: WorkflowInput) => Promise<void>;
  loading: boolean;
  result: WorkflowOutput | null;
  error: string | null;
}

export function useWorkflow(serverUrl: string): UseWorkflowResult {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkflowOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runWorkflow = useCallback(async (inputData: WorkflowInput) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Create run
      const createResponse = await fetch(`${serverUrl}/api/workflows/web3AuditWorkflow/create-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create run: ${createResponse.status}`);
      }

      const { runId } = await createResponse.json();

      // Start workflow
      const startResponse = await fetch(`${serverUrl}/api/workflows/web3AuditWorkflow/start-async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, inputData })
      });

      if (!startResponse.ok) {
        throw new Error(`Failed to start workflow: ${startResponse.status}`);
      }

      const workflowResult = await startResponse.json();

      if (workflowResult.status !== 'success') {
        throw new Error(`Workflow failed: ${workflowResult.status}`);
      }

      setResult(workflowResult.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [serverUrl]);

  return { runWorkflow, loading, result, error };
}
```

### Vue Composable Example

```typescript
import { ref, Ref } from 'vue';

export function useWorkflow(serverUrl: string) {
  const loading = ref(false);
  const result: Ref<WorkflowOutput | null> = ref(null);
  const error = ref<string | null>(null);

  const runWorkflow = async (inputData: WorkflowInput) => {
    loading.value = true;
    error.value = null;
    result.value = null;

    try {
      // Same API calls as above...
      const workflowResult = await executeWorkflow(serverUrl, inputData);
      result.value = workflowResult;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading.value = false;
    }
  };

  return { runWorkflow, loading, result, error };
}
```

## 🔍 Error Handling

### Common Errors and Solutions

1. **404 Not Found**
   ```
   Error: Failed to create run: 404
   ```
   - **Cause**: Workflow ID doesn't exist or server not running
   - **Solution**: Check workflow ID and server status

2. **500 Internal Server Error**
   ```
   Error: Failed to start workflow: 500
   ```
   - **Cause**: Invalid input data or workflow execution error
   - **Solution**: Validate input schema and check server logs

3. **Network Errors**
   ```
   Error: fetch failed
   ```
   - **Cause**: Server unreachable or CORS issues
   - **Solution**: Check server URL and CORS configuration

### Robust Error Handling Example

```typescript
async function runWorkflowWithErrorHandling(inputData: WorkflowInput) {
  try {
    const result = await runWorkflow(inputData);
    return { success: true, data: result };
  } catch (error) {
    console.error('Workflow execution failed:', error);
    
    if (error.message.includes('404')) {
      return { success: false, error: 'Workflow not found. Check your workflow ID.' };
    }
    
    if (error.message.includes('500')) {
      return { success: false, error: 'Server error. Check your input data and try again.' };
    }
    
    if (error.message.includes('fetch failed')) {
      return { success: false, error: 'Cannot connect to server. Check your server URL.' };
    }
    
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}
```

## 🛠️ Testing

### Test Your Integration

1. **Start your Mastra server**:
   ```bash
   cd mastra_agents
   npm run dev
   ```

2. **Run the test script**:
   ```bash
   cd workflow-test
   npm run test
   ```

3. **Or use the HTML tester**:
   ```bash
   npm run test:html
   ```

### Expected Output

```json
{
  "scanId": "1758258279280",
  "repoUrl": "https://github.com/error9098x/YieldNest",
  "summary": "Scanned 18 files (1 Solidity). Found 9 vulnerabilities (crit:5, high:3, med:1, low:0).",
  "counts": {
    "filesScanned": 18,
    "solidityFiles": 1,
    "vulnerabilities": 9,
    "bySeverity": {
      "critical": 5,
      "high": 3,
      "medium": 1,
      "low": 0
    }
  },
  "issues": [
    {
      "id": "REEN-1",
      "type": "reentrancy",
      "severity": "critical",
      "title": "Reentrancy Vulnerability in emergencyWithdraw Function",
      "description": "The emergencyWithdraw function makes an external call...",
      "file": "contracts/YieldNest.sol",
      "line": 45,
      "confidence": 0.95
    }
    // ... more issues
  ],
  "recommendations": [
    "Add ReentrancyGuard and follow CEI (checks-effects-interactions).",
    "Replace tx.origin-based auth with msg.sender + Ownable/AccessControl."
  ]
}
```

## 📚 API Reference

### Available Endpoints

- `GET /api/workflows` - List all workflows
- `GET /api/workflows/{workflowId}` - Get workflow details
- `POST /api/workflows/{workflowId}/create-run` - Create a new run
- `POST /api/workflows/{workflowId}/start-async` - Start workflow (with results)
- `POST /api/workflows/{workflowId}/start` - Start workflow (fire-and-forget)
- `GET /api/workflows/{workflowId}/runs/{runId}/execution-result` - Get run results

### OpenAPI Specification

The complete OpenAPI specification is available at:
- **Local**: `http://localhost:4111/openapi.json`
- **Swagger UI**: `http://localhost:4111/` (if available)

## 🔗 Related Files

- **Workflow Definition**: `../mastra_agents/src/mastra/workflows/web3-audit-workflow.ts`
- **Mastra Configuration**: `../mastra_agents/src/mastra/index.ts`
- **OpenAPI Spec**: `../openapi.json`

## 🤝 Contributing

Found an issue or want to improve this guide? Please:

1. Test your changes with both the Node.js script and HTML tester
2. Update the documentation if you add new features
3. Ensure all examples work with the latest Mastra version

## 📄 License

This integration guide is part of the SentryAgent project.

---

## 🎯 Summary

This directory contains everything you need to integrate Mastra workflows with your frontend applications:

✅ **Clean, working examples** using the correct OpenAPI endpoints  
✅ **Multiple frontend frameworks** (React, Vue, Vanilla JS)  
✅ **Comprehensive documentation** with error handling  
✅ **No-setup browser testing** via HTML file  
✅ **Command-line testing** for development  

**Key takeaway**: Don't use `@mastra/client-js` - it's buggy. Use direct API calls instead!

### Quick Start Commands
```bash
# Test via command line
npm run test

# Test via browser (no setup)
npm run test:html
```