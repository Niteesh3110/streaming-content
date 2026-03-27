'use client'

import { useEffect, useState } from 'react'
import { auditApi, AuditSummary, MissingColumn, FieldStat, NetflixTitle } from '@/lib/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  Database, CheckCircle2, AlertTriangle, Copy, Columns3,
} from 'lucide-react'

function StatCard({
  title, value, sub, icon: Icon, accent,
}: {
  title: string; value: string | number; sub?: string
  icon: React.ElementType; accent?: string
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${accent ?? ''}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="rounded-md bg-muted p-2">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const DTYPE_COLORS: Record<string, string> = {
  object:  'bg-blue-500/15 text-blue-400',
  int64:   'bg-green-500/15 text-green-400',
  float64: 'bg-yellow-500/15 text-yellow-400',
}

export default function AuditPanel() {
  const [summary, setSummary] = useState<AuditSummary | null>(null)
  const [missing, setMissing] = useState<MissingColumn[]>([])
  const [fieldStats, setFieldStats] = useState<FieldStat[]>([])
  const [dupItems, setDupItems] = useState<NetflixTitle[]>([])
  const [dupCount, setDupCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      auditApi.summary(),
      auditApi.missing(),
      auditApi.fieldStats(),
      auditApi.duplicates(),
    ])
      .then(([s, m, fs, d]) => {
        setSummary(s)
        setMissing(m)
        setFieldStats(fs)
        setDupItems(d.items)
        setDupCount(d.count)
      })
      .catch(() => setError('Failed to load audit data.'))
      .finally(() => setLoading(false))
  }, [])

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
        <h1 className="text-xl font-semibold">Data Audit Panel</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Dataset quality assessment for the Netflix titles catalog
        </p>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Records"
            value={summary.total_records}
            icon={Database}
          />
          <StatCard
            title="Complete Records"
            value={summary.complete_records}
            sub={`${summary.completeness_pct}% completeness`}
            icon={CheckCircle2}
            accent="text-green-400"
          />
          <StatCard
            title="Records with Nulls"
            value={summary.records_with_nulls}
            sub={`Across ${summary.columns_with_nulls} columns`}
            icon={AlertTriangle}
            accent={summary.records_with_nulls > 0 ? 'text-yellow-400' : ''}
          />
          <StatCard
            title="Duplicate Titles"
            value={summary.duplicate_titles}
            icon={Copy}
            accent={summary.duplicate_titles > 0 ? 'text-red-400' : 'text-green-400'}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="missing">
        <TabsList>
          <TabsTrigger value="missing">Missing Values</TabsTrigger>
          <TabsTrigger value="fieldstats">Field Stats</TabsTrigger>
          <TabsTrigger value="duplicates">
            Duplicates
            {dupCount > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-[10px] px-1 py-0">
                {dupCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Missing Values */}
        <TabsContent value="missing" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Missing % by Column</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={missing.filter(m => m.missing_count > 0)}
                      layout="vertical"
                      margin={{ left: 80, right: 20, top: 4, bottom: 4 }}
                    >
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }}
                        tickFormatter={v => `${v}%`} />
                      <YAxis type="category" dataKey="column" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip
                        formatter={(v) => [`${v}%`, 'Missing']}
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="missing_pct" radius={[0, 3, 3, 0]}>
                        {missing.filter(m => m.missing_count > 0).map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.missing_pct > 30 ? '#ef4444' : entry.missing_pct > 10 ? '#f59e0b' : '#3b82f6'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Null Count by Column</CardTitle></CardHeader>
              <CardContent className="overflow-auto max-h-64">
                {loading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="pb-2 text-left">Column</th>
                        <th className="pb-2 text-right">Missing</th>
                        <th className="pb-2 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missing.map(m => (
                        <tr key={m.column} className="border-b border-border/50">
                          <td className="py-1.5 font-mono text-xs">{m.column}</td>
                          <td className="py-1.5 text-right tabular-nums">
                            {m.missing_count.toLocaleString()}
                          </td>
                          <td className={`py-1.5 text-right tabular-nums ${
                            m.missing_pct > 30 ? 'text-red-400' :
                            m.missing_pct > 10 ? 'text-yellow-400' :
                            m.missing_pct > 0  ? 'text-blue-400'  : 'text-green-400'
                          }`}>
                            {m.missing_pct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Field Stats */}
        <TabsContent value="fieldstats" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Columns3 className="size-4" /> Column Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="pb-2 text-left">Column</th>
                      <th className="pb-2 text-left">Type</th>
                      <th className="pb-2 text-right">Unique</th>
                      <th className="pb-2 text-right">Nulls</th>
                      <th className="pb-2 text-right">Min</th>
                      <th className="pb-2 text-right">Max</th>
                      <th className="pb-2 text-right">Mean</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fieldStats.map(f => (
                      <tr key={f.column} className="border-b border-border/50">
                        <td className="py-1.5 font-mono text-xs">{f.column}</td>
                        <td className="py-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${DTYPE_COLORS[f.dtype] ?? 'bg-muted'}`}
                          >
                            {f.dtype}
                          </Badge>
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-xs">{f.unique_values.toLocaleString()}</td>
                        <td className="py-1.5 text-right tabular-nums text-xs">
                          <span className={f.null_count > 0 ? 'text-yellow-400' : 'text-green-400'}>
                            {f.null_count.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-xs text-muted-foreground">
                          {f.min !== undefined ? f.min : '—'}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-xs text-muted-foreground">
                          {f.max !== undefined ? f.max : '—'}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-xs text-muted-foreground">
                          {f.mean !== undefined ? f.mean : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Duplicates */}
        <TabsContent value="duplicates" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {dupCount === 0 ? 'No duplicate titles found' : `${dupCount} duplicate title rows`}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto max-h-96">
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : dupItems.length === 0 ? (
                <p className="text-sm text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="size-4" /> Dataset has no duplicate titles.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="pb-2 text-left">ID</th>
                      <th className="pb-2 text-left">Title</th>
                      <th className="pb-2 text-left">Type</th>
                      <th className="pb-2 text-left">Year</th>
                      <th className="pb-2 text-left">Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dupItems.map(d => (
                      <tr key={d.show_id} className="border-b border-border/50">
                        <td className="py-1.5 font-mono text-xs text-muted-foreground">{d.show_id}</td>
                        <td className="py-1.5 font-medium">{d.title}</td>
                        <td className="py-1.5 text-xs text-muted-foreground">{d.type}</td>
                        <td className="py-1.5 text-xs text-muted-foreground">{d.release_year}</td>
                        <td className="py-1.5 text-xs text-muted-foreground">{d.country?.split(',')[0]}</td>
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
