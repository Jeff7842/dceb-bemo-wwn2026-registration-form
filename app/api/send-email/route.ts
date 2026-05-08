import { resend, getWelcomeEmailHTML, getThankYouEmailHTML } from '@/lib/resend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { to, firstName, role, type } = await req.json();

  if (!to || !firstName || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const subject =
    type === 'welcome'
      ? "You're Registered! Worship & Warfare Night 🔥"
      : 'Thank You for Last Night — Worship & Warfare Night 🙏';

  const html =
    type === 'welcome'
      ? getWelcomeEmailHTML(firstName, role ?? 'member')
      : getThankYouEmailHTML(firstName);

  try {
    const { data, error } = await resend.emails.send({
      from: 'WWN Registration <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('[send-email] Resend error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error('[send-email] unexpected error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
