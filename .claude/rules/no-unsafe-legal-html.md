# Rule: No Unsafe or Raw Legal HTML

**Type:** Merge Blocker  
**Locked Decision:** D-12  
**Enforced By:** Code review, legal content API validation, render-layer inspection

---

## Rule

Block any PR that:

- Stores unrestricted raw HTML in the `legal_pages.content` field
- Renders legal content using `dangerouslySetInnerHTML` without strict sanitization
- Accepts arbitrary HTML from admin form input for legal pages
- Bypasses the content safety validation in `POST /api/admin/legal` or `PATCH /api/admin/legal/[id]`

---

## Why

Legal pages (Privacy Policy, Terms) are admin-editable and publicly rendered. Accepting raw HTML would:
1. Create XSS attack vectors if the content escapes sanitization
2. Allow injection of tracking pixels, malicious scripts, or form hijacking
3. Violate D-12 (legal safety rule)

---

## Approved Content Formats

| Format | Approved | Notes |
|---|---|---|
| Markdown | Yes | Preferred for simplicity and safety |
| Sanitized rich text (controlled subset) | Yes | Must use a strict allowlist sanitizer (e.g., DOMPurify with restrictive config) |
| Raw HTML / unrestricted input | No | Merge blocker |

---

## How to Check

```bash
# Check for dangerouslySetInnerHTML in legal page components
grep -rn "dangerouslySetInnerHTML" src/components --include="*.tsx"
grep -rn "dangerouslySetInnerHTML" src/app --include="*.tsx"

# Check legal API validation
grep -rn "legal" src/app/api/admin/legal/ --include="*.ts"
# Verify Zod validation is present and content is sanitized before insert
```

---

## Correct Pattern

```tsx
// Correct: render Markdown content safely
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

const safeHtml = DOMPurify.sanitize(marked(content), {
  ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
})

return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
```

Or: use a Markdown renderer component that never calls `dangerouslySetInnerHTML` with raw user input.

---

## Verdict

Any PR where legal content can reach the browser as raw, unsanitized HTML → **BLOCK the PR**.
