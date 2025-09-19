"use client"

import { useState } from 'react'
import { ScanForm } from '@/components/ScanForm'
import { ScanProgress } from '@/components/ScanProgress'
import { AuditReport } from '@/components/AuditReport'
import { AuditService } from '@/services/auditService'
import { StartScanRequest, ScanStatus, AuditReport as AuditReportType } from '@/types/audit'
import { Shield, Zap, Users, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type AppState = 'form' | 'scanning' | 'report' | 'error'

export default function Home() {
  const [state, setState] = useState<AppState>('form')
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null)
  const [auditReport, setAuditReport] = useState<AuditReportType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanStartTime, setScanStartTime] = useState<number>(0)

  const auditService = AuditService.getInstance()

  const handleStartScan = async (request: StartScanRequest) => {
    try {
      setState('scanning')
      setError(null)
      setScanStartTime(Date.now())
      
      const response = await auditService.startScan(request)
      
      // Start polling for status
      const report = await auditService.pollScanStatus(
        response.scanId,
        (status) => {
          setScanStatus(status)
        }
      )
      
      setAuditReport(report)
      setState('report')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      setState('error')
    }
  }

  const handleNewScan = () => {
    setState('form')
    setScanStatus(null)
    setAuditReport(null)
    setError(null)
    setScanStartTime(0)
  }

  const renderContent = () => {
    switch (state) {
      case 'form':
        return <ScanForm onStartScan={handleStartScan} isScanning={false} />
      
      case 'scanning':
        return scanStatus ? (
          <ScanProgress scanStatus={scanStatus} startTime={scanStartTime} />
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing scan...</p>
          </div>
        )
      
      case 'report':
        return auditReport ? (
          <AuditReport report={auditReport} onNewScan={handleNewScan} />
        ) : null
      
      case 'error':
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-red-600">Scan Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{error}</p>
              <button
                onClick={handleNewScan}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </CardContent>
          </Card>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SentryAgent</h1>
                <p className="text-sm text-gray-500">AI-Powered Web3 Security Auditing</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>Multi-Agent Analysis</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>Web3 Focused</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Expert AI Agents</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {state === 'form' && (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Comprehensive Smart Contract Security Analysis
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Our AI agents specialize in detecting reentrancy vulnerabilities, access control issues, 
                oracle manipulation attacks, and other critical Web3 security flaws.
              </p>
              
              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Shield className="h-5 w-5 text-red-600" />
                      </div>
                      Reentrancy Detection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Identifies CEI pattern violations, missing nonReentrant guards, and cross-function reentrancy vulnerabilities
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Users className="h-5 w-5 text-orange-600" />
                      </div>
                      Access Control
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Detects missing onlyOwner modifiers, unprotected initialization, and centralization risks
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Target className="h-5 w-5 text-yellow-600" />
                      </div>
                      Oracle Manipulation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Identifies unsafe oracle usage, flash loan attack vectors, and missing TWAP implementations
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>Powered by specialized AI agents using Qwen 3 Coder 480B model</p>
            <p className="mt-2">Built with Mastra AI Framework • Next.js • Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </div>
  )
}