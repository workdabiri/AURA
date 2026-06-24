import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'

/**
 * Safe Markdown renderer — AURA-205 (D-12 merge blocker).
 *
 * Presentational server component. Renders raw Markdown into React elements with NO trusted
 * raw HTML path:
 *   - `react-markdown` does NOT parse embedded HTML by default (no `rehype-raw`), so a
 *     `<script>` / `<iframe>` / `onclick=...` in the source is treated as inert text, never
 *     elements.
 *   - `rehype-sanitize` is applied as defence in depth: it strips any disallowed tag/attribute
 *     and unsafe URL protocols (e.g. `javascript:`) from the hast tree before rendering.
 *   - No `dangerouslySetInnerHTML` anywhere — output is real React elements only.
 *
 * Allows the normal Markdown subset (headings, paragraphs, bold/italic, lists, links with safe
 * protocols). Styled with the design-token `prose` typography scale to match public pages.
 *
 * Props-only; no Supabase/DAL/services. Never pass untrusted HTML expecting it to render.
 */
export function SafeMarkdown({ content }: { content: string }) {
  return (
    <div
      className="prose max-w-none prose-headings:font-display prose-headings:text-text-primary prose-p:text-text-secondary prose-a:text-brand-primary prose-strong:text-text-primary prose-li:text-text-secondary"
      data-testid="legal-markdown"
    >
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
    </div>
  )
}
