/*
  Any component (an error message, the header) can ask for the token
  settings dialog without passing callbacks through every layer.
  AppShell listens for this event and opens the dialog.
*/
export const OPEN_SETTINGS = 'scout:open-settings'

export function openSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS))
}
