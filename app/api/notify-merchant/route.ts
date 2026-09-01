import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, order, merchantSettings, testMessage } = body;

    const adminEmail = merchantSettings?.adminEmail || 'judesinaberogui@gmail.com';
    const emailEnabled = merchantSettings?.emailAlertsEnabled ?? true;
    const telegramEnabled = merchantSettings?.telegramEnabled ?? true;
    const whatsappEnabled = merchantSettings?.whatsappEnabled ?? true;
    const telegramBotToken = merchantSettings?.telegramBotToken;
    const telegramChatId = merchantSettings?.telegramChatId;
    const whatsappWebhookUrl = merchantSettings?.whatsappWebhookUrl;
    const resendApiKey = merchantSettings?.resendApiKey;

    let telegramStatus = 'Non configuré';
    let emailStatus = 'Simulé en local';

    // Handle TEST_ALERT
    if (type === 'TEST_ALERT') {
      const msg = testMessage || '🚀 Test réussi ! Vos notifications Marchand Aymard Store sont prêtes.';

      // 1. Send Telegram Bot Message if Token & Chat ID exist
      if (telegramEnabled && telegramBotToken && telegramChatId) {
        try {
          const teleRes = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: `🔔 *TEST ALERTE MARCHAND AYMARD STORE*\n\n${msg}`,
              parse_mode: 'Markdown'
            })
          });
          const teleData = await teleRes.json();
          if (teleData.ok) {
            telegramStatus = '✅ Envoyé sur votre Telegram !';
          } else {
            telegramStatus = `⚠️ Erreur Telegram: ${teleData.description || 'Token/ChatID invalide'}`;
          }
        } catch (e: any) {
          telegramStatus = `⚠️ Erreur connexion Telegram: ${e.message}`;
        }
      }

      // 2. Send Real Email via Resend API if API Key provided
      if (emailEnabled && resendApiKey) {
        try {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: 'Aymard Store <onboarding@resend.dev>',
              to: [adminEmail],
              subject: '🔔 TEST ALERTE MARCHAND AYMARD STORE',
              html: `<p><strong>🚀 Test réussi !</strong></p><p>${msg}</p>`
            })
          });
          if (emailRes.ok) {
            emailStatus = `✅ Email envoyé à ${adminEmail} !`;
          } else {
            const errData = await emailRes.json();
            emailStatus = `⚠️ Erreur Resend Email: ${errData.message || 'Clé API Resend invalide'}`;
          }
        } catch (e: any) {
          emailStatus = `⚠️ Erreur envoi Email: ${e.message}`;
        }
      } else if (emailEnabled) {
        emailStatus = `📧 Simulation Email pour ${adminEmail} (Entrez une clé Resend API pour l'envoi réel sur Gmail)`;
      }

      // 3. Send WhatsApp Webhook test
      if (whatsappEnabled && whatsappWebhookUrl) {
        await fetch(whatsappWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: msg })
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: `Statut du test :\n- Telegram : ${telegramStatus}\n- Email : ${emailStatus}`
      });
    }

    // Handle NEW_ORDER or PAYMENT_RECEIVED Action
    if (type === 'NEW_ORDER' && order) {
      const isFcfa = order.currency === 'FCFA';
      const orderTotal = Number(order.total) || 0;
      const formattedTotal = isFcfa 
        ? `${orderTotal.toLocaleString('fr-FR')} FCFA`
        : `${orderTotal.toFixed(2)} €`;
      const altTotal = isFcfa
        ? `${(orderTotal / 655.957).toFixed(2)} €`
        : `${Math.round(orderTotal * 655.957).toLocaleString('fr-FR')} FCFA`;

      const clientName = order.customerName || order.shippingAddress?.fullName || 'Client Aymard Store';
      const clientPhone = order.shippingAddress?.phone || order.customerPhone || 'Non renseigné';
      const clientEmail = order.customerEmail || order.shippingAddress?.email || '';
      const clientCity = order.shippingAddress?.city || 'Cotonou';
      const clientCountry = order.shippingAddress?.country || 'Bénin';
      const clientStreet = order.shippingAddress?.street || 'Haie Vive';

      const itemsFormatted = (order.items || []).map((item: any, idx: number) => {
        const prod = item.product || item;
        const name = prod.name_fr || prod.name || item.name || 'Sneaker Exclusive';
        const size = item.selectedSize || item.size || 'Standard';
        const color = item.selectedColor || item.color || '';
        const qty = item.quantity || 1;
        const sizeInfo = size ? `Taille ${size}` : '';
        const colorInfo = color ? `Coloris ${color}` : '';
        const attrStr = [sizeInfo, colorInfo].filter(Boolean).join(' • ');

        return `  👟 *${name}* (x${qty})${attrStr ? `\n     ↳ ${attrStr}` : ''}`;
      }).join('\n\n');

      const itemsHtml = (order.items || []).map((item: any) => {
        const prod = item.product || item;
        const name = prod.name_fr || prod.name || item.name || 'Sneaker Exclusive';
        const size = item.selectedSize || item.size || 'Standard';
        const color = item.selectedColor || item.color || '';
        const qty = item.quantity || 1;
        const img = prod.images?.[0] || item.image || '';

        return `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:12px;vertical-align:middle;">
              ${img ? `<img src="${img}" width="48" height="48" style="border-radius:8px;object-fit:contain;background:#f8fafc;display:inline-block;vertical-align:middle;margin-right:12px;" />` : ''}
              <div style="display:inline-block;vertical-align:middle;">
                <strong style="color:#0f172a;font-size:14px;display:block;">${name}</strong>
                <span style="color:#64748b;font-size:12px;">${[size ? `Pointure : <strong>${size}</strong>` : '', color ? `Couleur : ${color}` : ''].filter(Boolean).join(' • ')}</span>
              </div>
            </td>
            <td style="padding:12px;text-align:center;color:#0f172a;font-weight:700;font-size:13px;">x${qty}</td>
          </tr>
        `;
      }).join('');

      const isCod = order.paymentMethod === 'COD';

      const paymentMethodName = 
        order.paymentMethod === 'COD' ? '💵 Paiement à la Livraison (Espèces / MoMo au livreur)' :
        order.paymentMethod === 'SASPAY' ? '🟣 SasPay (Mobile Money & Carte Bancaire)' :
        order.paymentMethod === 'LEEKPAY' ? '🟢 LeekPay (Mobile Money & Carte Bancaire)' :
        '⚡ Paiement Sécurisé';

      const statusBadge = isCod ? 'À ENCAISSER À LA LIVRAISON 🚚' : 'VALIDÉ & ENCAISSÉ ✅';
      const totalHeader = isCod ? 'TOTAL À ENCAISSER :' : 'TOTAL PAYÉ :';
      const bannerTitle = isCod ? '📦 NOUVELLE COMMANDE À LIVRER ! 🚚' : '🔥 NOUVELLE VENTE CONFIRMÉE ! 🔥';

      const alertMessage = 
`⚡ ═══════════════════════ ⚡
${bannerTitle}
⚡ ═══════════════════════ ⚡

👑 *Client :* ${clientName}
📞 *Téléphone / WhatsApp :* \`${clientPhone}\`
📍 *Ville & Pays :* ${clientCity}, ${clientCountry}
🏠 *Adresse :* ${clientStreet}
${clientEmail ? `📧 *Email :* ${clientEmail}\n` : ''}
📦 *SNEAKER(S) COMMANDÉE(S) :*
${itemsFormatted}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *${totalHeader}* *${formattedTotal}* (${altTotal})
💳 *Paiement :* ${paymentMethodName}
🛡️ *Statut :* ${statusBadge}
🆔 *Commande :* \`#${order.orderNumber || order.id}\`
📅 *Date :* ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Porto-Novo' })}
━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 *Lien WhatsApp direct client :*
https://wa.me/${clientPhone.replace(/[^0-9]/g, '')}`;

      // 1. Send Telegram Notification
      if (telegramEnabled && telegramBotToken && telegramChatId) {
        try {
          await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: alertMessage,
              parse_mode: 'Markdown',
              disable_web_page_preview: true
            })
          });
        } catch (err) {
          console.error('Telegram notification error:', err);
        }
      }

      // 2. Send Real Email via Resend if API Key configured
      if (emailEnabled && resendApiKey) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: 'Aymard Store <notifications@aymard-store.com>',
              to: [adminEmail],
              subject: `🛍️ Nouvelle commande #${order.orderNumber || order.id} • ${formattedTotal}`,
              html: `
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 25px rgba(0,0,0,0.05);">
                  <div style="background:linear-gradient(135deg, #09090b 0%, #1e1b4b 100%);padding:28px 24px;text-align:center;color:#ffffff;">
                    <span style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#38bdf8;">AYMARD STORE LUXURY</span>
                    <h1 style="margin:8px 0 4px 0;font-size:24px;font-weight:900;">🎉 Nouvelle Vente Confirmée !</h1>
                    <p style="margin:0;font-size:13px;color:#94a3b8;">Commande <strong>#${order.orderNumber || order.id}</strong></p>
                  </div>
                  
                  <div style="padding:24px;">
                    <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:20px;">
                      <h3 style="margin:0 0 10px 0;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Coordonnées Client</h3>
                      <p style="margin:3px 0;font-size:14px;color:#0f172a;"><strong>Nom :</strong> ${clientName}</p>
                      <p style="margin:3px 0;font-size:14px;color:#0f172a;"><strong>Téléphone :</strong> <a href="tel:${clientPhone}" style="color:#0284c7;text-decoration:none;font-weight:700;">${clientPhone}</a></p>
                      <p style="margin:3px 0;font-size:14px;color:#0f172a;"><strong>Livraison :</strong> ${clientStreet}, ${clientCity} (${clientCountry})</p>
                      ${clientEmail ? `<p style="margin:3px 0;font-size:14px;color:#0f172a;"><strong>Email :</strong> ${clientEmail}</p>` : ''}
                    </div>

                    <h3 style="margin:0 0 12px 0;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Articles Commandés</h3>
                    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>

                    <div style="background:linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(2,132,199,0.08) 100%);border:1.5px solid #10b981;border-radius:12px;padding:18px;text-align:center;">
                      <span style="font-size:12px;color:#059669;font-weight:800;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px;">Montant Total Encaissé</span>
                      <div style="font-size:28px;font-weight:900;color:#0f172a;">${formattedTotal}</div>
                      <span style="font-size:12px;color:#64748b;font-weight:600;">soit environ ${altTotal} • ${paymentMethodName}</span>
                    </div>

                    <div style="margin-top:24px;text-align:center;">
                      <a href="https://wa.me/${clientPhone.replace(/[^0-9]/g, '')}" style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;font-weight:800;padding:12px 24px;border-radius:30px;font-size:13px;box-shadow:0 4px 14px rgba(37,211,102,0.35);">
                        💬 Contacter le client sur WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              `
            })
          });
        } catch (err) {
          console.error('Resend email notification error:', err);
        }
      }

      // 3. Send WhatsApp Webhook if configured
      if (whatsappEnabled && whatsappWebhookUrl) {
        try {
          await fetch(whatsappWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: alertMessage })
          });
        } catch (err) {
          console.error('WhatsApp notification error:', err);
        }
      }

      return NextResponse.json({
        success: true,
        sentTo: adminEmail,
        orderId: order.id
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notify merchant endpoint error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
