import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'

import { SafeMarkdown } from '@/components/legal/SafeMarkdown'

/**
 * AURA-205 — sanitization unit tests for the safe Markdown renderer (D-12 merge blocker).
 *
 * Renders `<SafeMarkdown>` to a static HTML string (node env, no DOM) and asserts the security
 * boundary: no embedded raw HTML becomes a trusted element, no event handlers or `javascript:`
 * URLs survive, while the normal Markdown subset (headings, paragraphs, emphasis, lists, safe
 * links) renders as real elements.
 */
function render(content: string): string {
  return renderToStaticMarkup(createElement(SafeMarkdown, { content }))
}

describe('SafeMarkdown neutralizes unsafe HTML (D-12)', () => {
  test('strips <script> tags', () => {
    const html = render('Before\n\n<script>alert("xss")</script>\n\nAfter')
    expect(html).not.toMatch(/<script/i)
    expect(html).not.toContain('alert("xss")')
  })

  test('strips <iframe> tags', () => {
    const html = render('Text\n\n<iframe src="https://evil.example"></iframe>')
    expect(html).not.toMatch(/<iframe/i)
  })

  test('does not emit any real element carrying an inline event handler', () => {
    const html = render(
      '<button onclick="alert(1)">Click</button>\n\n<img src=x onerror="alert(2)">'
    )
    // No real <button>/<img> element survives, and no real tag carries an on*= attribute.
    expect(html).not.toMatch(/<button/i)
    expect(html).not.toMatch(/<img/i)
    expect(html).not.toMatch(/<[a-z][^>]*\son[a-z]+=/i)
  })

  test('strips javascript: URLs from Markdown links', () => {
    const html = render('[click me](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
  })
})

describe('SafeMarkdown renders the allowed Markdown subset', () => {
  test('renders headings, paragraphs, emphasis, and lists', () => {
    const html = render('# Title\n\nA **bold** and *italic* paragraph.\n\n- one\n- two\n\n1. first')
    expect(html).toMatch(/<h1/i)
    expect(html).toMatch(/<p/i)
    expect(html).toMatch(/<strong/i)
    expect(html).toMatch(/<em/i)
    expect(html).toMatch(/<ul/i)
    expect(html).toMatch(/<ol/i)
    expect(html).toMatch(/<li/i)
  })

  test('renders links with safe protocols and keeps the href', () => {
    const html = render('[Example](https://example.com)')
    expect(html).toMatch(/<a[^>]+href="https:\/\/example\.com"/i)
    expect(html).toContain('Example')
  })
})
