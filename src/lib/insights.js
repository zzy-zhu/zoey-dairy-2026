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

/** Loaded on demand so the SDK never lands in the first paint's bundle. */
async function makeClient(apiKey) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

/** Shared response handling: refusals surface as errors, JSON comes back parsed. */
function readJson(response) {
  if (response.stop_reason === 'refusal') {
    throw new Error('Claude declined this one. Try again or reword it.')
  }
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
  try {
    return JSON.parse(text)
  } catch {
    throw new Error("Couldn't read the response. Try again.")
  }
}

/**
 * Reads a stretch of entries and returns three reflections plus one thing to
 * carry forward. Runs straight from the browser against the user's own key.
 */
export async function generateInsights({ label, entries, apiKey = getApiKey() }) {
  if (!apiKey) throw new Error('Add your Anthropic API key first.')
  if (!entries.length) throw new Error('No entries in that stretch yet.')

  const client = await makeClient(apiKey)

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

  const parsed = readJson(response)
  return {
    insights: (parsed.insights || []).slice(0, 3),
    carryForward: parsed.carryForward || '',
  }
}

const NOTE_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string', description: 'Six words or fewer. No punctuation at the end.' },
    body: { type: 'string', description: 'One or two sentences, warm and specific.' },
  },
  required: ['headline', 'body'],
  additionalProperties: false,
}

/** The closing card of a week's story. Short by design — it's one screen. */
export async function generateWeekNote({ label, summary, quotes, apiKey = getApiKey() }) {
  if (!apiKey) throw new Error('Add your Anthropic API key in Reflect first.')
  const client = await makeClient(apiKey)

  const response = await client.beta.messages.create({
    model: 'claude-opus-5',
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema: NOTE_SCHEMA },
    },
    system:
      "You write the last card of someone's weekly recap — the one that lands after the numbers. One short headline and one or two sentences. Warm, specific to their week, never generic encouragement. Speak to them as \"you\".",
    messages: [
      {
        role: 'user',
        content: `${label}\n\nThe numbers:\n${summary}\n\nSome of what I wrote:\n${quotes}\n\nWrite the closing card.`,
      },
    ],
  })

  return readJson(response)
}

const INSPO_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'A short title for the page.' },
    opening: { type: 'string', description: 'Two or three sentences to start.' },
    ideas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string', description: 'Two or three sentences.' },
        },
        required: ['title', 'body'],
        additionalProperties: false,
      },
    },
    smallStep: { type: 'string', description: 'One thing doable in under thirty minutes today.' },
    closing: { type: 'string', description: 'One sentence.' },
  },
  required: ['title', 'opening', 'ideas', 'smallStep', 'closing'],
  additionalProperties: false,
}

/**
 * One tap, one page of inspiration — grounded in the goals and the writing
 * that are already here rather than generic pep talk.
 */
export async function generateInspo({ goals, recent, priorities, apiKey = getApiKey() }) {
  if (!apiKey) throw new Error('Add your Anthropic API key in Reflect first.')
  const client = await makeClient(apiKey)

  const goalText = goals.length
    ? goals
        .map(
          (g) =>
            `- ${g.title}${g.why ? ` (why: ${g.why})` : ''}${
              g.milestones?.length
                ? ` — next up: ${
                    g.milestones.find((m) => !m.done)?.text || 'all milestones done'
                  }`
                : ''
            }`
        )
        .join('\n')
    : '(no goals written down yet)'

  const response = await client.beta.messages.create({
    model: 'claude-opus-5',
    max_tokens: 8000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: INSPO_SCHEMA },
    },
    system:
      'You write a one-page spark for someone who is stuck or flat, using their own goals and journal as the raw material. Concrete over motivational: name angles they have not tried, reframe what they are already circling, point at the smallest real move. Three ideas, each genuinely different from the others. No platitudes, no exclamation marks, no "you\'ve got this".',
    messages: [
      {
        role: 'user',
        content: `My goals:\n${goalText}\n\nWhat I'm trying to do today:\n${
          priorities.length ? priorities.map((p) => `- ${p.text}`).join('\n') : '(nothing set yet)'
        }\n\nRecent journal entries:\n${recent}\n\nWrite me one page of inspiration.`,
      },
    ],
  })

  return readJson(response)
}

export function inspoToText({ title, opening, ideas, smallStep, closing, createdAt }) {
  const lines = [title, '='.repeat(Math.min(60, title.length)), '', opening, '']
  ideas.forEach((idea, i) => {
    lines.push(`${i + 1}. ${idea.title}`)
    lines.push(idea.body)
    lines.push('')
  })
  lines.push('One small step')
  lines.push(smallStep)
  lines.push('')
  lines.push(closing)
  lines.push('')
  lines.push(
    `Written ${new Date(createdAt || Date.now()).toLocaleDateString('en-US', { dateStyle: 'long' })}`
  )
  return lines.join('\n')
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
