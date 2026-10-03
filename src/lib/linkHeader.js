/*
  GitHub paginates with the Link header instead of putting page counts in
  the body. A response for page 2 of 5 carries:

    Link: <https://api.github.com/user/1/repos?page=3>; rel="next",
          <https://api.github.com/user/1/repos?page=5>; rel="last",
          <https://api.github.com/user/1/repos?page=1>; rel="first",
          <https://api.github.com/user/1/repos?page=1>; rel="prev"

  parseLinkHeader turns that into { next, last, first, prev } URLs.
  No "next" means this is the last page. No header at all means everything
  fitted on one page.
*/
export function parseLinkHeader(header) {
  const links = {}
  if (!header) return links
  for (const part of header.split(',')) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="([^"]+)"/)
    if (match) links[match[2]] = match[1]
  }
  return links
}

/** The ?page= number inside one of those URLs, e.g. to show "of 5 pages". */
export function pageFromUrl(url) {
  if (!url) return null
  const page = Number(new URL(url).searchParams.get('page'))
  return Number.isFinite(page) && page > 0 ? page : null
}
