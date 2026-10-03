import { useMemo } from 'react'
import { useAsync } from '../../hooks/useAsync.js'
import { getReadmeHtml } from '../../lib/github.js'
import { sanitizeReadme } from '../../lib/readme.js'
import Button from '../ui/Button.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import ErrorState from '../ui/ErrorState.jsx'
import { BookIcon, ExternalIcon } from '../ui/Icons.jsx'
import Modal from '../ui/Modal.jsx'
import Skeleton, { LoadingRegion } from '../ui/Skeleton.jsx'

/*
  README preview. Opened by ?readme=<repo> in the URL, so a link to a
  specific README can be shared, and Back closes it.
*/
export default function ReadmeModal({ owner, repo, onClose }) {
  const open = Boolean(repo)
  const readme = useAsync(open ? (signal) => getReadmeHtml(owner, repo, { signal }) : null, [owner, repo])
  const safeHtml = useMemo(() => (readme.data ? sanitizeReadme(readme.data, owner, repo) : ''), [readme.data, owner, repo])

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={repo ? `${owner}/${repo}` : ''}
      description="README, rendered by GitHub and sanitised before display"
      footer={
        <Button as="a" href={`https://github.com/${owner}/${repo}`} target="_blank" rel="noreferrer" icon={<ExternalIcon size={15} />}>
          Open repository on GitHub
        </Button>
      }
    >
      {readme.status === 'loading' && (
        <LoadingRegion label="Loading README" className="space-y-4">
          <Skeleton width="50%" height="1.5rem" />
          <Skeleton lines={4} />
          <Skeleton variant="rect" height="8rem" />
          <Skeleton lines={3} />
        </LoadingRegion>
      )}
      {readme.status === 'error' &&
        (readme.error.kind === 'not-found' ? (
          <EmptyState
            icon={<BookIcon size={22} />}
            title="No README in this repository"
            message="A README explains what a project does and how to run it. It's the first thing a recruiter opens."
          />
        ) : (
          <ErrorState compact error={readme.error} onRetry={readme.retry} />
        ))}
      {readme.status === 'success' && (
        // Safe: safeHtml has been through DOMPurify (see lib/readme.js)
        <div className="readme" dangerouslySetInnerHTML={{ __html: safeHtml }} />
      )}
    </Modal>
  )
}
