import { useState, useEffect, useCallback } from 'react'
import { apiUrl } from '../lib/api'

export default function useActiveCycle() {
  const [cycle,   setCycle]   = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(apiUrl('get-active-cycle'))
      const data = await res.json()
      setCycle(data.active ? data.cycle : null)
    } catch {
      setCycle(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { cycle, loading, refresh }
}
