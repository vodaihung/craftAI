'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Clock,
  Target,
  Eye,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react'

interface FormAnalyticsProps {
  formId: string
  formName: string
}

interface AnalyticsData {
  totalResponses: number
  totalViews: number
  conversionRate: number
  averageCompletionTime: number
  responsesByDay: Array<{ date: string; responses: number }>
  fieldAnalytics: Array<{
    fieldId: string
    fieldLabel: string
    completionRate: number
    averageValue?: string
    mostCommonValue?: string
  }>
  recentActivity: Array<{
    date: string
    action: string
    count: number
  }>
}

export function FormAnalytics({ formId, formName }: FormAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // For now, we'll generate mock analytics data
      // In a real app, this would fetch from /api/forms/${formId}/analytics
      const mockAnalytics: AnalyticsData = {
        totalResponses: Math.floor(Math.random() * 100) + 10,
        totalViews: Math.floor(Math.random() * 500) + 50,
        conversionRate: Math.floor(Math.random() * 40) + 10,
        averageCompletionTime: Math.floor(Math.random() * 300) + 60, // seconds
        responsesByDay: generateMockDailyData(),
        fieldAnalytics: [
          {
            fieldId: 'name',
            fieldLabel: 'Name',
            completionRate: 95,
            mostCommonValue: 'John'
          },
          {
            fieldId: 'email',
            fieldLabel: 'Email',
            completionRate: 92,
            mostCommonValue: 'gmail.com'
          },
          {
            fieldId: 'message',
            fieldLabel: 'Message',
            completionRate: 78,
            averageValue: '45 characters'
          }
        ],
        recentActivity: [
          { date: '2024-01-15', action: 'Form submitted', count: 5 },
          { date: '2024-01-14', action: 'Form viewed', count: 23 },
          { date: '2024-01-13', action: 'Form submitted', count: 3 }
        ]
      }
      
      setAnalytics(mockAnalytics)
    } catch (err) {
      setError('Failed to load analytics')
      console.error('Analytics error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [formId, timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const generateMockDailyData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const data = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toISOString().split('T')[0],
        responses: Math.floor(Math.random() * 10)
      })
    }
    
    return data
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const exportAnalytics = () => {
    if (!analytics) return
    
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Responses', analytics.totalResponses.toString()],
      ['Total Views', analytics.totalViews.toString()],
      ['Conversion Rate', `${analytics.conversionRate}%`],
      ['Average Completion Time', formatTime(analytics.averageCompletionTime)],
      [''],
      ['Field Analytics', ''],
      ...analytics.fieldAnalytics.map(field => [
        field.fieldLabel,
        `${field.completionRate}% completion`
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${formName}-analytics.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analytics Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchAnalytics}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Insights for "{formName}"</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportAnalytics}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(analytics.averageCompletionTime)}</div>
            <p className="text-xs text-muted-foreground">
              -15s from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Field Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Field Completion Rates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.fieldAnalytics.map((field) => (
              <div key={field.fieldId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{field.fieldLabel}</span>
                  <Badge variant="outline">{field.completionRate}%</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${field.completionRate}%` }}
                  />
                </div>
                {field.mostCommonValue && (
                  <p className="text-xs text-muted-foreground">
                    Most common: {field.mostCommonValue}
                  </p>
                )}
                {field.averageValue && (
                  <p className="text-xs text-muted-foreground">
                    Average: {field.averageValue}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
