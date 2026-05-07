type JsonRecord = Record<string, unknown>

export type JsonPostResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string }

async function safeReadJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text.trim()) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export async function postJson<TResponse, TBody extends JsonRecord>(
  url: string,
  body: TBody
): Promise<JsonPostResult<TResponse>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload = (await safeReadJson(res)) as unknown

  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload && typeof (payload as any).message === 'string'
        ? (payload as any).message
        : res.statusText || 'Request failed.'

    return { ok: false, status: res.status, message }
  }

  return { ok: true, data: payload as TResponse }
}

