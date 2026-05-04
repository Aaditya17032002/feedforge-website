import { requireText } from '@/lib/email'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL
const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL?.replace(/\/$/, '') ?? 'https://openrouter.ai/api/v1'

type TryProductInput = {
  productTitle: string
  description: string
}

export type TryProductOutput = {
  optimizedTitle: string
  optimizedDescription: string
  tags: string[]
}

function parseJsonFromText(text: string): TryProductOutput | null {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')

  if (firstBrace < 0 || lastBrace < 0 || firstBrace >= lastBrace) {
    return null
  }

  const jsonSlice = cleaned.slice(firstBrace, lastBrace + 1)

  try {
    const parsed = JSON.parse(jsonSlice) as {
      optimizedTitle?: unknown
      optimizedDescription?: unknown
      tags?: unknown
    }

    const optimizedTitle = requireText(parsed.optimizedTitle)
    const optimizedDescription = requireText(parsed.optimizedDescription)
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.map((tag) => requireText(tag)).filter(Boolean).slice(0, 8)
      : []

    if (!optimizedTitle || !optimizedDescription || tags.length === 0) {
      return null
    }

    return {
      optimizedTitle,
      optimizedDescription,
      tags,
    }
  } catch {
    return null
  }
}

type OpenRouterChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>
  error?: { message?: string }
}

async function chatCompletion(model: string, userContent: string): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: userContent }],
    }),
  })

  const data = (await res.json()) as OpenRouterChatResponse

  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText
    throw new Error(`OpenRouter HTTP ${res.status}: ${msg}`)
  }

  const text = data.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('OpenRouter returned an empty response')
  }

  return text
}

export async function generateTryProductFeed(input: TryProductInput): Promise<TryProductOutput> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('Missing OPENROUTER_API_KEY')
  }

  const candidateModels = [
    OPENROUTER_MODEL,
    'openai/gpt-oss-120b:free',
  ].filter((value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index)

  const prompt = `
You are an ecommerce feed optimization assistant.
Given the product data, produce optimized content for product feeds and ad channels.

Input title: ${input.productTitle}
Input description: ${input.description || '(not provided)'}

Return only valid JSON with this exact shape:
{
  "optimizedTitle": "string",
  "optimizedDescription": "string",
  "tags": ["TAG_ONE", "TAG_TWO", "TAG_THREE"]
}

Rules:
- optimizedTitle should be concise, descriptive, and conversion-friendly.
- optimizedDescription should be 1-3 sentences and highlight value.
- tags should be 3 to 6 uppercase short tags.
- No markdown, no extra text outside JSON.
`.trim()

  let lastError: unknown = null

  for (const modelName of candidateModels) {
    try {
      const responseText = await chatCompletion(modelName, prompt)
      const parsed = parseJsonFromText(responseText)

      if (!parsed) {
        throw new Error(`OpenRouter response could not be parsed for model: ${modelName}`)
      }

      return parsed
    } catch (error) {
      lastError = error
    }
  }

  throw new Error(
    `OpenRouter generation failed for models: ${candidateModels.join(', ')}. ${
      lastError instanceof Error ? lastError.message : 'Unknown error.'
    }`
  )
}
