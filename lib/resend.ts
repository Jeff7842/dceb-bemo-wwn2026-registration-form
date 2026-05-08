import { Resend } from 'resend';
export const resend = new Resend(process.env.RESEND_API_KEY);

export function getWelcomeEmailHTML(firstName: string, role: string): string {
  const messages = {
    member: {
      title: "Welcome to Worship & Warfare Night! 🔥",
      body: `Dear ${firstName}, we are so glad you joined us tonight! You are registered and your presence makes tonight even more special. "I called to the Lord, who is worthy of praise, and I have been saved from my enemies." – Psalms 18:3. We pray tonight marks a turning point in your life. Please invite someone else!`
    },
    pastor: {
      title: "Pastor, We Honor You! 🙌",
      body: `Dear Pastor ${firstName}, it is a great honor to have you with us tonight at Worship & Warfare Night. We thank God for your ministry and for the work you carry in His Kingdom. Deliverance Church Eastern Bypass and Beyond Movement Ministry welcome you with open arms. Your presence is a blessing!`
    },
    staff: {
      title: "Thank You For Serving! ✨",
      body: `Dear ${firstName}, thank you for your service tonight. You are not just serving — you are worshipping through your service. "Whatever you do, work at it with all your heart, as working for the Lord." God sees every act of service, and we celebrate you tonight. Thank you for fellowshipping with us!`
    }
  };
  const msg = messages[role as keyof typeof messages] || messages.member;
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a1628;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;background:linear-gradient(135deg,#0a1628 0%,#1a3a5c 50%,#0a1628 100%);">
    <div style="padding:40px 24px 24px;text-align:center;">
      <div style="background:linear-gradient(135deg,#3B82F6,#60A5FA);border-radius:16px;padding:32px 24px;margin-bottom:24px;">
        <h1 style="color:#fff;font-size:28px;margin:0 0 8px;font-weight:bold;letter-spacing:-0.5px;">Worship &amp; Warfare Night</h1>
        <p style="color:#93C5FD;margin:0;font-size:14px;">Beyond Movement Ministry · Deliverance Church Eastern Bypass</p>
        <p style="color:#FCD34D;margin:8px 0 0;font-size:13px;font-style:italic;">"I called to the Lord, who is worthy of praise" — Psalms 18:3</p>
      </div>
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:28px 24px;">
        <h2 style="color:#F5A623;font-size:22px;margin:0 0 16px;">${msg.title}</h2>
        <p style="color:#E2E8F0;font-size:15px;line-height:1.7;margin:0 0 20px;">${msg.body}</p>
        <div style="background:rgba(59,130,246,0.2);border-radius:8px;padding:16px;border-left:3px solid #3B82F6;">
          <p style="color:#93C5FD;margin:0;font-size:13px;">📅 Friday 8th May 2026 · 9:00PM – 5:00AM</p>
          <p style="color:#93C5FD;margin:6px 0 0;font-size:13px;">📍 Deliverance Church Eastern Bypass, Near Gatongora Water</p>
          <p style="color:#FCD34D;margin:6px 0 0;font-size:13px;">🎟️ Free Entry — Kindly Invite Someone!</p>
        </div>
      </div>
      <p style="color:#4B5563;font-size:12px;margin:20px 0 0;">Beyond Movement Ministry · @deliverachurcheasternbypass</p>
    </div>
  </div>
</body>
</html>`;
}

export function getThankYouEmailHTML(firstName: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a1628;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;text-align:center;">
    <div style="background:linear-gradient(135deg,#1a3a5c,#0a1628);border-radius:16px;padding:32px 24px;border:1px solid rgba(255,255,255,0.1);">
      <h1 style="color:#F5A623;font-size:26px;margin:0 0 12px;">Thank You, ${firstName}! 🙏</h1>
      <p style="color:#E2E8F0;font-size:15px;line-height:1.7;">We are grateful you were part of Worship &amp; Warfare Night. God moved powerfully last night and your presence made a difference. We pray Psalms 18:3 becomes real in your life as you go forth today.</p>
      <p style="color:#93C5FD;font-size:14px;margin:20px 0 0;">See you at the next one! Kindly invite someone next time. 🔥</p>
      <p style="color:#4B5563;font-size:12px;margin:20px 0 0;">Beyond Movement Ministry · Deliverance Church Eastern Bypass</p>
    </div>
  </div>
</body>
</html>`;
}
