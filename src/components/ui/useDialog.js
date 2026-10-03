import { useEffect, useRef } from 'react'

/*
  Logic for Modal, built on the native <dialog> element.
  showModal() gives us, for free: a backdrop, focus moved inside, focus
  trapped inside, everything behind made inert, and Escape to close.

  React stays the source of truth: Escape and backdrop clicks call onClose,
  and the parent decides whether `open` becomes false.
*/
export function useDialog(open, onClose) {
  const ref = useRef(null)
  const returnFocusTo = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      returnFocusTo.current = document.activeElement
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
      // Put focus back on whatever opened the dialog
      const target = returnFocusTo.current
      if (target?.isConnected) target.focus()
    }
  }, [open])

  return {
    ref,
    // Escape fires "cancel": stop the browser closing it and let React decide
    onCancel: (event) => {
      event.preventDefault()
      onClose()
    },
    // A click on the backdrop targets the <dialog> itself, not its content
    onClick: (event) => {
      if (event.target === event.currentTarget) onClose()
    },
  }
}
