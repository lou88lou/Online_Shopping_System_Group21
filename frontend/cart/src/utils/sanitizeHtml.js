const ALLOWED_TAGS = new Set([
  'P', 'BR', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'B', 'I', 'H3', 'H4'
])

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function sanitizeProductHtml(input) {
  const raw = String(input || '').trim()
  if (!raw) return ''

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return escapeHtml(raw)
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(raw, 'text/html')

  // Remove dangerous blocks entirely.
  doc.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach((node) => node.remove())

  const all = [...doc.body.querySelectorAll('*')]
  for (const node of all) {
    if (!ALLOWED_TAGS.has(node.tagName)) {
      node.replaceWith(doc.createTextNode(node.textContent || ''))
      continue
    }

    // Strip all attributes to keep a strict safe subset.
    for (const attr of [...node.attributes]) {
      node.removeAttribute(attr.name)
    }
  }

  return doc.body.innerHTML.trim()
}

