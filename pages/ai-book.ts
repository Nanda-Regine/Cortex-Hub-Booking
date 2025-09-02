import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { prompt } = req.body

  const sys = `You help fill a booking form. Return JSON ONLY with keys:
facility_id(one of: robotics, studio, ecfilm, esports, electronics, arm, automotive, baremetal),
date(YYYY-MM-DD), time(HH:mm 24h), project(string). If uncertain, guess reasonable values.`
  const user = `Message: """${prompt}"""`

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
      response_format: { type: 'json_object' }
    })
  })
  const j = await r.json()
  try {
    const parsed = JSON.parse(j.choices[0].message.content)
    return res.status(200).json(parsed)
  } catch {
    return res.status(200).json({ error: 'parse_failed' })
  }
}
