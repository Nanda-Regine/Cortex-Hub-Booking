// pages/api/notify-whatsapp.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const { phone, message } = req.body as { phone?: string; message?: string }
  if (!phone || !message) return res.status(400).json({ error: 'phone and message required' })

  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) return res.status(500).json({ error: 'WhatsApp env not set' })

  try {
    const r = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        text: { body: message },
      }),
    })
    const j = await r.json()
    if (!r.ok) return res.status(400).json(j)
    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'WhatsApp send failed' })
  }
}
