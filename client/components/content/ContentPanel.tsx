'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { contentApi, ContentFilters, NetflixTitle } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import MetadataTagger from './MetadataTagger'
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Search, SlidersHorizontal, Pencil, ChevronUp, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_COLORS: Record<string, string> = {
  Movie:    'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'TV Show':'bg-purple-500/15 text-purple-400 border-purple-500/20',
}

const col = createColumnHelper<NetflixTitle>()

const COLUMNS = [
  col.accessor('title', {
    header: 'Title',
    cell: info => (
      <span className="font-medium text-foreground line-clamp-1">
        {info.getValue() ?? '—'}
      </span>
    ),
  }),
  col.accessor('type', {
    header: 'Type',
    cell: info => {
      const v = info.getValue()
      return v ? (
        <Badge variant="outline" className={cn('text-xs', TYPE_COLORS[v] ?? '')}>
          {v}
        </Badge>
      ) : '—'
    },
  }),
  col.accessor('rating', {
    header: 'Rating',
    cell: info => (
      <span className="text-xs text-muted-foreground">{info.getValue() ?? '—'}</span>
    ),
  }),
  col.accessor('release_year', {
    header: 'Year',
    cell: info => (
      <span className="tabular-nums text-sm">{info.getValue() ?? '—'}</span>
    ),
  }),
  col.accessor('country', {
    header: 'Country',
    cell: info => (
      <span className="line-clamp-1 text-xs text-muted-foreground">
        {info.getValue()?.split(',')[0]?.trim() ?? '—'}
      </span>
    ),
  }),
  col.accessor('duration', {
    header: 'Duration',
    cell: info => (
      <span className="text-xs text-muted-foreground">{info.getValue() ?? '—'}</span>
    ),
  }),
]

const SORT_FIELDS = ['title', 'release_year', 'date_added', 'type', 'rating']

export default function ContentPanel() {
  const [items, setItems] = useState<NetflixTitle[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState({
    type: '', rating: '', genre: '', country: '',
  })
  const [sortBy, setSortBy] = useState('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const [filterOptions, setFilterOptions] = useState<ContentFilters | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const [selectedTitle, setSelectedTitle] = useState<NetflixTitle | null>(null)

  const LIMIT = 25

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  // Fetch filter options once
  useEffect(() => {
    contentApi.filters().then(setFilterOptions).catch(() => {})
  }, [])

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await contentApi.list({
        page, limit: LIMIT,
        search: debouncedSearch || undefined,
        type: filters.type || undefined,
        rating: filters.rating || undefined,
        genre: filters.genre || undefined,
        country: filters.country || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      setItems(res.items)
      setTotal(res.total)
      setPages(res.pages)
    } catch {
      setError('Failed to load content. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, filters, sortBy, sortOrder])

  useEffect(() => { fetchData() }, [fetchData])

  // Reset to page 1 on filter/sort change
  useEffect(() => { setPage(1) }, [filters, sortBy, sortOrder])

  const table = useReactTable({
    data: items,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
  })

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ChevronUp className="size-3 opacity-20" />
    return sortOrder === 'asc'
      ? <ChevronUp className="size-3" />
      : <ChevronDown className="size-3" />
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Content Library</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Browse, search, and tag Netflix titles
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search title, director, cast…"
            className="pl-8"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(v => !v)}
          className={showFilters ? 'bg-muted' : ''}
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
        </Button>
        {total > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {total.toLocaleString()} results
          </span>
        )}
      </div>

      {/* Filter bar */}
      {showFilters && filterOptions && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3">
          {([
            { key: 'type',    label: 'Type',    opts: filterOptions.types },
            { key: 'rating',  label: 'Rating',  opts: filterOptions.ratings },
            { key: 'genre',   label: 'Genre',   opts: filterOptions.genres.slice(0, 40) },
            { key: 'country', label: 'Country', opts: filterOptions.countries.slice(0, 40) },
          ] as const).map(({ key, label, opts }) => (
            <select
              key={key}
              value={filters[key]}
              onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All {label}s</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setFilters({ type: '', rating: '', genre: '', country: '' })}
          >
            Reset
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card border-b border-border">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => {
                  const field = h.column.id
                  const sortable = SORT_FIELDS.includes(field)
                  return (
                    <th
                      key={h.id}
                      className={cn(
                        'px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap',
                        sortable && 'cursor-pointer select-none hover:text-foreground'
                      )}
                      onClick={() => sortable && toggleSort(field)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {sortable && <SortIcon field={field} />}
                      </span>
                    </th>
                  )
                })}
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Edit
                </th>
              </tr>
            ))}
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-3 py-2.5">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-border/50 hover:bg-muted/40 transition-colors"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-3 py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className="px-3 py-2.5">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setSelectedTitle(row.original)}
                        title="Edit metadata"
                      >
                        <Pencil className="size-3" />
                      </Button>
                    </td>
                  </tr>
                ))
            }
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Page {page} of {pages}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-xs" disabled={page <= 1} onClick={() => setPage(1)}>
            <ChevronsLeft className="size-3" />
          </Button>
          <Button variant="outline" size="icon-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="size-3" />
          </Button>
          <div className="flex items-center gap-1 px-1">
            {[-2, -1, 0, 1, 2]
              .map(offset => page + offset)
              .filter(p => p >= 1 && p <= pages)
              .map(p => (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="icon-xs"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
          </div>
          <Button variant="outline" size="icon-xs" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="size-3" />
          </Button>
          <Button variant="outline" size="icon-xs" disabled={page >= pages} onClick={() => setPage(pages)}>
            <ChevronsRight className="size-3" />
          </Button>
        </div>
      </div>

      {/* Metadata Tagger dialog */}
      {selectedTitle && (
        <MetadataTagger
          title={selectedTitle}
          open={!!selectedTitle}
          onClose={() => setSelectedTitle(null)}
          onSaved={updated => {
            setItems(items => items.map(i => i.show_id === updated.show_id ? updated : i))
            setSelectedTitle(null)
          }}
        />
      )}
    </div>
  )
}
