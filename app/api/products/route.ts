import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const DOWNLOADS_CSV = 'C:\\Users\\HP\\Downloads\\shopify_products_wehaveit_fr.csv';

// RFC 4180 Multi-line CSV parser
function parseFullCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function extractCleanUrls(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s"'`<>•\)\(\]\,\;]+/gi);
  if (!matches) return [];
  const cleaned: string[] = [];
  for (const m of matches) {
    const u = m.replace(/[\,\.]$/, '').trim();
    if (u.startsWith('http://') || u.startsWith('https://')) {
      cleaned.push(u);
    }
  }
  return cleaned;
}

function detectCategory(title: string, imageUrls: string[], description: string, rawType: string, sizes?: string[]): string {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  const typeLower = rawType.toLowerCase();
  const textToScan = `${title} ${imageUrls.join(' ')} ${description} ${rawType}`.toLowerCase();
  
  // 1. Shoe size detection
  if (sizes && sizes.some(s => /^\s*\d{2}(\.\d)?\s*(eu|us|uk)?\s*$/i.test(s))) {
    return 'shoes';
  }

  // 2. Shoes / Sneakers Detection (Title & Brands First)
  if (/\b(autry|sneakers?|baskets?|boots?|talons?|chaussures?|footwear|kicks|running|air-force|jordan|dunk|stan-smith|yeezy|moccasin|derby|spezial|sambas?|gazelle|campus|bape-sta|new balance|asics|salomon|hoka|ugg|vans|converse|birkenstock|crocs|clarks|slide|slides|mule|mules|clog|clogs)\b/i.test(titleLower) ||
      /\b(shoe|shoes|sneaker|sneakers|basket|baskets|chaussure|chaussures|footwear|kicks)\b/i.test(typeLower)) {
    return 'shoes';
  }

  // 3. Clothing Detection
  if (/\b(t-shirt|tee|shirt|veste|jacket|pantalon|jean|jeans|robe|pull|hoodie|hoodies|maillot|vêtement|vetement|suit|skirt|top|short|shorts|jogging|sweat|sweatshirt|coat|manteau|jersey|cardigan|polo)\b/i.test(titleLower) ||
      /\b(clothing|apparel|vetement|vêtement)\b/i.test(typeLower)) {
    return 'clothing';
  }

  // 4. Bags / Maroquinerie (With Word Boundaries to avoid rutabaga!)
  if (/\b(sac|sacs|bag|bags|handbag|handbags|backpack|backpacks|pochette|pochettes|tote|totes|wallet|wallets|portefeuille|portefeuilles|valise|valises|cabas)\b/i.test(titleLower) ||
      /\b(bag|bags|sac|sacs|handbag)\b/i.test(typeLower)) {
    return 'bags';
  }

  // 5. Watches / Horlogerie
  if (/\b(montre|montres|watch|watches|chronographe|chronograph|horlogerie)\b/i.test(titleLower) ||
      /\b(watch|watches|montre)\b/i.test(typeLower)) {
    return 'watches';
  }

  // 6. Jewelry / Joaillerie
  if (/\b(bague|bagues|ring|rings|bracelet|bracelets|collier|colliers|necklace|necklaces|boucle|boucles|earring|earrings|pendentif|bijou|bijoux|jewelry|perle|diamant)\b/i.test(titleLower) ||
      /\b(jewelry|bijou|bijoux)\b/i.test(typeLower)) {
    return 'jewelry';
  }

  // 7. Hats & Caps
  if (/\b(chapeau|chapeaux|hat|hats|casquette|casquettes|cap|caps|bonnet|bonnets|beanie|beanies|bob|fedora|panama)\b/i.test(titleLower)) {
    return 'hats';
  }

  // 8. Socks
  if (/\b(chaussette|chaussettes|sock|socks)\b/i.test(titleLower)) {
    return 'socks';
  }

  // 9. Accessories
  if (/\b(lunette|lunettes|sunglass|sunglasses|glasses|ceinture|ceintures|belt|belts|echarpe|echarpes|scarf|scarves|gant|gants|glove|gloves|parfum|parfums|accessoire|accessoires)\b/i.test(titleLower)) {
    return 'accessories';
  }

  // Fallback check on full text
  if (/\b(shoe|shoes|sneaker|sneakers|basket|baskets|chaussure|chaussures)\b/i.test(textToScan)) {
    return 'shoes';
  }
  if (/\b(t-shirt|tee|shirt|veste|jacket|pantalon|hoodie|maillot|jersey)\b/i.test(textToScan)) {
    return 'clothing';
  }
  if (/\b(sac|sacs|bag|bags|handbag|backpack|pochette|tote|cabas)\b/i.test(textToScan) && !/\brutabaga\b/i.test(textToScan)) {
    return 'bags';
  }

  return 'shoes';
}

function parseShopifyCSVToProducts(csvText: string): any[] {
  const rows = parseFullCSV(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().trim().replace(/[\ufeff"]/g, ''));
  const getCol = (colNames: string[]) => {
    return headers.findIndex(h => colNames.some(name => h === name.toLowerCase() || h.includes(name.toLowerCase())));
  };

  const handleIdx = getCol(['handle']);
  const titleIdx = getCol(['title']);
  const bodyIdx = getCol(['body (html)', 'body', 'description']);
  const vendorIdx = getCol(['vendor', 'marque', 'brand']);
  const typeIdx = getCol(['type', 'product type']);
  const option1ValueIdx = getCol(['option1 value', 'size', 'taille', 'pointure']);
  const priceIdx = getCol(['variant price', 'price', 'prix']);
  const comparePriceIdx = getCol(['variant compare at price', 'compare at price', 'prix barre', 'compare price']);
  const imageSrcIdx = getCol(['image src', 'image', 'photo', 'src', 'images']);
  const variantImageIdx = getCol(['variant image']);

  const grouped = new Map<string, any>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawHandle = handleIdx >= 0 && row[handleIdx] ? row[handleIdx].trim() : '';
    const rawTitle = titleIdx >= 0 && row[titleIdx] ? row[titleIdx].trim() : '';

    if (!rawHandle && !rawTitle) continue;
    const groupKey = rawHandle || rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        handle: rawHandle,
        title: rawTitle,
        bodyHtml: bodyIdx >= 0 && row[bodyIdx] ? row[bodyIdx].trim() : '',
        vendor: vendorIdx >= 0 && row[vendorIdx] ? row[vendorIdx].trim() : '',
        type: typeIdx >= 0 && row[typeIdx] ? row[typeIdx].trim() : '',
        price: 0,
        comparePrice: 0,
        sizes: new Set<string>(),
        images: new Set<string>(),
      });
    }

    const item = grouped.get(groupKey)!;

    if (!item.title && rawTitle) item.title = rawTitle;
    if (!item.bodyHtml && bodyIdx >= 0 && row[bodyIdx]) item.bodyHtml = row[bodyIdx].trim();
    if (!item.vendor && vendorIdx >= 0 && row[vendorIdx]) item.vendor = row[vendorIdx].trim();
    if (!item.type && typeIdx >= 0 && row[typeIdx]) item.type = row[typeIdx].trim();

    if (imageSrcIdx >= 0 && row[imageSrcIdx]) {
      const urls = extractCleanUrls(row[imageSrcIdx]);
      urls.forEach(u => item.images.add(u));
    }
    if (variantImageIdx >= 0 && row[variantImageIdx]) {
      const urls = extractCleanUrls(row[variantImageIdx]);
      urls.forEach(u => item.images.add(u));
    }

    if (option1ValueIdx >= 0 && row[option1ValueIdx]) {
      const sz = row[option1ValueIdx].trim();
      if (sz && sz.toLowerCase() !== 'default title' && sz.toLowerCase() !== 'default') {
        item.sizes.add(sz);
      }
    }

    if (priceIdx >= 0 && row[priceIdx]) {
      const p = parseFloat(row[priceIdx].replace(/[^0-9.,]/g, '').replace(',', '.'));
      if (!isNaN(p) && p > 0 && item.price === 0) {
        item.price = p;
      }
    }
    if (comparePriceIdx >= 0 && row[comparePriceIdx]) {
      const cp = parseFloat(row[comparePriceIdx].replace(/[^0-9.,]/g, '').replace(',', '.'));
      if (!isNaN(cp) && cp > 0 && item.comparePrice === 0) {
        item.comparePrice = cp;
      }
    }
  }

  const parsedProducts: any[] = [];
  let counter = 1;

  for (const [key, item] of grouped.entries()) {
    const rawName = item.title || item.handle || `Produit ${counter}`;
    const cleanName = rawName.replace(/["\\]/g, '').trim();
    const imagesList = Array.from(item.images as Set<string>);

    const rawDesc = item.bodyHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const finalDesc = rawDesc || `${cleanName} - Produit authentique disponible chez Aymard Store.`;

    const finalPrice = item.price > 0 ? item.price : 99.00;
    const finalComparePrice = item.comparePrice > finalPrice ? item.comparePrice : undefined;

    const sizesArray = Array.from(item.sizes as Set<string>);
    const detectedCat = detectCategory(cleanName, imagesList, finalDesc, item.type, sizesArray);

    parsedProducts.push({
      id: `prod_${Date.now()}_${counter}`,
      name_fr: cleanName,
      name_en: cleanName,
      name_es: cleanName,
      slug: (item.handle || cleanName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      price: Math.round(finalPrice * 100) / 100,
      comparePrice: finalComparePrice ? Math.round(finalComparePrice * 100) / 100 : undefined,
      category: detectedCat,
      images: imagesList.length > 0 ? imagesList : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop'],
      rating: 5,
      reviewCount: 0,
      stock: 45,
      isNew: true,
      isFeatured: counter <= 8,
      delivery48H: true,
      description_fr: finalDesc,
      description_en: finalDesc,
      description_es: finalDesc,
      badge: finalComparePrice ? 'PROMO' : (counter <= 5 ? 'NEW' : null),
      sizes: sizesArray.length > 0 ? sizesArray : undefined,
      brand: item.vendor || undefined,
    });

    counter++;
  }

  return parsedProducts;
}

function loadProductsFromFile(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    // Only if products file NEVER existed yet, check if we have the Shopify CSV in Downloads
    if (fs.existsSync(DOWNLOADS_CSV)) {
      const csvText = fs.readFileSync(DOWNLOADS_CSV, 'utf-8');
      const products = parseShopifyCSVToProducts(csvText);
      if (products.length > 0) {
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
        return products;
      }
    }
  } catch (err) {
    console.error('Error loading products from server:', err);
  }
  return [];
}

export async function GET() {
  const products = loadProductsFromFile();
  return NextResponse.json({ success: true, count: products.length, products });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let newProducts = [];

    if (body.csvText) {
      newProducts = parseShopifyCSVToProducts(body.csvText);
    } else if (Array.isArray(body.products)) {
      newProducts = body.products;
    } else if (Array.isArray(body)) {
      newProducts = body;
    }

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(newProducts, null, 2), 'utf-8');

    return NextResponse.json({ 
      success: true, 
      count: newProducts.length, 
      products: newProducts 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([], null, 2), 'utf-8');
    return NextResponse.json({ success: true, message: 'Products database cleared' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
