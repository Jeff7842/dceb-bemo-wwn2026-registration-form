import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const JOIN_PASSCODE = process.env.JOIN_PASSCODE ?? 'Jesus@WWN2026';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, passcode, ip_address } = body;

  if (!name || !passcode) {
    return NextResponse.json({ error: 'Name and passcode required' }, { status: 400 });
  }

  if (passcode !== JOIN_PASSCODE) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  }

  const trimmedName = String(name).trim();

  const existing = await sql`SELECT id FROM joins WHERE LOWER(name) = LOWER(${trimmedName})`;

  if (existing.length > 0) {
    await sql`
      UPDATE joins SET updated_at = NOW(), ip_address = ${ip_address ?? null}
      WHERE LOWER(name) = LOWER(${trimmedName})
    `;
  } else {
    await sql`
      INSERT INTO joins (name, ip_address) VALUES (${trimmedName}, ${ip_address ?? null})
    `;
  }

  return NextResponse.json({ ok: true });
}
