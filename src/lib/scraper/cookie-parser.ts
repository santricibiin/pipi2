export type CookieEntry = {
  domain: string
  httpOnly: boolean
  path: string
  secure: boolean
  expires: number
  name: string
  value: string
}

export function parseCookiesText(text: string): CookieEntry[] {
  const cookies: CookieEntry[] = []
  const lines = text.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    // Try JSON format (array of cookie objects from browser extensions)
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(text)
        const arr = Array.isArray(parsed) ? parsed : [parsed]
        for (const c of arr) {
          cookies.push({
            domain: c.domain ?? '',
            httpOnly: c.httpOnly ?? false,
            path: c.path ?? '/',
            secure: c.secure ?? false,
            expires: c.expirationDate ?? c.expires ?? 0,
            name: c.name ?? '',
            value: c.value ?? '',
          })
        }
        return cookies
      } catch {}
    }

    // Netscape format: domain\tHTTPONLY\tpath\tsecure\texpires\tname\tvalue
    const parts = trimmed.split('\t')
    if (parts.length >= 7) {
      cookies.push({
        domain: parts[0],
        httpOnly: parts[1].toUpperCase() === 'TRUE',
        path: parts[2],
        secure: parts[3].toUpperCase() === 'TRUE',
        expires: parseInt(parts[4]) || 0,
        name: parts[5],
        value: parts[6],
      })
    }
  }

  return cookies
}

export function filterByDomain(cookies: CookieEntry[], rootDomain: string): CookieEntry[] {
  return cookies.filter((c) => {
    const d = c.domain.replace(/^\./, '')
    return d === rootDomain || d.endsWith('.' + rootDomain)
  })
}

export function serializeNetscape(cookies: CookieEntry[]): string {
  const lines = ['# Netscape HTTP Cookie File', '']
  for (const c of cookies) {
    lines.push(
      [c.domain, c.httpOnly ? 'TRUE' : 'FALSE', c.path, c.secure ? 'TRUE' : 'FALSE', c.expires, c.name, c.value].join('\t')
    )
  }
  return lines.join('\n') + '\n'
}
