// src/hooks/useMenu.js
import { useState, useEffect } from 'react'
import { plateItems as defaultPlates, trayItems as defaultTrays } from '../data/menu'
import { apiUrl, adminHeaders } from '../lib/api'

export default function useMenu() {
  const [plateItems, setPlateItems] = useState([])
  const [trayItems,  setTrayItems]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [lastSaved,  setLastSaved]  = useState(null)

  useEffect(() => {
    fetch(apiUrl('get-menu'))
      .then(r => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (data.exists) {
          // DB has a saved menu — use it as the source of truth
          setPlateItems(data.plateItems?.length ? data.plateItems : defaultPlates)
          setTrayItems(data.trayItems?.length   ? data.trayItems  : defaultTrays)
          setLastSaved(data.updatedAt)
        } else {
          // No menu saved in DB yet — fall back to menu.js defaults
          setPlateItems(defaultPlates)
          setTrayItems(defaultTrays)
        }
      })
      .catch(() => {
        // API unreachable — fall back to defaults
        setPlateItems(defaultPlates)
        setTrayItems(defaultTrays)
      })
      .finally(() => setLoading(false))
  }, [])

  const saveMenu = async (plates, trays) => {
    const res  = await fetch(apiUrl('save-menu'), {
      method:  'POST',
      headers: adminHeaders(),
      body:    JSON.stringify({ plateItems: plates, trayItems: trays }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Save failed')
    setPlateItems(plates)
    setTrayItems(trays)
    setLastSaved(data.savedAt)
    return data
  }

  return { plateItems, trayItems, loading, error, lastSaved, saveMenu }
}
