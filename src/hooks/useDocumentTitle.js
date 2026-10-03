import { useEffect } from 'react'

/** Sets the browser tab title, so history and screen readers know the page. */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Scout` : 'Scout · GitHub Profile Explorer'
  }, [title])
}
