import { StartScanRequest, StartScanResponse, ScanStatus, AuditReport } from '@/types/audit'

// Default to Mastra Cloud API; override via NEXT_PUBLIC_API_URL if needed
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sparse-incalculable-house.mastra.cloud/api'
// Cloud lists this workflow under the key "web3AuditWorkflow"
const WORKFLOW_ID = 'web3AuditWorkflow'

export class AuditService {
  private static instance: AuditService
  
  private generateRunId(): string {
    try {
      // Prefer crypto.randomUUID when available
      // @ts-ignore
      if (typeof crypto !== 'undefined' && crypto?.randomUUID) {
        // @ts-ignore
        return crypto.randomUUID()
      }
    } catch {}
    // Fallback: time + random
    return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  }
  
  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService()
    }
    return AuditService.instance
  }

  async startScan(request: StartScanRequest): Promise<StartScanResponse> {
    const runScanId = this.generateRunId()
    // 1) Create run to get/confirm runId
    const create = await fetch(`${API_BASE_URL}/workflows/${WORKFLOW_ID}/create-run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Some Mastra Cloud deployments expect only the runId at create time
      body: JSON.stringify({ runId: runScanId }),
    })

    if (!create.ok) {
      const text = await create.text()
      throw new Error(`Failed to create run: ${create.status} ${text}`)
    }
    const created: any = await create.json()
    const runId = created?.runId || runScanId

    // 2) Kick off stream (non-blocking) and supply inputData
    try {
      fetch(`${API_BASE_URL}/workflows/${WORKFLOW_ID}/stream?runId=${encodeURIComponent(runId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputData: {
            scanId: runId,
            repoUrl: request.repoUrl,
            includeSecurityAnalysis: true,
          },
        }),
      }).catch(() => {})
    } catch {}

    return { scanId: runId, status: 'started' }
  }

  async getScanStatus(scanId: string): Promise<ScanStatus> {
    const response = await fetch(`${API_BASE_URL}/workflows/${WORKFLOW_ID}/runs/${scanId}`)
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Failed to get scan status: ${response.status} ${text}`)
    }
    const json: any = await response.json()
    const cloudStatus: string = json?.status || json?.run?.status || 'running'
    let status: ScanStatus['status'] = 'in_progress'
    let progress = 50
    if (['queued', 'pending'].includes(cloudStatus)) { status = 'in_progress'; progress = 10 }
    if (['running', 'started', 'active'].includes(cloudStatus)) { status = 'in_progress'; progress = 70 }
    if (['completed', 'succeeded', 'success'].includes(cloudStatus)) { status = 'completed'; progress = 100 }
    if (['failed', 'errored', 'error', 'cancelled'].includes(cloudStatus)) { status = 'failed'; progress = 0 }
    return { scanId, status, progress }
  }

  async getScanReport(scanId: string): Promise<AuditReport> {
    const response = await fetch(`${API_BASE_URL}/workflows/${WORKFLOW_ID}/runs/${scanId}/execution-result`)
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Failed to get scan report: ${response.status} ${text}`)
    }
    const json: any = await response.json()
    // Cloud may wrap output; normalize
    return (json?.result || json?.output || json) as AuditReport
  }

  async pollScanStatus(
    scanId: string, 
    onProgress: (status: ScanStatus) => void,
    intervalMs: number = 2000
  ): Promise<AuditReport> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getScanStatus(scanId)
          onProgress(status)

          // Try to fetch final result proactively when status looks finished
          if (status.status === 'completed') {
            const report = await this.getScanReport(scanId)
            return resolve(report)
          }

          if (status.status === 'failed') {
            return reject(new Error(status.error || 'Scan failed'))
          }

          // Opportunistic check: some clouds mark runs as running but have execution-result ready
          try {
            const report = await this.getScanReport(scanId)
            if (report && report.repoUrl) {
              return resolve(report)
            }
          } catch {}

          // Continue polling
          setTimeout(poll, intervalMs)
        } catch (error) {
          reject(error)
        }
      }

      poll()
    })
  }
}
