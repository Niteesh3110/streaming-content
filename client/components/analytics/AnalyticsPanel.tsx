'use client'

import { useEffect, useState } from 'react'
import {
  analyticsApi,
  AnalyticsOverview, TypeCount, YearCount, RatingCount, GenreCount, CountryCount,
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Legend,
} from 'recharts'
import { Film, Tv, Globe, Star, TrendingUp, Calendar } from 'lucide-react'

const PALETTE = ['#e50914','#0071eb','#1db954','#f59e0b','#8b5cf6','#06b6d4','#f97316','#84cc16']

function KPI({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color?: string
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div className={`rounded-md p-2 ${color ?? 'bg-muted'}`}>
            <Icon className="size-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const TTP = ({
  active, payload, label, unit,
}: {
  active?: boolean; payload?: { value: number; name: string }[]; label?: string; unit?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.name ? undefined : PALETTE[0] }}>
          {p.value.toLocaleString()}{unit ?? ''}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPanel() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [byType, setByType] = useState<TypeCount[]>([])
  const [byYear, setByYear] = useState<YearCount[]>([])
  const [addedByYear, setAddedByYear] = useState<YearCount[]>([])
  const [byRating, setByRating] = useState<RatingCount[]>([])
  const [genres, setGenres] = useState<GenreCount[]>([])
  const [countries, setCountries] = useState<CountryCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      analyticsApi.overview(),
      analyticsApi.contentByType(),
      analyticsApi.contentByYear(),
      analyticsApi.contentAddedByYear(),
      analyticsApi.contentByRating(),
      analyticsApi.genres(15),
      analyticsApi.countries(15),
    ])
      .then(([ov, bt, by, aby, br, g, c]) => {
        setOverview(ov)
        setByType(bt)
        setByYear(by.filter(d => d.year >= 2000))
        setAddedByYear(aby)
        setByRating(br.slice(0, 10))
        setGenres(g)
        setCountries(c)
      })
      .catch(() => setError('Failed to load analytics data.'))
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
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Content distribution and trend insights
        </p>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : overview && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <KPI label="Total Titles"    value={overview.total_titles}      icon={Film}      color="bg-red-600"     />
          <KPI label="Movies"          value={overview.movies}            icon={Film}      color="bg-blue-600"    />
          <KPI label="TV Shows"        value={overview.tv_shows}          icon={Tv}        color="bg-purple-600"  />
          <KPI label="Countries"       value={overview.unique_countries}  icon={Globe}     color="bg-green-600"   />
          <KPI label="Ratings"         value={overview.unique_ratings}    icon={Star}      color="bg-yellow-600"  />
          <KPI
            label="Year Range"
            value={`${overview.release_year_range.min}–${overview.release_year_range.max}`}
            icon={Calendar}
            color="bg-cyan-600"
          />
        </div>
      )}

      {/* Charts grid */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Content by Type — Pie */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Content by Type</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52 w-full" /> : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={byType}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {byType.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [typeof v === 'number' ? v.toLocaleString() : v, 'Titles']}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Titles Added by Year — Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="size-4" /> Titles Added to Netflix by Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52 w-full" /> : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={addedByYear} margin={{ left: -20, right: 8, top: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id="addedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#e50914" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#e50914" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<TTP />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#e50914"
                    strokeWidth={2}
                    fill="url(#addedGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Releases by Year — Area */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Releases by Year (2000+)</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52 w-full" /> : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={byYear} margin={{ left: -20, right: 8, top: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id="releaseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0071eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0071eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<TTP />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0071eb"
                    strokeWidth={2}
                    fill="url(#releaseGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* By Rating */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Content by Rating</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52 w-full" /> : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={byRating} margin={{ left: -20, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="rating" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<TTP />} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {byRating.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Genres */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Top 15 Genres</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={genres}
                  layout="vertical"
                  margin={{ left: 140, right: 20, top: 4, bottom: 4 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="genre" tick={{ fontSize: 10 }} width={140} />
                  <Tooltip content={<TTP />} />
                  <Bar dataKey="count" fill="#1db954" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Top 15 Countries</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={countries}
                  layout="vertical"
                  margin={{ left: 100, right: 20, top: 4, bottom: 4 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="country" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip content={<TTP />} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
