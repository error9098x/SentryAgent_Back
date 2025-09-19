<template>
  <div class="max-w-4xl mx-auto p-6 space-y-6">
    <!-- Form -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold mb-6">Mastra Web3 Audit Workflow - Vue.js</h1>
      
      <form @submit.prevent="runAudit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">
            Mastra Server URL
          </label>
          <input
            v-model="serverUrl"
            type="url"
            class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="http://localhost:4111"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">
            Repository URL *
          </label>
          <input
            v-model="repoUrl"
            type="url"
            class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="https://github.com/username/repository"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">
            GitHub Token (Optional)
          </label>
          <input
            v-model="token"
            type="password"
            class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="ghp_..."
          />
        </div>

        <div class="flex items-center space-x-2">
          <input
            v-model="includeSecurityAnalysis"
            type="checkbox"
            id="securityAnalysis"
            class="rounded"
          />
          <label for="securityAnalysis" class="text-sm font-medium">
            Include Security Analysis
          </label>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Running Audit...' : 'Run Security Audit' }}
        </button>
      </form>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 class="text-red-800 font-semibold">Error</h3>
      <p class="text-red-700">{{ error }}</p>
    </div>

    <!-- Results Display -->
    <div v-if="result" class="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h2 class="text-xl font-bold">Audit Results</h2>
      
      <!-- Summary -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-semibold mb-2">Summary</h3>
        <p class="text-gray-700">{{ result.summary }}</p>
        <div class="mt-2 text-sm text-gray-600">
          Scan ID: {{ result.scanId }}
        </div>
      </div>

      <!-- Statistics -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-blue-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-blue-600">{{ result.counts.filesScanned }}</div>
          <div class="text-sm text-blue-700">Files Scanned</div>
        </div>
        <div class="bg-purple-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-purple-600">{{ result.counts.solidityFiles }}</div>
          <div class="text-sm text-purple-700">Solidity Files</div>
        </div>
        <div class="bg-red-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-red-600">{{ result.counts.vulnerabilities }}</div>
          <div class="text-sm text-red-700">Vulnerabilities</div>
        </div>
        <div class="bg-green-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-green-600">{{ result.languages.length }}</div>
          <div class="text-sm text-green-700">Languages</div>
        </div>
      </div>

      <!-- Severity Breakdown -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-semibold mb-3">Vulnerability Breakdown</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div class="flex items-center justify-between">
            <span class="text-red-600 font-medium">Critical:</span>
            <span class="font-bold">{{ result.counts.bySeverity.critical }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-orange-600 font-medium">High:</span>
            <span class="font-bold">{{ result.counts.bySeverity.high }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-yellow-600 font-medium">Medium:</span>
            <span class="font-bold">{{ result.counts.bySeverity.medium }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-blue-600 font-medium">Low:</span>
            <span class="font-bold">{{ result.counts.bySeverity.low }}</span>
          </div>
        </div>
      </div>

      <!-- Issues -->
      <div v-if="result.issues.length > 0">
        <h3 class="font-semibold mb-3">Security Issues</h3>
        <div class="space-y-4">
          <div v-for="issue in result.issues" :key="issue.id" class="border rounded-lg p-4">
            <div class="flex items-start justify-between mb-2">
              <h4 class="font-semibold text-gray-900">{{ issue.title }}</h4>
              <span :class="getSeverityClasses(issue.severity)">
                {{ issue.severity.toUpperCase() }}
              </span>
            </div>
            <p class="text-gray-700 text-sm mb-2">{{ issue.description }}</p>
            <div class="text-xs text-gray-600 mb-2">
              File: {{ issue.file }} <span v-if="issue.line">(Line {{ issue.line }})</span>
            </div>
            <pre v-if="issue.snippet" class="bg-gray-100 rounded p-2 text-xs overflow-x-auto mb-2">
              <code>{{ issue.snippet }}</code>
            </pre>
            <div class="text-sm">
              <div class="mb-1">
                <span class="font-medium text-red-700">Problem:</span> {{ issue.problem }}
              </div>
              <div>
                <span class="font-medium text-green-700">Recommendation:</span> {{ issue.recommendation }}
              </div>
            </div>
            <div class="mt-2 text-xs text-gray-500">
              Confidence: {{ Math.round(issue.confidence * 100) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div v-if="result.recommendations.length > 0">
        <h3 class="font-semibold mb-3">General Recommendations</h3>
        <ul class="list-disc list-inside space-y-1">
          <li v-for="(rec, index) in result.recommendations" :key="index" class="text-gray-700">
            {{ rec }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Types
interface WorkflowInput {
  scanId?: string
  repoUrl: string
  token?: string
  includeSecurityAnalysis?: boolean
}

interface WorkflowOutput {
  scanId: string
  repoUrl: string
  summary: string
  counts: {
    filesScanned: number
    solidityFiles: number
    vulnerabilities: number
    bySeverity: {
      critical: number
      high: number
      medium: number
      low: number
    }
  }
  languages: Array<{ name: string; files: number }>
  issues: Array<{
    id: string
    type: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    title: string
    description: string
    file: string
    line?: number
    snippet?: string
    problem: string
    recommendation: string
    confidence: number
  }>
  recommendations: string[]
}

// Reactive state
const serverUrl = ref('http://localhost:4111')
const repoUrl = ref('https://github.com/error9098x/YieldNest')
const token = ref('')
const includeSecurityAnalysis = ref(true)
const loading = ref(false)
const result = ref<WorkflowOutput | null>(null)
const error = ref<string | null>(null)

// Mastra Workflow API Client
class MastraWorkflowClient {
  constructor(private serverUrl: string) {
    this.serverUrl = serverUrl.replace(/\/$/, '') // Remove trailing slash
  }

  async runWorkflow(inputData: WorkflowInput): Promise<WorkflowOutput> {
    try {
      // Step 1: Create workflow run
      const createResponse = await fetch(`${this.serverUrl}/api/workflows/web3AuditWorkflow/create-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!createResponse.ok) {
        throw new Error(`Failed to create run: ${createResponse.status} ${createResponse.statusText}`)
      }

      const { runId } = await createResponse.json()

      // Step 2: Start workflow and get results
      const startResponse = await fetch(`${this.serverUrl}/api/workflows/web3AuditWorkflow/start-async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: runId,
          inputData: inputData
        })
      })

      if (!startResponse.ok) {
        throw new Error(`Failed to start workflow: ${startResponse.status} ${startResponse.statusText}`)
      }

      const workflowResult = await startResponse.json()

      if (workflowResult.status !== 'success') {
        throw new Error(`Workflow failed with status: ${workflowResult.status}`)
      }

      return workflowResult.result
    } catch (error) {
      console.error('Workflow execution failed:', error)
      throw error
    }
  }
}

// Methods
const runAudit = async () => {
  if (!repoUrl.value.trim()) {
    error.value = 'Repository URL is required'
    return
  }

  loading.value = true
  error.value = null
  result.value = null

  try {
    const client = new MastraWorkflowClient(serverUrl.value)
    
    const inputData: WorkflowInput = {
      repoUrl: repoUrl.value.trim(),
      includeSecurityAnalysis: includeSecurityAnalysis.value
    }

    if (token.value.trim()) {
      inputData.token = token.value.trim()
    }

    const auditResult = await client.runWorkflow(inputData)
    result.value = auditResult
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
  } finally {
    loading.value = false
  }
}

const getSeverityClasses = (severity: string): string => {
  const baseClasses = 'px-2 py-1 rounded text-xs font-medium'
  
  switch (severity) {
    case 'critical':
      return `${baseClasses} text-red-600 bg-red-100`
    case 'high':
      return `${baseClasses} text-orange-600 bg-orange-100`
    case 'medium':
      return `${baseClasses} text-yellow-600 bg-yellow-100`
    case 'low':
      return `${baseClasses} text-blue-600 bg-blue-100`
    default:
      return `${baseClasses} text-gray-600 bg-gray-100`
  }
}
</script>

<style scoped>
/* Add any component-specific styles here */
/* TailwindCSS classes are used in the template above */
</style>
