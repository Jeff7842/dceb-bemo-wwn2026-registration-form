import sql from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const members = await sql`
    SELECT * FROM members ORDER BY created_at DESC
  `;
  return NextResponse.json({ members });
}
