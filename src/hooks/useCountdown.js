import { useEffect, useState } from 'react'

/** Whole seconds left until `targetMs` (a timestamp), ticking every second. */
export function useCountdown(targetMs) {
  const secondsLeft = () => (targetMs ? Math.max(0, Math.ceil((targetMs - Date.now()) / 1000)) : 0)
  const [left, setLeft] = useState(secondsLeft)

  useEffect(() => {
    setLeft(secondsLeft())
    if (!targetMs) return
    const id = setInterval(() => {
      const next = secondsLeft()
      setLeft(next)
      if (next === 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [targetMs])

  return left
}
