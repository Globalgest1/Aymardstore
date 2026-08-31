import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

function parseNumber(val: any): number | undefined {
  if (typeof val === 'number' && !isNaN(val) && val > 0) return val;
  if (typeof val === 'string') {
    const clean = val.replace(/[^0-9.,]/g, '').replace(',', '.');
    const num = parseFloat(clean);
    if (!isNaN(num) && num > 0) return num;
  }
  return undefined;
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
    const { image, images, additionalNotes } = body;

    const inputImages: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      inputImages.push(...images);
    } else if (image) {
      inputImages.push(image);
    }

    if (inputImages.length === 0) {
      return NextResponse.json(
        { error: 'Veuillez fournir au moins une photo de produit.' },
        { status: 400 }
      );
    }

    // Prepare inline data for each image (max 6 images to preserve quota & speed)
    const inlineDataParts: { inlineData: { mimeType: string; data: string } }[] = [];

    for (const img of inputImages.slice(0, 6)) {
      let mimeType = 'image/jpeg';
      let base64Data = '';

      if (img.startsWith('data:')) {
        const match = img.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        } else {
          base64Data = img.split(',')[1] || img;
        }
      } else if (img.startsWith('http://') || img.startsWith('https://')) {
        try {
          const imgRes = await fetch(img);
          const arrayBuf = await imgRes.arrayBuffer();
          const buf = Buffer.from(arrayBuf);
          base64Data = buf.toString('base64');
          mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
        } catch (e) {
          console.warn('Failed to fetch remote image:', img, e);
          continue;
        }
      } else {
        base64Data = img;
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

    if (inlineDataParts.length === 0) {
      return NextResponse.json(
        { error: 'Format d\'image non pris en charge.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Tu es un expert e-commerce et tarificateur mode/streetwear/luxe pour la boutique haut de gamme 'Aymard Store' (présente au Bénin et en Europe).
Analyse l'ensemble des photos fournies pour ce produit (plusieurs angles, détails, matières, logo).

Directives obligatoires :
1. "name" : Nom commercial complet en Français (ex: "Nike Dunk Low Retro White Black Panda", "Sac Cabas Cuir Grainé").
2. "name_en" : Nom en Anglais.
3. "name_es" : Nom en Espagnol.
4. "brand" : Marque précise détectée (ex: "Nike", "Adidas", "Asics", "Balenciaga", "Zara", "Aymard Store", etc.).
5. "category" : STRICTEMENT l'une des suivantes :
   - "shoes" (chaussures, baskets, sneakers, talons, bottes, mocassins)
   - "clothing" (vêtements, t-shirts, pulls, vestes, pantalons)
   - "bags" (sacs à main, sacs à dos, pochettes)
   - "watches" (montres)
   - "jewelry" (bijoux, bagues, bracelets)
   - "necklaces" (colliers, pendentifs)
   - "hats" (chapeaux, casquettes, bonnets)
   - "socks" (chaussettes)
   - "accessories" (ceintures, lunettes, écharpes)
6. "description" : Description vendeuse en Français (2-3 paragraphes élégants avec détails matières, style et confort).
7. "description_en" : Description équivalente en Anglais.
8. "description_es" : Description équivalente en Espagnol.
9. "pricing" : SUGGESTION INTELLIGENTE DES PRIX (nombres stricts sans symbole) :
   - "price" : Prix de vente conseillé de base en Euros (€) (ex: 129.90).
   - "comparePrice" : Prix barré / d'origine estimé en Euros (€) (ex: 159.00).
   - "beninPrice" : Prix de vente conseillé pour le marché local du Bénin en FCFA (ex: 65000 pour des sneakers ou sacs de qualité, 35000 pour des vêtements, etc. Ajuste selon la gamme perçue).
   - "beninComparePrice" : Prix barré au Bénin en FCFA (ex: 85000).
   - "francePrice" : Prix de vente France en Euros (€) (ex: 120.00).
   - "franceComparePrice" : Prix barré France en Euros (€) (ex: 140.00).
   - "belgiquePrice" : Prix de vente Belgique en Euros (€) (ex: 125.00).
   - "belgiqueComparePrice" : Prix barré Belgique en Euros (€) (ex: 145.00).
10. "badge" : Badge marketing conseillé ("NEW", "HOT", "TENDANCE", "LIMITED" ou "PREMIUM").
11. "colors" : Tableau de 1 à 4 noms de couleurs en Français (ex: ["Noir", "Blanc"]).
12. "suggestedSizes" : Tableau des variantes recommandées :
    - Pour "shoes" : ["39", "40", "41", "42", "43", "44", "45"]
    - Pour "clothing" : ["XS", "S", "M", "L", "XL", "XXL"]
    - Pour "bags" ou "accessories" : ["Taille Unique"]
13. "variantType" : "pointure" | "taille" | "volume" | "unique".
${additionalNotes ? `\nNotes supplémentaires de l'administrateur : ${additionalNotes}` : ''}

Réponds STRICTEMENT avec un objet JSON sans aucun formatage Markdown externe :
{
  "name": "...",
  "name_en": "...",
  "name_es": "...",
  "brand": "...",
  "category": "...",
  "description": "...",
  "description_en": "...",
  "description_es": "...",
  "pricing": {
    "price": 129.9,
    "comparePrice": 159.0,
    "beninPrice": 65000,
    "beninComparePrice": 85000,
    "francePrice": 120,
    "franceComparePrice": 140,
    "belgiquePrice": 125,
    "belgiqueComparePrice": 145
  },
  "badge": "NEW",
  "colors": ["Noir", "Blanc"],
  "suggestedSizes": ["40", "41", "42", "43", "44"],
  "variantType": "pointure"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        ...inlineDataParts,
        { text: prompt },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const text = response.text || '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const cleanJson = text.replace(/```json?/g, '').replace(/```/g, '').trim();
      data = JSON.parse(cleanJson);
    }

    // Clean numeric pricing
    const pricingRaw = data.pricing || {};
    const pricingClean = {
      price: parseNumber(pricingRaw.price) || 99,
      comparePrice: parseNumber(pricingRaw.comparePrice) || undefined,
      beninPrice: parseNumber(pricingRaw.beninPrice) || 60000,
      beninComparePrice: parseNumber(pricingRaw.beninComparePrice) || undefined,
      francePrice: parseNumber(pricingRaw.francePrice) || parseNumber(pricingRaw.price) || 99,
      franceComparePrice: parseNumber(pricingRaw.franceComparePrice) || parseNumber(pricingRaw.comparePrice) || undefined,
      belgiquePrice: parseNumber(pricingRaw.belgiquePrice) || parseNumber(pricingRaw.price) || 99,
      belgiqueComparePrice: parseNumber(pricingRaw.belgiqueComparePrice) || parseNumber(pricingRaw.comparePrice) || undefined,
    };

    data.pricing = pricingClean;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Erreur API Gemini generate-product:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de l\'analyse des images par l\'IA.' },
      { status: 500 }
    );
  }
}
