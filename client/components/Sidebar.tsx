'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  ShieldAlert,
  BarChart2,
  Globe,
  Tv2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/content',     label: 'Content Library', icon: LayoutGrid },
  { href: '/audit',       label: 'Data Audit',      icon: ShieldAlert  },
  { href: '/analytics',   label: 'Analytics',        icon: BarChart2    },
  { href: '/competitive', label: 'Competitive',      icon: Globe        },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-red-600">
          <Tv2 className="size-4 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight">StreamDash</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        <p className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Menu
        </p>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3 text-[10px] text-muted-foreground">
        FastAPI · Pandas · Next.js 16
      </div>
    </aside>
  )
}
