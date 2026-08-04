const KEY_STORAGE = 'anthropic_api_key'

export function getApiKey() {
  return (localStorage.getItem(KEY_STORAGE) || '').trim()
}

export function setApiKey(key) {
  const trimmed = (key || '').trim()
  if (trimmed) localStorage.setItem(KEY_STORAGE, trimmed)
  else localStorage.removeItem(KEY_STORAGE)
}

const INSIGHT_SCHEMA = {
  type: 'object',
  properties: {
    insights: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Five words or fewer.' },
          body: { type: 'string', description: 'Two or three warm, specific sentences.' },
        },
        required: ['title', 'body'],
        additionalProperties: false,
      },
    },
    carryForward: {
      type: 'string',
      description: 'One sentence naming the single thing to carry into next week.',
    },
  },
  required: ['insights', 'carryForward'],
  additionalProperties: false,
}

/**
 * Reads a stretch of entries and returns three reflections plus one thing to
 * carry forward. Runs straight from the browser against the user's own key.
 */
export async function generateInsights({ label, entries, apiKey = getApiKey() }) {
  if (!apiKey) throw new Error('Add your Anthropic API key first.')
  if (!entries.length) throw new Error('No entries in that stretch yet.')

  // Loaded on demand so the SDK never lands in the first paint's bundle.
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const journal = entries
    .map((e) => e.article || '')
    .filter(Boolean)
    .join('\n\n---\n\n')

  const response = await client.beta.messages.create({
    model: 'claude-opus-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: INSIGHT_SCHEMA },
    },
    system:
      'You are reading someone\'s private journal at their invitation. Reflect back what is actually on the page — quote their own words where it helps, and name patterns rather than restating events. Be warm and plain-spoken. No advice unless it follows directly from something they wrote.',
    messages: [
      {
        role: 'user',
        content: `Here are my journal entries for ${label}:\n\n${journal}\n\nGive me exactly three insights: emotional patterns, moments of growth, and one thing worth carrying forward. Keep each body to two or three sentences.`,
      },
    ],
  })

  if (response.stop_reason === 'refusal') {
    throw new Error('Claude declined to read that stretch. Try a different week.')
  }

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("Couldn't read the response. Try again.")
  }

  return {
    insights: (parsed.insights || []).slice(0, 3),
    carryForward: parsed.carryForward || '',
  }
}

export function insightsToText({ label, insights, carryForward }) {
  const lines = [`${label} — reflections`, '='.repeat(44), '']
  insights.forEach((ins, i) => {
    lines.push(`${i + 1}. ${ins.title}`)
    lines.push(ins.body)
    lines.push('')
  })
  if (carryForward) {
    lines.push('Carry forward')
    lines.push(carryForward)
    lines.push('')
  }
  lines.push(`Generated ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`)
  return lines.join('\n')
}
