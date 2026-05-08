import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    firstName,
    lastName,
    phoneCountryCode,
    phoneNumber,
    email,
    country,
    region,
    churchName,
    role,
    servingArea,
  } = body;

  if (!firstName || !lastName || !phoneNumber || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const dup = await sql`
    SELECT id FROM members
    WHERE LOWER(first_name) = LOWER(${firstName})
      AND LOWER(last_name)  = LOWER(${lastName})
      AND phone_number = ${phoneNumber}
    LIMIT 1
  `;
  if (dup.length > 0) {
    return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
  }

  try {
    const rows = await sql`
      INSERT INTO members
        (first_name, last_name, phone_country_code, phone_number, email, country, region, church_name, role, serving_area)
      VALUES
        (${firstName}, ${lastName}, ${phoneCountryCode ?? '+254'}, ${phoneNumber},
         ${email ?? null}, ${country ?? 'Kenya'}, ${region ?? null},
         ${churchName ?? null}, ${role}, ${servingArea ?? null})
      RETURNING *
    `;
    return NextResponse.json({ ok: true, member: rows[0] }, { status: 201 });
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg?.code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }
    console.error('[register] POST error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
