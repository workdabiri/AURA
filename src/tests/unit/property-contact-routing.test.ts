import { describe, expect, test } from 'vitest'

import { resolveContact } from '@/domain/properties/contact'

/**
 * AURA-203 — unit tests for public contact routing (pure, no DB).
 *
 * Owner-locked priority: property whatsapp → property phone → property email →
 * agency whatsapp → agency phone → agency email → none. Contact is NEVER routed to a
 * stakeholder (the function has no stakeholder input by construction).
 */

const noProperty = { agentWhatsapp: null, agentPhone: null, agentEmail: null }
const noAgency = { agencyWhatsapp: null, agencyPhone: null, agencyEmail: null }

describe('resolveContact — priority order', () => {
  test('1. property whatsapp wins over everything', () => {
    const r = resolveContact(
      { agentWhatsapp: '+971 50 111 2222', agentPhone: '+971 4 000 0000', agentEmail: 'a@x.com' },
      {
        agencyWhatsapp: '+971 50 999 0000',
        agencyPhone: '+971 4 999 0000',
        agencyEmail: 'ag@x.com',
      }
    )
    expect(r).toEqual({
      method: 'whatsapp',
      href: 'https://wa.me/971501112222',
      label: '+971 50 111 2222',
      source: 'property',
    })
  })

  test('2. property phone when no property whatsapp', () => {
    const r = resolveContact(
      { agentWhatsapp: null, agentPhone: '+971 4 123 4567', agentEmail: 'a@x.com' },
      { agencyWhatsapp: '+971509990000', agencyPhone: null, agencyEmail: null }
    )
    expect(r.method).toBe('phone')
    expect(r.source).toBe('property')
    expect(r.href).toBe('tel:+97141234567')
  })

  test('3. property email when no property whatsapp/phone', () => {
    const r = resolveContact(
      { agentWhatsapp: null, agentPhone: null, agentEmail: 'agent@x.com' },
      { agencyWhatsapp: '+971509990000', agencyPhone: '+97140', agencyEmail: 'ag@x.com' }
    )
    expect(r.method).toBe('email')
    expect(r.source).toBe('property')
    expect(r.href).toBe('mailto:agent@x.com')
  })

  test('4. agency whatsapp when property has no contact', () => {
    const r = resolveContact(noProperty, {
      agencyWhatsapp: '+971 50 999 0000',
      agencyPhone: '+971 4 999 0000',
      agencyEmail: 'ag@x.com',
    })
    expect(r.method).toBe('whatsapp')
    expect(r.source).toBe('agency')
    expect(r.href).toBe('https://wa.me/971509990000')
  })

  test('5. agency phone when no whatsapp anywhere', () => {
    const r = resolveContact(noProperty, {
      agencyWhatsapp: null,
      agencyPhone: '+971 4 555 0000',
      agencyEmail: 'ag@x.com',
    })
    expect(r.method).toBe('phone')
    expect(r.source).toBe('agency')
  })

  test('6. agency email is the last resort before none', () => {
    const r = resolveContact(noProperty, {
      agencyWhatsapp: null,
      agencyPhone: null,
      agencyEmail: 'ag@x.com',
    })
    expect(r).toEqual({
      method: 'email',
      href: 'mailto:ag@x.com',
      label: 'ag@x.com',
      source: 'agency',
    })
  })

  test('7. none when nothing is configured', () => {
    expect(resolveContact(noProperty, noAgency)).toEqual({
      method: 'none',
      href: null,
      label: '',
      source: 'none',
    })
  })

  test('whitespace-only values are treated as empty', () => {
    const r = resolveContact(
      { agentWhatsapp: '   ', agentPhone: '', agentEmail: null },
      { agencyWhatsapp: null, agencyPhone: '  ', agencyEmail: 'ag@x.com' }
    )
    expect(r.method).toBe('email')
    expect(r.source).toBe('agency')
  })
})
