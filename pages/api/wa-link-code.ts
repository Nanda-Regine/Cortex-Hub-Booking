// pages/api/wa-link-code.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const EXP_MINUTES = 15

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const { user_id } = req.body as { user_id?: string }
  if (!user_id) return res.status(400).json({ error: 'user_id required' })

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expires = new Date(Date.now() + EXP_MINUTES * 60 * 1000).toISOString()

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ wa_link_code: code, wa_link_code_expires: expires })
    .eq('id', user_id)

  if (error) return res.status(400).json({ error: error.message })
  return res.status(200).json({ code, expires })
}
