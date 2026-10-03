import { useTheme } from '../../hooks/useTheme.js'
import Button from '../ui/Button.jsx'
import { MoonIcon, SunIcon } from '../ui/Icons.jsx'

/** The label says what clicking will do, so screen readers hear the action. */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <Button
      variant="ghost"
      iconOnly
      icon={theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={toggleTheme}
    />
  )
}
