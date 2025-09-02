import { STUDIO_EQUIPMENT } from '@/data/facilities'
import { useEffect, useState } from 'react'

export default function EquipmentChecklist({ value, onChange }: { value: string[], onChange: (s:string[])=>void }) {
  const [selected, setSelected] = useState<string[]>(value || [])

  useEffect(() => { onChange(selected) }, [selected])

  return (
    <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-auto border rounded-xl p-3">
      {STUDIO_EQUIPMENT.map(item => {
        const checked = selected.includes(item)
        return (
          <label key={item} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={checked} onChange={() => {
              setSelected(prev => prev.includes(item) ? prev.filter(i=>i!==item) : [...prev, item])
            }} />
            {item}
          </label>
        )
      })}
    </div>
  )
}
