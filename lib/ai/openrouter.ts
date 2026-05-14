import { requireText } from '@/lib/shared/strings'

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

export type FeedHealthReport = {
  score: number
  summary: string
  issues: string[]
}

export type TryProductComparisonOutput = TryProductOutput & {
  before: FeedHealthReport
  after: FeedHealthReport
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

    // FIX: safe tag parsing — filter instead of requireText which throws on non-strings
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
          .map((t) => t.trim().toUpperCase())
          .slice(0, 8)
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

const SYSTEM_PROMPT = `
You are an expert ecommerce feed optimization assistant trained on Google Shopping, Meta Commerce, and marketplace feed standards.

Your job: take a raw product title and optional description, and return an optimized title, description, and tags that maximize search visibility, click-through rate, and feed approval rates — while strictly following platform validation rules.

=================== OUTPUT ===================
Return ONLY valid JSON (no markdown, no code fences, no commentary, no text before or after) with this EXACT shape:

{
  "optimizedTitle": "string",
  "optimizedDescription": "string",
  "tags": ["TAG_ONE", "TAG_TWO", "TAG_THREE"]
}

=================== RULES ===================

OPTIMIZED TITLE
- Length: 50-150 characters. Ideal range 70-100. Hard max 150.
- Front-load the most important keyword in the first 70 characters (mobile truncation point).
- Preferred structure when info is available: [Brand] [Product Type] [Key Attribute: color/size/material] [Model/Variant]. Skip any part not present in input — never invent it.
- Use Title Case or sentence case. No ALL CAPS words (brand acronyms like "HP", "IBM" are allowed).
- No emojis. No promotional language ("Best", "#1", "Sale", "Cheap", "Free Shipping", "Guaranteed", "Miracle", "%off", "!!!").
- No repeated words, no keyword stuffing, no special characters except - & , / ( ).
- Must be meaningfully different from and clearer than the input title.

OPTIMIZED DESCRIPTION
- Length: 300-1000 characters. Hard min 150, hard max 5000.
- Plain text only. No HTML, no markdown, no emojis, no bullet symbols.
- Structure: lead with the primary benefit and use case, then features, then specs/details. Use 2-4 short paragraphs separated by a single newline.
- Write in active voice, second person ("you"), benefit-driven tone.
- Naturally include the main keyword from the title 1-2 times and 2-3 related secondary keywords. No stuffing.
- No pricing claims, no shipping claims, no superlatives, no medical/health claims unless present in the input.
- Do NOT invent facts (materials, certifications, awards, specs, dimensions) that are not in or clearly inferable from the input. When unsure, write generally rather than fabricating.

TAGS
- Return 5 to 8 tags (not 3-6 — more tags improve discoverability while staying within feed limits).
- Format: UPPERCASE, A-Z 0-9 and underscore only, max 20 characters each.
- Coverage mix: at least one category tag, one attribute tag (color/material/size/style if known), one audience or use-case tag.
- No duplicates, no stop-words (THE, AND, FOR, WITH), no brand tag unless brand is clearly in the input.
- Tags should reflect real shopper search intent, not internal jargon.

=================== HARD CONSTRAINTS ===================
- Output MUST be valid JSON parseable by JSON.parse. No trailing commas. No comments. No code fences.
- No text before or after the JSON object.
- Match the language of the input. If mixed or unclear, default to English.
- If the input is too sparse to optimize meaningfully, still return the best possible output — never return an error message inside the JSON.
`.trim()

const SYSTEM_PROMPT_COMPARISON = `
You are an expert ecommerce feed optimization assistant trained on Google Shopping, Meta Commerce, and marketplace feed standards.

Your job: take a raw product title and optional description, produce an improved version, and score the feed health BEFORE and AFTER on a 0-100 scale.

=================== OUTPUT ===================
Return ONLY valid JSON (no markdown, no code fences, no commentary, no text before or after) with this EXACT shape:

{
  "optimizedTitle": "string",
  "optimizedDescription": "string",
  "tags": ["TAG_ONE", "TAG_TWO"],
  "before": {
    "score": 0,
    "summary": "string",
    "issues": ["string"]
  },
  "after": {
    "score": 0,
    "summary": "string",
    "issues": ["string"]
  }
}

=================== SCORING ===================
- Score 0-100. Higher means better feed approval likelihood + discoverability.
- "before" scores the input as-is.
- "after" scores your optimized output.
- Provide 3-6 short "issues" strings for each (no bullets, no numbering).

=================== RULES (OPTIMIZATION) ===================
OPTIMIZED TITLE
- Length: 50-150 characters. Ideal range 70-100. Hard max 150.
- Front-load the most important keyword in the first 70 characters (mobile truncation point).
- Preferred structure when info is available: [Brand] [Product Type] [Key Attribute: color/size/material] [Model/Variant]. Skip any part not present in input — never invent it.
- Use Title Case or sentence case. No ALL CAPS words (brand acronyms like "HP", "IBM" are allowed).
- No promotional language ("Best", "#1", "Sale", "Cheap", "Free Shipping", "Guaranteed", "Miracle", "%off", "!!!").
- No repeated words, no keyword stuffing, no special characters except - & , / ( ).

OPTIMIZED DESCRIPTION
- Length: 300-1000 characters. Hard min 150, hard max 5000.
- Plain text only. No HTML, no markdown, no emojis.
- Structure: lead with the primary benefit and use case, then features, then specs/details. Use 2-4 short paragraphs separated by a single newline.
- Write in active voice, second person ("you"), benefit-driven tone.
- No pricing claims, no shipping claims, no superlatives, no medical/health claims unless present in the input.
- Do NOT invent facts (materials, certifications, awards, specs, dimensions) that are not in or clearly inferable from the input.

TAGS
- Return 5 to 8 tags.
- Format: UPPERCASE, A-Z 0-9 and underscore only, max 20 characters each.
- No duplicates.

=================== HARD CONSTRAINTS ===================
- Output MUST be valid JSON parseable by JSON.parse. No trailing commas.
- No text before or after the JSON object.
- Match the language of the input. If mixed or unclear, default to English.
`.trim()

// FIX: split into system + user messages for better instruction-following
async function chatCompletion(
  model: string,
  systemPrompt: string,
  userContent: string,
): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
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

  // User turn contains only the product data — instructions live in system prompt
  const userContent = `Title: ${input.productTitle}\nDescription: ${input.description || '(not provided)'}`

  let lastError: unknown = null

  for (const modelName of candidateModels) {
    try {
      const responseText = await chatCompletion(modelName, SYSTEM_PROMPT, userContent)
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
    }`,
  )
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function parseComparisonJsonFromText(text: string): TryProductComparisonOutput | null {
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
      before?: unknown
      after?: unknown
    }

    const optimizedTitle = requireText(parsed.optimizedTitle)
    const optimizedDescription = requireText(parsed.optimizedDescription)

    const tags = Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
          .map((t) => t.trim().toUpperCase())
          .slice(0, 8)
      : []

    const beforeObj = (parsed.before ?? null) as
      | { score?: unknown; summary?: unknown; issues?: unknown }
      | null
    const afterObj = (parsed.after ?? null) as
      | { score?: unknown; summary?: unknown; issues?: unknown }
      | null

    const beforeScoreRaw = typeof beforeObj?.score === 'number' ? beforeObj.score : Number(beforeObj?.score)
    const afterScoreRaw = typeof afterObj?.score === 'number' ? afterObj.score : Number(afterObj?.score)

    const beforeSummary = requireText(beforeObj?.summary)
    const afterSummary = requireText(afterObj?.summary)

    const beforeIssues = Array.isArray(beforeObj?.issues)
      ? beforeObj!.issues.filter((i): i is string => typeof i === 'string' && i.trim().length > 0).slice(0, 8)
      : []
    const afterIssues = Array.isArray(afterObj?.issues)
      ? afterObj!.issues.filter((i): i is string => typeof i === 'string' && i.trim().length > 0).slice(0, 8)
      : []

    if (!optimizedTitle || !optimizedDescription || tags.length === 0) return null
    if (!beforeSummary || !afterSummary) return null
    if (beforeIssues.length === 0 || afterIssues.length === 0) return null

    return {
      optimizedTitle,
      optimizedDescription,
      tags,
      before: {
        score: clampScore(beforeScoreRaw),
        summary: beforeSummary,
        issues: beforeIssues,
      },
      after: {
        score: clampScore(afterScoreRaw),
        summary: afterSummary,
        issues: afterIssues,
      },
    }
  } catch {
    return null
  }
}

export async function generateTryProductComparison(
  input: TryProductInput,
): Promise<TryProductComparisonOutput> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('Missing OPENROUTER_API_KEY')
  }

  const candidateModels = [
    OPENROUTER_MODEL,
    'openai/gpt-oss-120b:free',
  ].filter((value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index)

  const userContent = `Title: ${input.productTitle}\nDescription: ${input.description || '(not provided)'}`

  let lastError: unknown = null

  for (const modelName of candidateModels) {
    try {
      const responseText = await chatCompletion(modelName, SYSTEM_PROMPT_COMPARISON, userContent)
      const parsed = parseComparisonJsonFromText(responseText)

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
    }`,
  )
}
