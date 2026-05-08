import sql from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const {
    first_name,
    last_name,
    phone_country_code,
    phone_number,
    email,
    country,
    region,
    church_name,
    role,
    serving_area,
    admin_name,
  } = body;

  const current = await sql`SELECT * FROM members WHERE id = ${id}`;
  if (current.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rows = await sql`
    UPDATE members SET
      first_name         = COALESCE(${first_name ?? null}, first_name),
      last_name          = COALESCE(${last_name ?? null}, last_name),
      phone_country_code = COALESCE(${phone_country_code ?? null}, phone_country_code),
      phone_number       = COALESCE(${phone_number ?? null}, phone_number),
      email              = COALESCE(${email ?? null}, email),
      country            = COALESCE(${country ?? null}, country),
      region             = COALESCE(${region ?? null}, region),
      church_name        = COALESCE(${church_name ?? null}, church_name),
      role               = COALESCE(${role ?? null}, role),
      serving_area       = COALESCE(${serving_area ?? null}, serving_area),
      updated_at         = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (admin_name) {
    await sql`
      INSERT INTO audit_log (admin_name, member_id, action, before_data, after_data)
      VALUES (
        ${admin_name}, ${id}, 'edit',
        ${JSON.stringify(current[0])},
        ${JSON.stringify(rows[0])}
      )
    `;
  }

  return NextResponse.json({ ok: true, member: rows[0] });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { admin_name } = body as { admin_name?: string };

  const rows = await sql`SELECT * FROM members WHERE id = ${id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await sql`
    INSERT INTO deleted_records (original_id, data, deleted_by)
    VALUES (${id}, ${JSON.stringify(rows[0])}, ${admin_name ?? 'unknown'})
  `;

  await sql`
    INSERT INTO audit_log (admin_name, member_id, action, before_data)
    VALUES (${admin_name ?? 'unknown'}, ${id}, 'delete', ${JSON.stringify(rows[0])})
  `;

  await sql`DELETE FROM members WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
