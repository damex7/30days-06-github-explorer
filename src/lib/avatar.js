/*
  Has this person uploaded a photo, or are they still on GitHub's default
  "identicon" (a symmetric 5×5 pattern of one colour on light grey)?

  The API doesn't tell us, so this is a best guess from the pixels:
  draw the avatar at 420×420 (the identicon's native size: a 35px margin
  plus 5 blocks of 70px) and check that
    1. the margin is the identicon grey (#f0f0f0),
    2. every block centre is either that grey or ONE other colour,
    3. the pattern is mirror-symmetric left↔right.
  A real photo practically never passes all three.

  Reading pixels from another site's image is only allowed when that site
  sends CORS headers. avatars.githubusercontent.com sends
  Access-Control-Allow-Origin: *, and we set img.crossOrigin = 'anonymous'.
*/

export const IDENTICON_SIZE = 420
const BG = [240, 240, 240]

const near = (a, b, tolerance = 12) => a.every((v, i) => Math.abs(v - b[i]) <= tolerance)

/** Pure check on RGBA pixel data (a size×size canvas). */
export function looksLikeIdenticon(data, size = IDENTICON_SIZE) {
  const scale = size / IDENTICON_SIZE
  const px = (x, y) => {
    const i = (Math.floor(y * scale) * size + Math.floor(x * scale)) * 4
    return [data[i], data[i + 1], data[i + 2]]
  }

  // 1. Margin corners and edges are the grey background.
  const margin = [[8, 8], [412, 8], [8, 412], [412, 412], [210, 8], [8, 210]]
  if (!margin.every(([x, y]) => near(px(x, y), BG))) return false

  // 2. Each block centre is background or the single foreground colour.
  let fg = null
  const filled = []
  for (let row = 0; row < 5; row++) {
    filled.push([])
    for (let col = 0; col < 5; col++) {
      const color = px(70 + col * 70, 70 + row * 70)
      if (near(color, BG)) {
        filled[row].push(false)
        continue
      }
      if (!fg) fg = color
      else if (!near(color, fg, 18)) return false
      filled[row].push(true)
    }
  }
  if (!fg) return false

  // 3. Left-right mirror symmetry.
  return filled.every((row) => row[0] === row[4] && row[1] === row[3])
}

/** Load the avatar and run the check. Resolves true/false, or null if it can't tell. */
export function detectDefaultAvatar(avatarUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = IDENTICON_SIZE
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0, IDENTICON_SIZE, IDENTICON_SIZE)
        resolve(looksLikeIdenticon(ctx.getImageData(0, 0, IDENTICON_SIZE, IDENTICON_SIZE).data))
      } catch {
        resolve(null) // canvas "tainted" (no CORS): we simply don't know
      }
    }
    img.onerror = () => resolve(null)
    const sep = avatarUrl.includes('?') ? '&' : '?'
    img.src = `${avatarUrl}${sep}s=${IDENTICON_SIZE}`
  })
}
