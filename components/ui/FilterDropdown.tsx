'use client'

import { useEffect, useRef, useState } from 'react'

export interface FilterOption {
  value: string
  label: string
}

interface Props {
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function FilterDropdown({
  label,
  options,
  value,
  onChange,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value)?.label ?? value

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`min-h-9 px-3 text-sm bg-transparent border rounded-md transition ${
          disabled
            ? 'text-[#64645f] border-[#3f3f3c] cursor-not-allowed opacity-60'
            : 'text-[#a3a09a] border-[#575750] hover:bg-[#30302d] hover:border-[#777]'
        } ${open ? 'bg-[#30302d] border-[#EF9F27]' : ''}`}
      >
        {label} <strong className="text-[#f4f2ec]">{current}</strong>{' '}
        <span className="text-[#64645f]">▾</span>
      </button>

      {open && !disabled && (
        <ul className="absolute top-full left-0 mt-1 bg-[#262624] border border-[#3f3f3c] rounded-md shadow-xl z-50 overflow-hidden min-w-[180px]">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm transition ${
                  opt.value === value
                    ? 'bg-[#30302d] text-[#EF9F27] font-bold'
                    : 'text-[#f4f2ec] hover:bg-[#1a1a18]'
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
