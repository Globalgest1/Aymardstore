import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      product, 
      subscribers, 
      channels, 
      customMessage, 
      merchantSettings,
      baseUrl = 'http://192.168.1.140:3000' 
    } = body;

    if (!product) {
      return NextResponse.json({ error: 'Produit manquant.' }, { status: 400 });
    }

    const emailSubscribers = (subscribers || []).filter(
      (s: any) => s.active && s.email && (s.channels || []).includes('EMAIL')
    );
    const whatsappSubscribers = (subscribers || []).filter(
      (s: any) => s.active && s.phone && (s.channels || []).includes('WHATSAPP')
    );

    const resendApiKey = merchantSettings?.resendApiKey;
    const whatsappWebhookUrl = merchantSettings?.whatsappWebhookUrl;

    let emailsSent = 0;
    let whatsappDispatched = 0;
    const errors: string[] = [];

    const productUrl = `${baseUrl}/products/${product.slug || product.id}`;
    const formattedFcfa = Math.round(product.price * 655.957).toLocaleString('fr-FR');
    const formattedEur = product.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 });

    // 1. Send Email Broadcast (Resend or simulated)
    if (channels.includes('EMAIL') && emailSubscribers.length > 0) {
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #09090b; color: #ffffff; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #121215; border: 1px solid #27272a; border-radius: 24px; overflow: hidden; }
    .header { padding: 32px 24px 20px 24px; text-align: center; border-bottom: 1px solid #27272a; }
    .logo { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #ffffff; }
    .logo-accent { color: #38bdf8; }
    .badge { display: inline-block; background: #ef4444; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-top: 10px; }
    .content { padding: 28px 24px; text-align: center; }
    .product-img { width: 100%; max-width: 480px; height: 320px; object-fit: cover; border-radius: 18px; margin-bottom: 20px; }
    .product-title { font-size: 22px; font-weight: 900; color: #ffffff; margin: 0 0 10px 0; }
    .product-price { font-size: 26px; font-weight: 900; color: #facc15; margin-bottom: 16px; }
    .product-desc { font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; }
    .btn { display: inline-block; background: #ffffff; color: #09090b; font-size: 14px; font-weight: 900; padding: 14px 32px; border-radius: 30px; text-decoration: none; box-shadow: 0 4px 20px rgba(255,255,255,0.2); }
    .footer { padding: 24px; text-align: center; font-size: 11px; color: #71717a; border-top: 1px solid #27272a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">AYMARD<span class="logo-accent">STORE</span></div>
      <div class="badge">🔥 NOUVEL ARRIVAGE EXCLUSIF</div>
    </div>
    <div class="content">
      ${product.images?.[0] ? `<img src="${product.images[0]}" alt="${product.name_fr}" class="product-img" />` : ''}
      <h1 class="product-title">${product.name_fr || product.name}</h1>
      <div class="product-price">${formattedFcfa} FCFA · ${formattedEur} €</div>
      <p class="product-desc">${customMessage || product.description_fr || product.description || 'Découvrez cette nouvelle pièce exclusive disponible dès maintenant en stock limité.'}</p>
      <div>
        <a href="${productUrl}" class="btn">DÉCOUVRIR LE PRODUIT ➔</a>
      </div>
    </div>
    <div class="footer">
      <p>Vous recevez cet email car vous êtes inscrit(e) aux alertes nouveaux drops d'Aymard Store.</p>
      <p>Garantie 100% Neuf & Authentique · Expédition Suivie · Service Client WhatsApp 7j/7</p>
    </div>
  </div>
</body>
</html>
      `;

      if (resendApiKey) {
        try {
          const recipientEmails = emailSubscribers.map((s: any) => s.email);
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: 'Aymard Store <onboarding@resend.dev>',
              to: recipientEmails.slice(0, 50),
              subject: `🔥 NOUVEAU DROP : ${product.name_fr || product.name}`,
              html: emailHtml
            })
          });

          if (emailRes.ok) {
            emailsSent = emailSubscribers.length;
          } else {
            const errData = await emailRes.json();
            errors.push(`Resend Email: ${errData.message || 'Erreur API'}`);
          }
        } catch (e: any) {
          errors.push(`Erreur réseau Email: ${e.message}`);
        }
      } else {
        // Simulated local broadcast
        emailsSent = emailSubscribers.length;
      }
    }

    // 2. Webhook WhatsApp / Cloud API Dispatch
    if (channels.includes('WHATSAPP') && whatsappWebhookUrl && whatsappSubscribers.length > 0) {
      try {
        const waText = `🔥 *NOUVEAU DROP CHEZ AYMARD STORE !*\n\n👟 *${product.name_fr || product.name}*\n💰 Prix : *${formattedFcfa} FCFA* (${formattedEur} €)\n📦 Stock : *${product.stock || 1} exemplaire(s) disponible(s)*\n\n👉 *Commandez dès maintenant :* ${productUrl}\n\n_Garantie 100% Neuf & Authentique · Livraison 48h_`;
        await fetch(whatsappWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'NEW_PRODUCT_BROADCAST',
            recipients: whatsappSubscribers.map((s: any) => s.phone),
            message: waText,
            productUrl
          })
        });
        whatsappDispatched = whatsappSubscribers.length;
      } catch (e: any) {
        errors.push(`Erreur Webhook WhatsApp: ${e.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      whatsappSubscribersCount: whatsappSubscribers.length,
      whatsappDispatched,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur interne.' }, { status: 500 });
  }
}
