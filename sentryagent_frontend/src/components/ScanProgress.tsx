"use client"

import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScanStatus } from '@/types/audit'
import { formatDuration } from '@/lib/utils'
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'

interface ScanProgressProps {
  scanStatus: ScanStatus
  startTime: number
}

export function ScanProgress({ scanStatus, startTime }: ScanProgressProps) {
  const getStatusIcon = () => {
    switch (scanStatus.status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusText = () => {
    switch (scanStatus.status) {
      case 'pending':
        return 'Initializing scan...'
      case 'in_progress':
        return 'Analyzing repository...'
      case 'completed':
        return 'Scan completed successfully!'
      case 'failed':
        return `Scan failed: ${scanStatus.error || 'Unknown error'}`
      default:
        return 'Unknown status'
    }
  }

  const getProgressSteps = () => {
    const steps = [
      { name: 'Fetching Repository', progress: 25 },
      { name: 'Analyzing Structure', progress: 50 },
      { name: 'Running Security Agents', progress: 80 },
      { name: 'Generating Report', progress: 100 },
    ]

    return steps.map((step, index) => ({
      ...step,
      completed: scanStatus.progress >= step.progress,
      current: scanStatus.progress >= (index > 0 ? steps[index - 1].progress : 0) && 
               scanStatus.progress < step.progress,
    }))
  }

  const elapsedTime = Date.now() - startTime

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Scan Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">{getStatusText()}</span>
            <span className="text-sm text-gray-500">
              {formatDuration(elapsedTime)}
            </span>
          </div>
          <Progress value={scanStatus.progress} className="w-full" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>{scanStatus.progress}%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Analysis Steps:</h4>
          {getProgressSteps().map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step.completed 
                  ? 'bg-green-100 text-green-600' 
                  : step.current 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {step.completed ? '✓' : index + 1}
              </div>
              <span className={`text-sm ${
                step.completed 
                  ? 'text-green-600 font-medium' 
                  : step.current 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-500'
              }`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
          <strong>Scan ID:</strong> {scanStatus.scanId}
        </div>
      </CardContent>
    </Card>
  )
}
