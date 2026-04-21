import { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'

export function useStatus(intervalMs = 60000) {
  const [status, setStatus] = useState(null)
  const [hasNewData, setHasNewData] = useState(false)
  const lastUpdatedRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function fetchStatus() {
      try {
        const data = await api.status()
        if (!cancelled) {
          if (lastUpdatedRef.current && data.last_updated !== lastUpdatedRef.current) {
            setHasNewData(true)
          }
          lastUpdatedRef.current = data.last_updated
          setStatus(data)
        }
      } catch (_) {
        // silently ignore poll errors
      }
    }

    fetchStatus()
    const id = setInterval(fetchStatus, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [intervalMs])

  function acknowledgeNewData() {
    setHasNewData(false)
  }

  return { status, hasNewData, acknowledgeNewData }
}
