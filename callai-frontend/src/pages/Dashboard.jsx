import { useEffect, useState } from "react"
import axios from "axios"
import { api } from "@/lib/api"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get(api("/metrics"))
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error fetching metrics:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading)
    return <p className="p-6 text-muted-foreground">Loading metrics…</p>
  if (!data)
    return <p className="p-6 text-destructive">Failed to load metrics.</p>

  const COLORS = [
    "#2563eb", "#22c55e", "#f97316", "#eab308",
    "#a855f7", "#ec4899", "#06b6d4", "#94a3b8",
  ]

  // Pie chart datasets
  const progressData = [
    { name: "Completed", value: data.completed_chunks },
    { name: "Pending", value: data.pending_chunks },
  ]

  const triggerData = [
    { name: "Matched", value: data.triggers_matched },
    { name: "Unmatched", value: data.triggers_unmatched },
  ]

  const sentimentData = Object.entries(data.sentiments).map(([k, v]) => ({
    name: k,
    value: v,
  }))
  const emotionData = Object.entries(data.emotions).map(([k, v]) => ({
    name: k,
    value: v,
  }))

  return (
    <div className="p-6 space-y-8">
      {/* Overview Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Calls" value={data.total_calls} />
        <StatCard title="Total Words" value={data.total_words} />
        <StatCard title="Total Segments" value={data.total_segments} />
        <StatCard
          title="Total Duration (s)"
          value={data.total_duration_sec.toLocaleString()}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ChartCard title="Processing Progress">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={progressData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                <Cell fill="#22c55e" />
                <Cell fill="#f97316" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Trigger Match Status">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={triggerData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                <Cell fill="#3b82f6" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sentiment Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sentimentData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {sentimentData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Emotion Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={emotionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {emotionData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <p className="text-sm text-muted-foreground text-right">
        Last generated at:{" "}
        {new Date(data.generated_at).toLocaleString()}
      </p>
    </div>
  )
}

function StatCard({ title, value }) {
  return (
    <Card className="border-muted bg-card hover:bg-muted/20 transition">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
      </CardContent>
    </Card>
  )
}

function ChartCard({ title, children }) {
  return (
    <Card className="border-muted bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
