import React, { useState } from 'react';

// Types
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

// Custom Hook for Workflow Integration
function useWorkflow(serverUrl: string) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkflowOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runWorkflow = async (inputData: WorkflowInput) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Create workflow run
      const createResponse = await fetch(`${serverUrl}/api/workflows/web3AuditWorkflow/create-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create run: ${createResponse.status} ${createResponse.statusText}`);
      }

      const { runId } = await createResponse.json();

      // Step 2: Start workflow and get results
      const startResponse = await fetch(`${serverUrl}/api/workflows/web3AuditWorkflow/start-async`, {
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

      const workflowResult = await startResponse.json();

      if (workflowResult.status !== 'success') {
        throw new Error(`Workflow failed with status: ${workflowResult.status}`);
      }

      setResult(workflowResult.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { runWorkflow, loading, result, error };
}

// Main Component
export function MastraWorkflowTester() {
  const [serverUrl, setServerUrl] = useState('http://localhost:4111');
  const [repoUrl, setRepoUrl] = useState('https://github.com/error9098x/YieldNest');
  const [token, setToken] = useState('');
  const [includeSecurityAnalysis, setIncludeSecurityAnalysis] = useState(true);
  
  const { runWorkflow, loading, result, error } = useWorkflow(serverUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoUrl.trim()) {
      alert('Repository URL is required');
      return;
    }

    await runWorkflow({
      repoUrl: repoUrl.trim(),
      token: token.trim() || undefined,
      includeSecurityAnalysis
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Mastra Web3 Audit Workflow</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Mastra Server URL
            </label>
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="http://localhost:4111"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Repository URL *
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="https://github.com/username/repository"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              GitHub Token (Optional)
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="ghp_..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="securityAnalysis"
              checked={includeSecurityAnalysis}
              onChange={(e) => setIncludeSecurityAnalysis(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="securityAnalysis" className="text-sm font-medium">
              Include Security Analysis
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Running Audit...' : 'Run Security Audit'}
          </button>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-xl font-bold">Audit Results</h2>
          
          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Summary</h3>
            <p className="text-gray-700">{result.summary}</p>
            <div className="mt-2 text-sm text-gray-600">
              Scan ID: {result.scanId}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{result.counts.filesScanned}</div>
              <div className="text-sm text-blue-700">Files Scanned</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{result.counts.solidityFiles}</div>
              <div className="text-sm text-purple-700">Solidity Files</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{result.counts.vulnerabilities}</div>
              <div className="text-sm text-red-700">Vulnerabilities</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{result.languages.length}</div>
              <div className="text-sm text-green-700">Languages</div>
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Vulnerability Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="flex items-center justify-between">
                <span className="text-red-600 font-medium">Critical:</span>
                <span className="font-bold">{result.counts.bySeverity.critical}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-orange-600 font-medium">High:</span>
                <span className="font-bold">{result.counts.bySeverity.high}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-600 font-medium">Medium:</span>
                <span className="font-bold">{result.counts.bySeverity.medium}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-600 font-medium">Low:</span>
                <span className="font-bold">{result.counts.bySeverity.low}</span>
              </div>
            </div>
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Security Issues</h3>
              <div className="space-y-4">
                {result.issues.map((issue) => (
                  <div key={issue.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{issue.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                        {issue.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{issue.description}</p>
                    <div className="text-xs text-gray-600 mb-2">
                      File: {issue.file} {issue.line && `(Line ${issue.line})`}
                    </div>
                    {issue.snippet && (
                      <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto mb-2">
                        <code>{issue.snippet}</code>
                      </pre>
                    )}
                    <div className="text-sm">
                      <div className="mb-1">
                        <span className="font-medium text-red-700">Problem:</span> {issue.problem}
                      </div>
                      <div>
                        <span className="font-medium text-green-700">Recommendation:</span> {issue.recommendation}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Confidence: {Math.round(issue.confidence * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">General Recommendations</h3>
              <ul className="list-disc list-inside space-y-1">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="text-gray-700">{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MastraWorkflowTester;
