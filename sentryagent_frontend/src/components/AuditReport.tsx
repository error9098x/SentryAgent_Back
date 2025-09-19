"use client"

import { AuditReport, VulnerabilityFinding } from '@/types/audit'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSeverityColor, getSeverityIcon } from '@/lib/utils'
import { 
  Shield, 
  AlertTriangle, 
  FileText, 
  Code, 
  ExternalLink,
  Download,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuditReportProps {
  report: AuditReport
  onNewScan: () => void
}

export function AuditReport({ report, onNewScan }: AuditReportProps) {
  const exportReport = () => {
    const dataStr = JSON.stringify(report, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `audit-report-${report.scanId}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const VulnerabilityCard = ({ finding }: { finding: VulnerabilityFinding }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getSeverityIcon(finding.severity)}</span>
            <div>
              <CardTitle className="text-lg">{finding.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(finding.severity)}`}>
                  {finding.severity.toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">{finding.type}</span>
              </div>
            </div>
          </div>
          {finding.confidence && (
            <div className="text-xs text-gray-500">
              Confidence: {Math.round(finding.confidence * 100)}%
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700">{finding.description}</p>
        
        {finding.snippet && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Code className="h-4 w-4" />
              Code Snippet ({finding.file}:{finding.line})
            </h4>
            <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto border">
              <code>{finding.snippet}</code>
            </pre>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium mb-2 text-red-700">Problem:</h4>
          <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-md border-l-4 border-red-200">
            {finding.problem}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2 text-green-700">Recommendation:</h4>
          <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-md border-l-4 border-green-200">
            {finding.recommendation}
          </p>
        </div>

        {finding.references && finding.references.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">References:</h4>
            <div className="space-y-1">
              {finding.references.map((ref, index) => (
                <a
                  key={index}
                  href={ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  {ref}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Security Audit Report
              </CardTitle>
              <CardDescription className="mt-1">
                {report.repoUrl}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button size="sm" onClick={onNewScan}>
                <RefreshCw className="h-4 w-4 mr-2" />
                New Scan
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{report.counts.filesScanned}</div>
              <div className="text-sm text-gray-500">Files Scanned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{report.counts.solidityFiles}</div>
              <div className="text-sm text-gray-500">Solidity Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{report.counts.vulnerabilities}</div>
              <div className="text-sm text-gray-500">Vulnerabilities</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center gap-1 mb-1">
                {report.counts.bySeverity.critical > 0 && <span className="text-red-600">🔴{report.counts.bySeverity.critical}</span>}
                {report.counts.bySeverity.high > 0 && <span className="text-orange-600">🟠{report.counts.bySeverity.high}</span>}
                {report.counts.bySeverity.medium > 0 && <span className="text-yellow-600">🟡{report.counts.bySeverity.medium}</span>}
                {report.counts.bySeverity.low > 0 && <span className="text-blue-600">🔵{report.counts.bySeverity.low}</span>}
              </div>
              <div className="text-sm text-gray-500">By Severity</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{report.summary}</p>
          
          {report.languages.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Languages Detected:</h4>
              <div className="flex flex-wrap gap-2">
                {report.languages.map((lang, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                    {lang.name} ({lang.files})
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vulnerabilities */}
      {report.issues.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Vulnerability Findings ({report.issues.length})
          </h2>
          {report.issues.map((finding, index) => (
            <VulnerabilityCard key={index} finding={finding} />
          ))}
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Security Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span className="text-sm text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
