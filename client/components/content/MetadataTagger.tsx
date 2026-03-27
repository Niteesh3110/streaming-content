'use client'

import { useState } from 'react'
import { contentApi, MetadataUpdate, NetflixTitle } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save } from 'lucide-react'

interface Props {
  title: NetflixTitle
  open: boolean
  onClose: () => void
  onSaved: (updated: NetflixTitle) => void
}

const FIELDS: { key: keyof MetadataUpdate; label: string; textarea?: boolean }[] = [
  { key: 'title',       label: 'Title' },
  { key: 'director',    label: 'Director' },
  { key: 'cast',        label: 'Cast',        textarea: true },
  { key: 'country',     label: 'Country' },
  { key: 'rating',      label: 'Rating' },
  { key: 'listed_in',   label: 'Genres',      textarea: true },
  { key: 'date_added',  label: 'Date Added' },
  { key: 'duration',    label: 'Duration' },
  { key: 'description', label: 'Description', textarea: true },
]

export default function MetadataTagger({ title, open, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleOpen() {
    setForm({
      title:       title.title       ?? '',
      director:    title.director    ?? '',
      cast:        title.cast        ?? '',
      country:     title.country     ?? '',
      rating:      title.rating      ?? '',
      listed_in:   title.listed_in   ?? '',
      date_added:  title.date_added  ?? '',
      duration:    title.duration    ?? '',
      description: title.description ?? '',
    })
    setError(null)
    setSuccess(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const payload: MetadataUpdate = {}
      for (const { key } of FIELDS) {
        const val = form[key]
        if (val !== undefined && val !== (title[key] ?? '')) {
          if (key === 'release_year') {
            const n = parseInt(val)
            if (!isNaN(n)) (payload as Record<string, unknown>)[key] = n
          } else {
            (payload as Record<string, unknown>)[key] = val
          }
        }
      }
      const updated = await contentApi.update(title.show_id, payload)
      setSuccess(true)
      onSaved(updated)
      setTimeout(onClose, 800)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={() => handleOpen()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Metadata Tagger
            <Badge variant="secondary" className="font-mono text-xs">
              {title.show_id}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          {FIELDS.map(({ key, label, textarea }) => (
            <div
              key={key}
              className={textarea ? 'col-span-2' : 'col-span-1'}
            >
              <Label className="mb-1.5 block text-xs text-muted-foreground">
                {label}
              </Label>
              {textarea ? (
                <textarea
                  rows={key === 'description' ? 3 : 2}
                  value={form[key] ?? ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              ) : (
                <Input
                  value={form[key] ?? ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-400">
            Saved successfully!
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <><Loader2 className="size-3.5 animate-spin" /> Saving…</>
            ) : (
              <><Save className="size-3.5" /> Save Changes</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
