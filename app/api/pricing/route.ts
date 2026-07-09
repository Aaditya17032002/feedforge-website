import { NextResponse } from 'next/server';

import { fetchPortalPricing } from '@/lib/server/pricing-api';

export const revalidate = 300;

export async function GET() {
  const result = await fetchPortalPricing();

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 503 });
  }

  return NextResponse.json(
    { ok: true, data: result.data },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
    }
  );
}
