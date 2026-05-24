'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IL_LIST } from '@/lib/il-data'

function normalize(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim()
}

export default function IlSearchBox() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    if (!query.trim()) return []
    const q = normalize(query)
    return IL_LIST.filter(
      (il) => normalize(il.name).includes(q) || il.slug.includes(q),
    ).slice(0, 8)
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function go(slug: string) {
    setOpen(false)
    setQuery('')
    router.push(`/il/${slug}`)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && matches[highlight]) {
      e.preventDefault()
      go(matches[highlight].slug)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-sm min-w-0">
      <label className="flex items-center gap-2 min-h-10 px-3 border border-[#555550] rounded-md text-[#a3a09a] bg-transparent">
        <span>⌕</span>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setHighlight(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="İl ara..."
          className="w-full bg-transparent text-[#f4f2ec] outline-none border-0"
        />
      </label>

      {open && matches.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-[#262624] border border-[#3f3f3c] rounded-md shadow-xl z-50 overflow-hidden">
          {matches.map((il, idx) => (
            <li key={il.slug}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  go(il.slug)
                }}
                onMouseEnter={() => setHighlight(idx)}
                className={`w-full text-left px-3 py-2 text-sm ${
                  idx === highlight ? 'bg-[#30302d] text-[#EF9F27]' : 'text-[#f4f2ec]'
                }`}
              >
                {il.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
