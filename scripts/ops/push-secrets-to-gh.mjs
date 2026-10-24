// Copies Cortex Hub secrets from .env.local into GitHub Actions secrets (values never printed).
// CI then uploads the runtime ones to the Worker with `wrangler secret bulk`.
// Usage: node scripts/ops/push-secrets-to-gh.mjs "<path to .env.local>"
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const NAMES = ["NEXT_PUBLIC_SUPABASE_ANON_KEY","NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_WHATSAPP_NUMBER_DISPLAY","SUPABASE_SERVICE_ROLE","WHATSAPP_NUMBER_DISPLAY","WHATSAPP_PHONE_ID","WHATSAPP_TOKEN","WHATSAPP_VERIFY_TOKEN","OPENAI_API_KEY"]
const env = {}
for (const line of readFileSync(process.argv[2], 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
}
const missing = []
for (const n of NAMES) {
  if (!env[n]) { missing.push(n); continue }
  const r = spawnSync('gh', ['secret', 'set', n, '-R', 'Nanda-Regine/Cortex-Hub-Booking'], { input: env[n], stdio: ['pipe', 'ignore', 'inherit'] })
  console.log(`${n}: ${r.status === 0 ? 'set' : 'FAILED'}`)
}
if (missing.length) console.log(`Not in .env.local (set by hand if needed): ${missing.join(', ')}`)
