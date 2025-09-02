// pages/api/ai-book.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type BookingJSON = {
  facility_id?: 'robotics'|'studio'|'ecfilm'|'esports'|'electronics'|'arm'|'automotive'|'baremetal';
  date?: string;  // YYYY-MM-DD
  time?: string;  // HH:mm (24h)
  project?: string;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<BookingJSON>) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { prompt } = req.body ?? {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'missing_prompt' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'missing_openai_key' });
  }

  const sys =
    `You help fill a booking form. Return JSON ONLY with keys:
facility_id(one of: robotics, studio, ecfilm, esports, electronics, arm, automotive, baremetal),
date(YYYY-MM-DD), time(HH:mm 24h), project(string). If uncertain, guess reasonable values.`;
  const user = `Message: """${prompt}"""`;

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    const j = await r.json();

    // Handle OpenAI API errors clearly
    if (!r.ok) {
      console.error('OpenAI error:', j);
      return res.status(r.status).json({ error: 'openai_api_error' });
    }

    const content = j?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      return res.status(200).json({ error: 'no_content' });
    }

    try {
      const parsed = JSON.parse(content) as BookingJSON;
      return res.status(200).json(parsed);
    } catch (e) {
      console.error('JSON parse error:', e, 'content=', content);
      return res.status(200).json({ error: 'parse_failed' });
    }
  } catch (err) {
    console.error('Server error calling OpenAI:', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
