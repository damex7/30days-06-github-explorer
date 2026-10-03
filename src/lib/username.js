/*
  GitHub usernames: 1–39 characters, letters, numbers and single hyphens,
  not starting or ending with a hyphen. Checking this before calling the
  API means a typo like "john doe" costs no request at all.
*/
const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

export function cleanUsername(input) {
  // Accept pasted profile URLs and "@name" too.
  return input
    .trim()
    .replace(/^@/, '')
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '')
    .split(/[/?#]/)[0]
}

/** Returns an error message, or '' when the username looks valid. */
export function validateUsername(name) {
  if (!name) return 'Enter a GitHub username.'
  if (name.length > 39) return 'GitHub usernames are at most 39 characters.'
  if (!USERNAME.test(name)) return 'Usernames only contain letters, numbers and single hyphens (not at the start or end).'
  return ''
}
