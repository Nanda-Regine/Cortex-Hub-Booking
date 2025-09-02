// pages/api/whatsapp-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!
const WA_TOKEN = process.env.WHATSAPP_TOKEN!

function normalizeMsisdn(n: string) {
  // strip non-digits; WhatsApp delivers like "27123456789"
  return n.replace(/\D/g, '')
}

async function reply(phoneNumberId: string, to: string, body: string) {
  if (!WA_TOKEN) return
  await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, text: { body } }),
  })
}

function parseCommand(text: string) {
  const t = text.trim()

  // link 6digit
  let m = t.match(/^link\s+(\d{6})$/i)
  if (m) return { cmd: 'link', code: m[1] as string }

  // book <facility> <YYYY-MM-DD> <HH:MM> "optional project name"
  m = t.match(/^book\s+(\w+)\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?:\s+"([^"]+)")?$/i)
  if (m) return { cmd: 'book', facility: m[1], date: m[2], time: m[3], project: m[4] ?? null }

  // help
  if (/^(help|\?)$/i.test(t)) return { cmd: 'help' }

  return { cmd: 'unknown' }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: webhook verification
  if (req.method === 'GET') {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge as string)
    }
    return res.status(403).end('Forbidden')
  }

  // POST: incoming messages
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  try {
    const body = req.body as any
    const change = body?.entry?.[0]?.changes?.[0]
    const value = change?.value
    const phoneNumberId = value?.metadata?.phone_number_id
    const msg = value?.messages?.[0]
    const text: string | undefined = msg?.text?.body
    const from: string | undefined = msg?.from

    if (!text || !from || !phoneNumberId) {
      return res.status(200).json({ ok: true }) // ack silently
    }

    const parsed = parseCommand(text)
    const msisdn = normalizeMsisdn(from)

    if (parsed.cmd === 'help') {
      await reply(
        phoneNumberId,
        from,
        `Hi! You can use:
- link 123456
- book <facility> <YYYY-MM-DD> <HH:MM> "Project Name"
Example: book studio 2025-09-05 10:00 "Podcast shoot"`
      )
      return res.status(200).json({ ok: true })
    }

    if (parsed.cmd === 'link') {
      // Store link code against profile by phone (you must capture phone on sign-up)
      const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString()
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ wa_link_code: parsed.code, wa_link_code_expires: expires })
        .eq('phone', msisdn)

      await reply(
        phoneNumberId,
        from,
        error ? 'Could not set link code.' : 'Link code set. It expires in 15 minutes.'
      )
      return res.status(200).json({ ok: true })
    }

    if (parsed.cmd === 'book') {
      const start = new Date(`${parsed.date}T${parsed.time}:00`)
      const end = new Date(start.getTime() + 60 * 60 * 1000)

      // Find the user profile by phone
      const { data: prof, error: profErr } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('phone', msisdn)
        .maybeSingle()

      if (profErr || !prof?.id) {
        await reply(phoneNumberId, from, 'Phone not linked to any profile. Send: link 123456 (from your dashboard).')
        return res.status(200).json({ ok: true })
      }

      const { error: bookErr } = await supabaseAdmin.from('bookings').insert({
        user_id: prof.id,
        facility_id: String(parsed.facility).toLowerCase(),
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        project_name: parsed.project,
      })

      if (bookErr?.code === '23505') {
        await reply(phoneNumberId, from, 'That slot is already booked. Try another time.')
      } else if (bookErr) {
        await reply(phoneNumberId, from, 'Booking failed. Please try again later.')
      } else {
        await reply(
          phoneNumberId,
          from,
          `Booked ${parsed.facility} on ${parsed.date} at ${parsed.time}. See your dashboard for details.`
        )
      }
      return res.status(200).json({ ok: true })
    }

    await reply(phoneNumberId, from, 'Say "help" for commands.')
    return res.status(200).json({ ok: true })
  } catch {
    return res.status(200).json({ ok: true })
  }
}
