import sql from '@/lib/db';
import { INITIAL_CHURCHES } from '@/lib/churches';
import { NextRequest, NextResponse } from 'next/server';

function normalizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET() {
  const rows = await sql`SELECT name FROM churches ORDER BY name ASC`;
  const dbNames = rows.map((r) => r.name as string);
  const merged = Array.from(new Set([...INITIAL_CHURCHES, ...dbNames]))
    .filter((n) => n !== 'Other')
    .sort((a, b) => a.localeCompare(b));
  merged.push('Other');
  return NextResponse.json({ churches: merged });
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const normalized = normalizeName(name);
  const normalizedKey = normalized.toLowerCase();
  try {
    await sql`
      INSERT INTO churches (name, normalized_name)
      VALUES (${normalized}, ${normalizedKey})
    `;
    return NextResponse.json({ ok: true, name: normalized }, { status: 201 });
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg?.code === '23505') {
      console.log(`[churches] duplicate silently ignored: ${normalized}`);
      return NextResponse.json({ exists: true, name: normalized });
    }
    console.error('[churches] POST error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
