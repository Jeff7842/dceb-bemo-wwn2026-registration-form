import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { name, ip_address } = await req.json();
  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 });
  }

  const existing = await sql`SELECT id FROM admin_sessions WHERE LOWER(name) = LOWER(${name})`;

  if (existing.length > 0) {
    await sql`
      UPDATE admin_sessions
      SET logged_in_at = NOW(), updated_at = NOW(), ip_address = ${ip_address ?? null}
      WHERE LOWER(name) = LOWER(${name})
    `;
  } else {
    await sql`
      INSERT INTO admin_sessions (name, ip_address)
      VALUES (${name}, ${ip_address ?? null})
    `;
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const sessions = await sql`
    SELECT * FROM admin_sessions ORDER BY logged_in_at DESC LIMIT 20
  `;
  return NextResponse.json({ sessions });
}
