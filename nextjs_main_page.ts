import { useState } from 'react'
import Head from 'next/head'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react'

interface JobData {
  id: string
  phase: string
  progress: number
  opportunity_cost?: number
  recoverable_monthly?: number
  jobs_line?: string
  metrics?: any
}

export default function BottlnekkDashboard() {
  const [jobData, setJobData] = useState<JobData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startDiagnosis = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user_' + Math.random().toString(36).substr(2, 9)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start diagnosis')
      }

      const data = await response.json()
      
      // Open Merge Link in new tab
      if (data.connectUrl) {
        window.open(data.connectUrl, '_blank')
      }

      // Start polling for job status
      pollJobStatus(data.jobId)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/job/${jobId}`)
        if (response.ok) {
          const job = await response.json()
          setJobData(job)
          
          if (job.phase === 'ready') {
            setLoading(false)
            return // Stop polling
          }
          
          if (job.phase === 'error') {
            setError('Analysis failed')
            setLoading(false)
            return
          }
        }
        
        // Continue polling every 3 seconds
        setTimeout(poll, 3000)
      } catch (err) {
        console.error('Polling error:', err)
        setTimeout(poll, 3000) // Continue polling despite errors
      }
    }
    
    poll()
  }

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const getPhaseDisplay = (phase: string) => {
    const phases: Record<string, string> = {
      'awaiting_connection': 'Awaiting Connection',
      'syncing': 'Syncing Data',
      'scanning': 'Analyzing Business',
      'ready': 'Analysis Complete',
      'error': 'Error'
    }
    return phases[phase] || phase
  }

  return (
    <>
      <Head>
        <title>Bottlnekk - Revenue Recovery Analysis</title>
        <meta name="description" content="Discover hidden revenue opportunities in your business" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-4 pt-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Bottlnekk
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover hidden revenue leaks in your CRM and calendar data
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {!jobData && !loading && (
              <Card className="max-w-md mx-auto">
                <CardHeader className="text-center">
                  <CardTitle>Revenue Leak Analysis</CardTitle>
                  <CardDescription>
                    Connect your business tools to identify opportunity costs and recoverable revenue
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    onClick={startDiagnosis}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Start Revenue Diagnosis
                  </Button>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card className="max-w-md mx-auto">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {jobData ? getPhaseDisplay(jobData.phase) : 'Starting Analysis'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {jobData && (
                    <>
                      <Progress value={jobData.progress || 0} className="w-full" />
                      <p className="text-center text-sm text-gray-600">
                        {jobData.progress || 0}% Complete
                      </p>
                      {jobData.phase === 'syncing' && (
                        <p className="text-center text-sm text-gray-500">
                          Analyzing your business data...
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {jobData?.phase === 'ready' && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Opportunity Cost */}
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      Monthly Opportunity Cost
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {formatCurrency(jobData.opportunity_cost)}
                    </div>
                    <p className="text-sm text-red-600">
                      Revenue lost to operational inefficiencies
                    </p>
                  </CardContent>
                </Card>

                {/* Recoverable Revenue */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <DollarSign className="h-5 w-5" />
                      Recoverable Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatCurrency(jobData.recoverable_monthly)}
                    </div>
                    <p className="text-sm text-green-600">
                      Estimated monthly recovery potential
                    </p>
                  </CardContent>
                </Card>

                {/* Key Insight */}
                {jobData.jobs_line && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Key Finding</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-base">
                          {jobData.jobs_line}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                )}

                {/* Action Button */}
                <Card className="md:col-span-2">
                  <CardContent className="pt-6 text-center">
                    <Button 
                      size="lg"
                      onClick={() => window.open('https://calendly.com/your-link', '_blank')}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      Get Recovery Plan
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      Schedule a consultation to discuss implementation
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {error && (
              <Card className="max-w-md mx-auto border-red-200">
                <CardContent className="pt-6">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  )
}