import { NextResponse } from 'next/server'

export type ApiErrorBody = { success: false; message: string }
export type ApiOkBody<T extends Record<string, unknown> = Record<string, unknown>> = { success: true } & T

export function jsonOk<T extends Record<string, unknown> = Record<string, unknown>>(
  body?: T,
  init?: ResponseInit
) {
  const responseBody = body ? Object.assign({ success: true as const }, body) : { success: true as const }

  return NextResponse.json(responseBody, init)
}

export function jsonError(message: string, status = 400, init?: ResponseInit) {
  return NextResponse.json({ success: false, message } satisfies ApiErrorBody, { status, ...(init ?? {}) })
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

