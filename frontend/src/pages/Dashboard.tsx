import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { metricsApi, callsApi } from '@/lib/api'
import { formatDuration } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Link } from 'react-router-dom'
import { Phone, FileText, Clock, CheckCircle } from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => metricsApi.getOverview(),
  })

  const { data: recentCalls } = useQuery({
    queryKey: ['calls', { page: 1, per_page: 5, order: 'desc' }],
    queryFn: () => callsApi.list({ page: 1, per_page: 5, order: 'desc' }),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const sentimentData = Object.entries(metrics.sentiments).map(([name, value]) => ({
    name,
    value,
  }))

  const emotionData = Object.entries(metrics.emotions).map(([name, value]) => ({
    name,
    value,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your call analysis system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_calls}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.total_segments} segments processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Words</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_words.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all transcripts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(metrics.total_duration_sec)}</div>
            <p className="text-xs text-muted-foreground">
              Audio processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completed_chunks}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pending_chunks} pending
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
            <CardDescription>Distribution of sentiment labels across segments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emotion Distribution</CardTitle>
            <CardDescription>Distribution of emotion labels across segments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={emotionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {emotionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trigger Statistics</CardTitle>
            <CardDescription>Trigger evaluation results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Triggers</span>
                <span className="font-semibold">{metrics.total_triggers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Evaluations</span>
                <span className="font-semibold">{metrics.total_trigger_evals}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600">Matched</span>
                <span className="font-semibold">{metrics.triggers_matched}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600">Unmatched</span>
                <span className="font-semibold">{metrics.triggers_unmatched}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
            <CardDescription>Latest uploaded calls</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCalls?.items && recentCalls.items.length > 0 ? (
              <div className="space-y-2">
                {recentCalls.items.map((call) => (
                  <Link
                    key={call.id}
                    to={`/calls/${call.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{call.call_data?.call_name || call.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(call.upload_time).toLocaleDateString()}
                      </p>
                    </div>
                    {call.call_data?.sentiment_label && (
                      <span className="text-xs rounded-full bg-secondary px-2 py-1">
                        {call.call_data.sentiment_label}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No calls yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

