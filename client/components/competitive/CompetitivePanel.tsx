'use client'

import { useEffect, useState } from 'react'
import { analyticsApi, StreamingService, GrowthPrediction } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, LineChart, Line, Legend,
} from 'recharts'

const TIER_COLOR: Record<string, string> = {
  paid: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  free: 'bg-green-500/15 text-green-400 border-green-500/20',
}

const PALETTE = ['#e50914','#0071eb','#1db954','#f59e0b','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6']

const TTP = ({
  active, payload, label,
}: {
  active?: boolean; payload?: { value: number; name: string; fill?: string }[]; label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill ?? PALETTE[i] }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  )
}

function fmt(n: number | null | undefined, decimals = 1) {
  if (n == null) return '—'
  return n.toFixed(decimals)
}

export default function CompetitivePanel() {
  const [services, setServices] = useState<StreamingService[]>([])
  const [growth, setGrowth] = useState<GrowthPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([analyticsApi.competitive(), analyticsApi.growth()])
      .then(([s, g]) => {
        setServices(s)
        setGrowth(g)
      })
      .catch(() => setError('Failed to load competitive data.'))
      .finally(() => setLoading(false))
  }, [])

  // Top 10 for charts
  const top10 = services.slice(0, 10)
  const top8Growth = growth.slice(0, 8)

  // Historical subscriber lines for top 6
  const historicalData = [2020, 2021, 2022, 2023, 2024].map(year => {
    const row: Record<string, number | string> = { year: String(year) }
    top10.slice(0, 6).forEach(s => {
      const key = `subscribers_${year}_millions` as keyof StreamingService
      row[s.service_name] = (s[key] as number) ?? 0
    })
    return row
  })

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Competitive Landscape</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Streaming service comparison, subscriber trends, and growth predictions
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscribers">Subscriber Trends</TabsTrigger>
          <TabsTrigger value="growth">Growth Predictions</TabsTrigger>
          <TabsTrigger value="table">Full Table</TabsTrigger>
        </TabsList>

        {/* Overview charts */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Current subscribers */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Current Subscribers (M) — Top 10</CardTitle></CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-64 w-full" /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={top10}
                      layout="vertical"
                      margin={{ left: 110, right: 20, top: 4, bottom: 4 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="service_name"
                        tick={{ fontSize: 10 }}
                        width={110}
                      />
                      <Tooltip
                        formatter={(v) => [typeof v === "number" ? `${v.toFixed(1)}M` : String(v), "Subscribers"]}
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="subscribers_millions" radius={[0, 3, 3, 0]}>
                        {top10.map((s, i) => (
                          <Cell
                            key={i}
                            fill={s.tier === 'paid' ? PALETTE[i % 5] : PALETTE[5 + (i % 5)]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Churn vs ARPU scatter-style bar */}
            <Card>
              <CardHeader><CardTitle className="text-sm">ARPU (USD) — Top 10</CardTitle></CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-64 w-full" /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={top10.filter(s => s.arpu_usd != null)}
                      layout="vertical"
                      margin={{ left: 110, right: 20, top: 4, bottom: 4 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                      <YAxis
                        type="category"
                        dataKey="service_name"
                        tick={{ fontSize: 10 }}
                        width={110}
                      />
                      <Tooltip
                        formatter={(v) => [typeof v === "number" ? `$${v.toFixed(2)}` : String(v), "ARPU"]}
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="arpu_usd" radius={[0, 3, 3, 0]} fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscriber trends */}
        <TabsContent value="subscribers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Subscriber Growth 2020–2024 (Top 6 Services)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-72 w-full" /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={historicalData} margin={{ left: -10, right: 20, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}M`} />
                    <Tooltip
                      formatter={(v, name) => [typeof v === 'number' ? `${v.toFixed(1)}M` : String(v), String(name)]}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    {top10.slice(0, 6).map((s, i) => (
                      <Line
                        key={s.service_name}
                        type="monotone"
                        dataKey={s.service_name}
                        stroke={PALETTE[i]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Growth Predictions */}
        <TabsContent value="growth" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Predicted vs Current Subscribers (M)</CardTitle></CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-72 w-full" /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={top8Growth}
                      layout="vertical"
                      margin={{ left: 110, right: 20, top: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}M`} />
                      <YAxis type="category" dataKey="service_name" tick={{ fontSize: 10 }} width={110} />
                      <Tooltip content={<TTP />} />
                      <Legend />
                      <Bar dataKey="current_subscribers" name="Current" fill="#3b82f6" radius={[0, 3, 3, 0]} />
                      <Bar dataKey="predicted_subscribers" name="Predicted" fill="#10b981" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Projected Growth (M subscribers)</CardTitle></CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-72 w-full" /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={top8Growth}
                      layout="vertical"
                      margin={{ left: 110, right: 20, top: 4, bottom: 4 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="service_name" tick={{ fontSize: 10 }} width={110} />
                      <Tooltip
                        formatter={(v) => [typeof v === "number" ? `+${v.toFixed(1)}M` : String(v), "Growth"]}
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="projected_growth" radius={[0, 3, 3, 0]}>
                        {top8Growth.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Full Table */}
        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="p-0 overflow-auto">
              {loading ? (
                <div className="p-4"><Skeleton className="h-64 w-full" /></div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card text-xs text-muted-foreground">
                      {['Service','Tier','Subscribers (M)','Price/mo','ARPU','Churn %','Engagement','Launch'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left whitespace-nowrap font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium whitespace-nowrap">{s.service_name}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className={`text-[10px] ${TIER_COLOR[s.tier]}`}>
                            {s.tier}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 tabular-nums">{fmt(s.subscribers_millions)}M</td>
                        <td className="px-3 py-2 tabular-nums">
                          {s.monthly_price_usd ? `$${fmt(s.monthly_price_usd)}` : 'Free'}
                        </td>
                        <td className="px-3 py-2 tabular-nums">{s.arpu_usd ? `$${fmt(s.arpu_usd)}` : '—'}</td>
                        <td className="px-3 py-2 tabular-nums">
                          <span className={
                            (s.churn_rate_pct ?? 0) > 3 ? 'text-red-400' :
                            (s.churn_rate_pct ?? 0) > 2 ? 'text-yellow-400' : 'text-green-400'
                          }>
                            {fmt(s.churn_rate_pct)}%
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{s.engagement_cluster ?? '—'}</td>
                        <td className="px-3 py-2 tabular-nums text-muted-foreground">{s.launch_year ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
