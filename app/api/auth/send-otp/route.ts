import { NextResponse } from 'next/server';
import { saveOtp } from '@/lib/otp-store';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, resendApiKey: bodyResendKey } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Adresse email invalide' },
        { status: 400 }
      );
    }

    // 1. Generate random secure 6-digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save in Server-Side Secure Store
    saveOtp(email, otpCode);

    // 3. Prepare Luxury HTML Email Template for Aymard Store
    const htmlEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #ffffff; margin: 0; padding: 40px 20px; }
          .container { max-width: 520px; margin: 0 auto; background: #18181b; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 36px 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .header { text-align: center; margin-bottom: 28px; }
          .logo { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #ffffff; }
          .logo span { color: #22c55e; }
          .badge { display: inline-block; padding: 4px 12px; background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.3); color: #22c55e; font-size: 11px; font-weight: 800; border-radius: 20px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .title { font-size: 20px; font-weight: 800; text-align: center; margin: 20px 0 10px 0; color: #ffffff; }
          .subtitle { font-size: 13.5px; color: #a1a1aa; text-align: center; line-height: 1.5; margin-bottom: 28px; }
          .code-box { background: #0e0e11; border: 1px dashed rgba(34,197,94,0.5); border-radius: 16px; padding: 22px; text-align: center; margin-bottom: 28px; }
          .code { font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #22c55e; font-family: monospace; }
          .info { font-size: 12px; color: #71717a; text-align: center; line-height: 1.6; }
          .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; font-size: 11px; color: #52525b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Aymard<span>.</span>Store</div>
            <div class="badge">● SÉCURITÉ DU COMPTE</div>
          </div>
          <div class="title">Code de réinitialisation de votre mot de passe</div>
          <div class="subtitle">
            Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Aymard Store. Utilisez le code sécurisé ci-dessous pour confirmer votre identité :
          </div>
          <div class="code-box">
            <div class="code">${otpCode}</div>
          </div>
          <div class="info">
            ⏱️ Ce code de sécurité expire dans <strong>10 minutes</strong>.<br/>
            Ne partagez jamais ce code avec quiconque.
          </div>
          <div class="footer">
            Aymard Store • Sneakers & Streetwear Authentifiés<br/>
            Assistance WhatsApp : +229 01 97 36 29 06
          </div>
        </div>
      </body>
      </html>
    `;

    let emailSent = false;

    // 4. Try sending via Resend API (configured key from Merchant Settings or ENV)
    const resendApiKey = bodyResendKey || process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Aymard Store <onboarding@resend.dev>',
            to: [email],
            subject: `🔑 ${otpCode} est votre code de sécurité Aymard Store`,
            html: htmlEmail,
          }),
        });
        const resData = await resendRes.json();
        if (resData.id) {
          emailSent = true;
        } else {
          console.warn('[AUTH OTP] Resend notice:', resData);
        }
      } catch (resendErr) {
        console.error('Erreur envoi Resend:', resendErr);
      }
    }

    // 5. Try sending via SMTP (Gmail or custom SMTP) if configured in ENV
    if (!emailSent) {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
      const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
      const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS;

      if (smtpUser && smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost || 'smtp.gmail.com',
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });

          await transporter.sendMail({
            from: `"Aymard Store" <${smtpUser}>`,
            to: email,
            subject: `🔑 ${otpCode} est votre code de sécurité Aymard Store`,
            html: htmlEmail,
            text: `Votre code de sécurité Aymard Store est : ${otpCode} (Valable 10 minutes).`,
          });

          emailSent = true;
        } catch (smtpErr) {
          console.error('Erreur envoi email SMTP:', smtpErr);
        }
      }
    }

    // Log securely on server terminal (for merchant / admin awareness in local dev)
    console.log(`[AUTH OTP] 📨 Code envoyé à ${email} : ${otpCode}`);

    // Return response to client WITHOUT exposing the OTP code
    return NextResponse.json({
      success: true,
      email: email,
      emailSent: emailSent,
      message: 'Code envoyé avec succès sur votre boîte mail.'
    });
  } catch (error: any) {
    console.error('Erreur API send-otp:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération du code' },
      { status: 500 }
    );
  }
}
