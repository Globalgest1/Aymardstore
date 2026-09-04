import React from 'react';
import LegalLayout from './LegalLayout';
import { useThemeMode } from '@/lib/useThemeMode';

export default function MentionsPage() {
  const isDarkMode = useThemeMode();

  const sectionStyle: React.CSSProperties = {
    marginBottom: '32px',
  };

  const h2Style: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 800,
    color: isDarkMode ? '#ffffff' : '#0f172a',
    margin: '0 0 14px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const pStyle: React.CSSProperties = {
    fontSize: '14.5px',
    lineHeight: 1.7,
    color: isDarkMode ? '#d4d4d8' : '#334155',
    margin: '0 0 14px 0',
  };

  const boxStyle: React.CSSProperties = {
    background: isDarkMode ? '#18181b' : '#f8fafc',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
    borderRadius: '16px',
    padding: '20px',
    margin: '16px 0',
  };

  return (
    <LegalLayout
      title="Mentions Légales & Propriété Intellectuelle (OAPI)"
      subtitle="Informations obligatoires prescrites par l'article 347 du Code du Numérique en République du Bénin et l'Accord de Bangui (Organisation Africaine de la Propriété Intellectuelle)."
      badge="Transparence Légale Bénin"
      updatedAt="Septembre 2026"
    >
      {/* Introduction légale */}
      <section style={sectionStyle}>
        <div style={boxStyle}>
          <div style={{ fontWeight: 800, fontSize: '15px', color: isDarkMode ? '#38bdf8' : '#0284c7', marginBottom: '8px' }}>
            🏛️ Identification Officielle de l&apos;Éditeur
          </div>
          <p style={{ ...pStyle, margin: 0 }}>
            Conformément aux dispositions de l&apos;<strong>article 347 de la Loi N° 2017-20 portant Code du Numérique en République du Bénin</strong>, la présente page met à la disposition du public, de nos clients et des autorités administratives et judiciaires l&apos;ensemble des informations d&apos;identification légale de la plateforme commerciale <strong>Aymard Store</strong>.
          </p>
        </div>
      </section>

      {/* 1. Éditeur de la Plateforme */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>1.</span>
          <span>Société Éditrice du Site</span>
        </h2>
        <ul style={{ ...pStyle, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong>Dénomination Commerciale :</strong> AYMARD STORE</li>
          <li><strong>Forme Juridique :</strong> Société à Responsabilité Limitée (SARL) de droit béninois</li>
          <li><strong>Siège Social :</strong> Cotonou, République du Bénin (Quartier Haie Vive / Centre d&apos;affaires)</li>
          <li><strong>Immatriculation RCCM :</strong> Registre du Commerce et du Crédit Mobilier de Cotonou (Bénin)</li>
          <li><strong>Identifiant Fiscal Unique (IFU) :</strong> Enregistré et en règle auprès de la Direction Générale des Impôts (DGI Bénin)</li>
          <li><strong>Téléphone / Conciergerie WhatsApp :</strong> +229 01 97 36 29 06</li>
          <li><strong>Courrier Électronique Direction :</strong> <code>judesinaberogui@gmail.com</code></li>
        </ul>
      </section>

      {/* 2. Direction de la Publication */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>2.</span>
          <span>Direction de la Publication &amp; Rédaction</span>
        </h2>
        <p style={pStyle}>
          La direction de la publication, de la ligne éditoriale et de la curation des collections de luxe est assurée par la <strong>Direction Générale d&apos;Aymard Store</strong>.
        </p>
        <p style={pStyle}>
          Pour toute question relative aux contenus publiés dans notre section éditoriale &quot;Le Journal&quot; ou sur nos fiches techniques de produits, vous pouvez contacter notre équipe éditoriale à l&apos;adresse : <code>judesinaberogui@gmail.com</code>.
        </p>
      </section>

      {/* 3. Hébergement & Infrastructure */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>3.</span>
          <span>Hébergement &amp; Sécurité de l&apos;Infrastructure</span>
        </h2>
        <p style={pStyle}>
          Le site web <strong>Aymard Store</strong> est hébergé sur une infrastructure cloud haute résilience disposant de protocoles de sécurité certifiés (chiffrement TLS 1.3, pare-feu applicatif anti-DDoS, sauvegardes redondantes) :
        </p>
        <div style={boxStyle}>
          <ul style={{ ...pStyle, paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>Infrastructure Serveurs :</strong> Déploiement sécurisé avec distribution CDN mondiale.</li>
            <li><strong>Chiffrement des Données :</strong> Certificat SSL 256 bits garantissant l&apos;inviolabilité des échanges entre votre terminal et notre serveur.</li>
            <li><strong>Sécurité des Mots de Passe &amp; Sessions :</strong> Algorithmes cryptographiques CSPRNG et hachage fort bcrypt conformément aux recommandations de l&apos;ANSSI et de l&apos;APDP.</li>
          </ul>
        </div>
      </section>

      {/* 4. Propriété Intellectuelle (OAPI) */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>4.</span>
          <span>Propriété Intellectuelle &amp; Protection OAPI</span>
        </h2>
        <p style={pStyle}>
          L&apos;ensemble des éléments constituant le site Aymard Store est protégé par les stipulations de l&apos;<strong>Accord de Bangui révisé portant création de l&apos;Organisation Africaine de la Propriété Intellectuelle (OAPI)</strong>, dont la République du Bénin est État membre fondateur :
        </p>
        <ul style={{ ...pStyle, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li><strong>Signes Distinctifs &amp; Marques :</strong> Le nom commercial <strong>AYMARD STORE</strong>, les logos, monogrammes et slogans associés sont la propriété exclusive de l&apos;éditeur. Toute reproduction, imitation ou utilisation non autorisée constitue un acte de contrefaçon sanctionné par les dispositions pénales applicables.</li>
          <li><strong>Droits d&apos;Auteur sur les Contenus :</strong> Les photographies, visuels 3D, descriptions de produits, articles du Journal et codes sources du site sont protégés par le droit d&apos;auteur. Toute extraction substantielle ou reproduction non autorisée fera l&apos;objet de poursuites immédiates.</li>
          <li><strong>Marques Tiers &amp; Marques de Sneakers :</strong> Les marques citées au sein du catalogue (telles que Nike, Jordan, Adidas, Yeezy, Balenciaga, etc.) appartiennent à leurs propriétaires respectifs et sont mentionnées uniquement à titre descriptif pour identifier les modèles authentiques distribués.</li>
        </ul>
      </section>

      {/* 5. Lutte contre la Contrefaçon & Traçabilité */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>5.</span>
          <span>Engagement Éthique de Lutte contre la Contrefaçon</span>
        </h2>
        <p style={pStyle}>
          La commercialisation de produits contrefaits est un délit grave prohibé par la loi béninoise et les traités internationaux. Aymard Store applique une politique de tolérance zéro absolue :
        </p>
        <div style={{ padding: '16px', borderRadius: '12px', background: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: isDarkMode ? '#34d399' : '#059669', fontSize: '13.5px', fontWeight: 600, lineHeight: 1.6 }}>
          ✓ 100% de notre inventaire fait l&apos;objet d&apos;un approvisionnement traçable auprès de distributeurs agréés et de collectionneurs certifiés. Chaque article est remis avec un engagement formel d&apos;authenticité.
        </div>
      </section>
    </LegalLayout>
  );
}
