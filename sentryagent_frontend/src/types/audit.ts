export interface VulnerabilityFinding {
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
  confidence?: number
  references?: string[]
}

export interface ScanStatus {
  scanId: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  progress: number
  result?: AuditReport
  error?: string
}

export interface AuditReport {
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
  issues: VulnerabilityFinding[]
  recommendations: string[]
}

export interface StartScanRequest {
  repoUrl: string
  token?: string
  model?: string
}

export interface StartScanResponse {
  scanId: string
  status: string
}
