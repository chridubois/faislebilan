import { useEffect, useState } from 'react'
import { searchCiqual } from '../api'
import type { IngredientCiqual } from '../types'

type Props = { onSelect: (row: IngredientCiqual) => void }

export default function CiqualSelector({ onSelect }: Props) {
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [items, setItems] = useState<IngredientCiqual[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    if (!debounced) { setItems([]); return }
    searchCiqual(debounced).then(setItems).catch(() => setItems([]))
  }, [debounced])

  return (
    <div className="relative">
      <input
        className="border rounded px-3 py-2 w-80"
        placeholder="Rechercher CIQUAL…"
        value={q}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && items.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 z-20 bg-white border rounded-xl shadow-lg max-h-60 overflow-auto">
          {items.map((it) => (
            <div
              key={it.ciqual_code}
              className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
              onMouseDown={() => { onSelect(it); setOpen(false) }}
            >
              <div className="text-sm">{it.name_fr}</div>
              <div className="text-xs text-gray-600">{it.ciqual_code}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
