import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

// Read products for metadata generation
function getProductBySlug(slug: string) {
  const filePath = path.join(process.cwd(), 'data', 'products.json');
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return data.find((p: any) => p.slug === slug);
  } catch (error) {
    console.error('Error reading products.json:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  
  if (!product) return { title: 'Produit non trouvé | Aymard Store' };
  
  const productName = product.name_fr || product.name || 'Produit';
  const productDesc = product.description_fr || product.description || `Découvrez ${productName} sur Aymard Store.`;
  
  return {
    title: `${productName} | Aymard Store`,
    description: productDesc,
    openGraph: {
      title: `${productName} | Aymard Store`,
      description: productDesc,
      images: product.images?.[0] ? [{ url: product.images[0], width: 800, height: 800 }] : [],
      type: 'website',
      locale: 'fr_FR',
    },
  };
}

export default function ProductDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
