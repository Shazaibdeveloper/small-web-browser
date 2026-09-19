// ============================================================================
// FILE: src/lib/sanitize.ts
// ============================================================================
import DOMPurify from 'isomorphic-dompurify';

/**
 * The server has already sanitized every published page and rewritten each
 * anchor to `<a data-address="…" href="#/…">`. This layer exists so the
 * renderer never depends on the server having got it right — if the API
 * contract were ever broken, or a page slipped through, DOMPurify is the
 * last line, configured to match the server allow-list exactly.
 *
 * What it forbids, in one line: scripts, styles, iframes, objects, embeds,
 * forms, inline event handlers, inline styles, javascript: / data: URLs,
 * and every attribute except a link's href, data-address, title and rel.
 */
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'a', 'em', 'strong', 'b', 'i', 'u', 's',
  'code', 'pre', 'blockquote', 'q', 'cite',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'span', 'div', 'small', 'sub', 'sup', 'mark', 'abbr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'figure', 'figcaption',
];

export function sanitizeForDisplay(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'data-address', 'title', 'rel'],
    // Fragments (#/tidepool.zz), http(s), mailto. Nothing else.
    ALLOWED_URI_REGEXP: /^(?:#\/|https?:|mailto:)/i,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
  });
}