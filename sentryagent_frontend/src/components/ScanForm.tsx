"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StartScanRequest } from '@/types/audit'
import { Github, Zap } from 'lucide-react'

interface ScanFormProps {
  onStartScan: (request: StartScanRequest) => void
  isScanning: boolean
}

export function ScanForm({ onStartScan, isScanning }: ScanFormProps) {
  const [repoUrl, setRepoUrl] = useState('')
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl) return

    onStartScan({
      repoUrl: repoUrl.trim(),
    })
  }

  

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          Start Web3 Security Audit
        </CardTitle>
        <CardDescription>
          Enter a GitHub repository URL to begin a comprehensive smart contract security analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="repoUrl" className="block text-sm font-medium mb-2">
              GitHub Repository URL *
            </label>
            <input
              id="repoUrl"
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              required
              disabled={isScanning}
            />
          </div>


          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white hover:from-[#6D28D9] hover:to-[#4338CA]"
            disabled={isScanning || !repoUrl}
          >
            {isScanning ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-spin" />
                Scanning Repository...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Start Security Audit
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
