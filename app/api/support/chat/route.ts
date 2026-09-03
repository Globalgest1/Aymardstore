import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// Cached catalog summary to avoid re-reading and parsing full JSON on every message
let cachedCatalogSummary: any[] | null = null;

function getCatalogSummary() {
  if (cachedCatalogSummary) return cachedCatalogSummary;

  try {
    const filePath = path.join(process.cwd(), 'data', 'products.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const products = JSON.parse(raw);
      // Create concise summary of products (name, brand, category, prices, slug, sizes)
      cachedCatalogSummary = products.map((p: any) => ({
        id: p.id,
        name: p.name_fr || p.name,
        brand: p.brand,
        category: p.category,
        price_eur: p.price,
        price_fcfa: p.locationPrices?.benin || (p.price ? Math.round(p.price * 655.957) : 0),
        slug: p.slug,
        sizes: Array.isArray(p.sizes) ? p.sizes.slice(0, 8) : [],
        colors: Array.isArray(p.colors) ? p.colors : [],
        stock: p.stock ?? 10,
        badge: p.badge || (p.isNew ? 'NEW' : null)
      }));
    }
  } catch (err) {
    console.error('[SupportChat API] Failed to load products catalog:', err);
  }

  return cachedCatalogSummary || [];
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API Gemini non configurée sur le serveur (.env.local)' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { message, image, history, country = 'benin' } = body;

    if (!message && !image) {
      return NextResponse.json(
        { error: 'Message ou image requis.' },
        { status: 400 }
      );
    }

    const catalog = getCatalogSummary();
    const isBenin = country === 'benin';

    // Prepare image inlineData if provided
    const inlineDataParts: { inlineData: { mimeType: string; data: string } }[] = [];
    if (image) {
      let mimeType = 'image/jpeg';
      let base64Data = '';

      if (image.startsWith('data:')) {
        const match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        } else {
          base64Data = image.split(',')[1] || image;
        }
      } else if (image.startsWith('http://') || image.startsWith('https://')) {
        try {
          const imgRes = await fetch(image);
          const arrayBuf = await imgRes.arrayBuffer();
          base64Data = Buffer.from(arrayBuf).toString('base64');
          mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
        } catch (e) {
          console.warn('[SupportChat API] Failed to fetch remote image:', e);
        }
      } else {
        base64Data = image;
      }

      if (base64Data) {
        inlineDataParts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      }
    }

    // Format previous conversation context if available (last 6 exchanges max)
    let historyContext = '';
    if (Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-6);
      historyContext = "\nHistorique récent de l'échange avec le client :\n" +
        recent.map((m: any) => `${m.role === 'user' ? 'Client' : 'Concierge Aymard'}: ${m.content}`).join('\n') + '\n';
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `Tu es le Concierge Intelligent et Conseiller de Vente officiel de 'AYMARD STORE', la prestigieuse boutique de sneakers authentiques, streetwear haut de gamme et maroquinerie de luxe (présente au Bénin et en Europe).

INFORMATIONS ESSENTIELLES SUR LA BOUTIQUE :
1. MOYENS DE PAIEMENT (100% SÉCURISÉS) :
   - Passerelle officielle : LEEKPAY (Mobile Money : MTN MoMo, Moov Money, Celtiis Cash, Orange Money, Wave + Cartes Bancaires : VISA, Mastercard).
   - Au Bénin : Option de Paiement à la Livraison également disponible (Cash ou Mobile Money au livreur).
   - Pas de frais cachés, transactions instantanées et chiffrées.
2. EXPÉDITION & DÉLAIS :
   - Bénin (Cotonou, Calavi, Porto-Novo, etc.) : Livraison Express en 24h à 48h.
   - International & Europe : 3 à 6 jours ouvrés par transporteur sécurisé (DHL / Colissimo International).
3. AUTHENTICITÉ & QUALITÉ :
   - 100% Neuf & Authentique, certifié par nos experts avant toute remise au client.
   - Politique exclusive : Vu le caractère limité et prestigieux des modèles, aucun retour ni échange n'est accepté. Nous guidons parfaitement le client sur le choix de sa pointure avant l'achat.
4. DEVISE & PRIX :
   - Marché actuel : ${isBenin ? 'Bénin (FCFA / XOF)' : 'International / Europe (€)'}.
   - Toujours mentionner les prix en FCFA en priorité pour le Bénin (et préciser l'équivalent € si utile).

CATALOGUE PRODUITS ACTUEL DISPONIBLE (Extrait représentatif des modèles en stock) :
${JSON.stringify(catalog.slice(0, 60))}

DIRECTIVES POUR TA RÉPONSE :
- Si l'utilisateur envoie une PHOTO :
  1. Identifie précisément la sneaker / vêtement / sac (marque, modèle exact, silhouette, coloris, ex: "Nike Dunk Low Retro Panda", "Asics Gel-NYC", "Air Jordan 4").
  2. Vérifie si le modèle existe dans notre catalogue ou recommande le modèle le plus proche disponible.
  3. Indique clairement son tarif en FCFA (et €), les pointures disponibles, et propose d'ajouter au panier ou de passer commande.
  4. Crée un lien direct markdown si le produit est dans notre catalogue: [Voir la paire](/products/slug-du-produit).
- Si l'utilisateur pose une question texte (pointure, livraison, paiement LeekPay, disponibilité, suivi) :
  Réponds avec élégance, chaleur, précision, réactivité et professionnalisme.
- Ton : Luxueux, courtois, chaleureux, concis, orienté satisfaction client et vente.

FORMAT DE RÉPONSE STRICTEMENT EN JSON (sans backticks markdown superflus autour du JSON) :
{
  "text": "Texte de ta réponse rédigé en beau Markdown (avec emojis, listes à puces élégantes et sauts de ligne)",
  "detectedProduct": "Nom du modèle identifié (ou null si simple question générale)",
  "productUrl": "/products/slug (ou null si aucun produit spécifique)",
  "options": [
    { "label": "Texte court du bouton", "action": "go_product" | "go_cart" | "human_agent" | "open_whatsapp" | "sizes_help" | "payment_plans", "url": "/products/slug" }
  ]
}`;

    const contents: any[] = [];
    if (inlineDataParts.length > 0) {
      contents.push(...inlineDataParts);
    }
    contents.push({
      text: `${systemPrompt}\n${historyContext}\nMessage du client : "${message || 'Que pensez-vous de cette photo ? Avez-vous ce modèle ?'}"`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const rawText = response.text || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      // Fallback in case raw text was not pure JSON
      parsedData = {
        text: rawText.replace(/^\`\`\`json\s*/i, '').replace(/\`\`\`\s*$/i, '').trim(),
        options: [
          { label: 'Découvrir le Catalogue', action: 'go_products' },
          { label: 'Conseiller WhatsApp Direct', action: 'open_whatsapp' }
        ]
      };
    }

    return NextResponse.json({
      success: true,
      text: parsedData.text || "Comment puis-je vous être utile chez Aymard Store aujourd'hui ?",
      detectedProduct: parsedData.detectedProduct || null,
      productUrl: parsedData.productUrl || null,
      options: Array.isArray(parsedData.options) && parsedData.options.length > 0 
        ? parsedData.options 
        : [
            { label: 'Voir le Catalogue', action: 'go_products' },
            { label: 'Conseiller WhatsApp', action: 'open_whatsapp' }
          ]
    });
  } catch (error: any) {
    console.error('[SupportChat API] Error in Gemini chat:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Erreur lors du traitement de la requête IA.',
        fallback: true
      },
      { status: 500 }
    );
  }
}
