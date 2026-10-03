import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { CompassIcon } from '../components/ui/Icons.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function NotFound() {
  useDocumentTitle('Page not found')
  return (
    <EmptyState
      icon={<CompassIcon size={22} />}
      title="This page doesn't exist"
      message="The link may be broken. Try searching for a GitHub username instead."
      action={
        <Button as={Link} to="/" variant="primary">
          Go to search
        </Button>
      }
    />
  )
}
