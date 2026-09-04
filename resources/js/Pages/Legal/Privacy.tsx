import React from 'react';
import LegalLayout from './LegalLayout';
import { useThemeMode } from '@/lib/useThemeMode';

export default function PrivacyPage() {
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
      title="Politique de Confidentialité & Protection des Données"
      subtitle="Engagement solennel de conformité avec la Loi N° 2017-20 portant Code du Numérique en République du Bénin et les directives de l'Autorité de Protection des Données Personnelles (APDP)."
      badge="Loi Béninoise N° 2017-20 / APDP"
      updatedAt="Septembre 2026"
    >
      {/* Introduction solennelle */}
      <section style={sectionStyle}>
        <div style={boxStyle}>
          <div style={{ fontWeight: 800, fontSize: '15px', color: isDarkMode ? '#38bdf8' : '#0284c7', marginBottom: '8px' }}>
            🏛️ Déclaration Fondamentale de Conformité APDP
          </div>
          <p style={{ ...pStyle, margin: 0 }}>
            La société <strong>AYMARD STORE</strong> (sise à Cotonou, République du Bénin) accorde une importance primordiale à la protection de la vie privée et des données personnelles de ses clients, utilisateurs et visiteurs. La présente politique détaille les engagements de notre plateforme conformément aux dispositions du <strong>Livre V (Protection des données à caractère personnel) du Code du Numérique en République du Bénin (Loi N° 2017-20 du 20 avril 2017 modifiée)</strong>, sous l&apos;égide de l&apos;<strong>Autorité de Protection des Données Personnelles (APDP)</strong>.
          </p>
        </div>
      </section>

      {/* Article 1 : Responsable de Traitement */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>1.</span>
          <span>Identité du Responsable de Traitement</span>
        </h2>
        <p style={pStyle}>
          Le responsable du traitement des données collectées sur le site officiel <strong>Aymard Store</strong> est :
        </p>
        <ul style={{ ...pStyle, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li><strong>Entité légale :</strong> AYMARD STORE SARL</li>
          <li><strong>Siège social :</strong> Cotonou, Département du Littoral, République du Bénin</li>
          <li><strong>Numéro IFU :</strong> Déclaré et immatriculé auprès de la DGI Bénin</li>
          <li><strong>Registre de Commerce (RCCM) :</strong> Cotonou, Bénin</li>
          <li><strong>Contact officiel DPO :</strong> <code>judesinaberogui@gmail.com</code> | Tél / WhatsApp : <code>+229 01 97 36 29 06</code></li>
        </ul>
      </section>

      {/* Article 2 : Principes directeurs de la Loi Béninoise */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>2.</span>
          <span>Principes Directeurs du Traitement (Art. 384 du Code du Numérique)</span>
        </h2>
        <p style={pStyle}>
          Tout traitement de données personnelles opéré par Aymard Store repose sur le respect scrupuleux des 7 piliers légaux définis par le législateur béninois :
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', margin: '18px 0' }}>
          {[
            { title: 'Licéité & Loyauté', desc: 'Traitement fondé sur le consentement explicite ou l\'exécution du contrat de vente.' },
            { title: 'Finalité Déterminée', desc: 'Données collectées exclusivement pour honorer vos commandes et assurer le service après-vente.' },
            { title: 'Proportionnalité', desc: 'Seules les informations strictement indispensables sont requises (Minimisation).' },
            { title: 'Exactitude', desc: 'Mesures actives pour maintenir vos adresses et numéros de livraison à jour.' },
            { title: 'Conservation Limitée', desc: 'Suppression ou anonymisation des données dès extinction du délai légal.' },
            { title: 'Sécurité & Confidentialité', desc: 'Chiffrement de pointe SSL/TLS, mots de passe salés (bcrypt) et protections anti-brute-force.' },
          ].map((item, idx) => (
            <div key={idx} style={{ padding: '14px', borderRadius: '12px', background: isDarkMode ? '#1e1e24' : '#f1f5f9', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}` }}>
              <div style={{ fontWeight: 800, fontSize: '13.5px', marginBottom: '4px', color: isDarkMode ? '#facc15' : '#b45309' }}>
                ✓ {item.title}
              </div>
              <div style={{ fontSize: '12.5px', color: isDarkMode ? '#a1a1aa' : '#64748b', lineHeight: 1.5 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Article 3 : Catégories de données collectées */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>3.</span>
          <span>Catégories de Données Collectées</span>
        </h2>
        <p style={pStyle}>
          Dans le cadre de l&apos;exploitation de la boutique en ligne, nous sommes amenés à collecter :
        </p>
        <ul style={{ ...pStyle, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong>Données d&apos;identification et de contact :</strong> Nom, prénom, adresse électronique, numéro de téléphone mobile (indispensable pour la coordination des livraisons via WhatsApp et appel direct).</li>
          <li><strong>Données de livraison physique :</strong> Ville, quartier, indications topographiques précises (zones Grand Cotonou, Calavi, Porto-Novo, Parakou et envois internationaux).</li>
          <li><strong>Données de commande :</strong> Référence de panier, historique d&apos;achats, pointures et tailles sélectionnées, certificats d&apos;authenticité associés.</li>
          <li><strong>Données financières &amp; transactions :</strong> Les règlements par Mobile Money (MTN MoMo, Moov Money, Celtiis Cash, Wave) ou Cartes bancaires sont traités de bout en bout par des établissements agréés (LeekPay, SasPay). <em>Aucun numéro de carte bancaire ni code secret n&apos;est jamais stocké sur nos serveurs.</em></li>
        </ul>
      </section>

      {/* Article 4 : Droits des Citoyens et Résidents (Art. 427 à 435) */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>4.</span>
          <span>Vos Droits Reconnus par la République du Bénin</span>
        </h2>
        <p style={pStyle}>
          Le Code du Numérique béninois vous confère des prérogatives inaliénables sur vos données personnelles :
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '14px 0' }}>
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: isDarkMode ? '#1e1e24' : '#f8fafc', borderLeft: '4px solid #38bdf8' }}>
            <strong>Droit d&apos;accès et de communication (Art. 428) :</strong> Vous pouvez obtenir la confirmation que des données vous concernant sont traitées et en exiger une copie complète et gratuite.
          </div>
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: isDarkMode ? '#1e1e24' : '#f8fafc', borderLeft: '4px solid #10b981' }}>
            <strong>Droit de rectification et de mise à jour (Art. 429) :</strong> Vous pouvez à tout moment corriger vos informations directement depuis votre Espace Client VIP ou sur simple demande.
          </div>
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: isDarkMode ? '#1e1e24' : '#f8fafc', borderLeft: '4px solid #f59e0b' }}>
            <strong>Droit d&apos;opposition (Art. 430) :</strong> Vous pouvez vous opposer, sans frais et sans motif, à ce que vos coordonnées soient utilisées à des fins de prospection commerciale (alertes nouveaux drops WhatsApp / Email).
          </div>
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: isDarkMode ? '#1e1e24' : '#f8fafc', borderLeft: '4px solid #ef4444' }}>
            <strong>Droit à l&apos;effacement (&quot;Droit à l&apos;oubli&quot; - Art. 431) :</strong> Vous pouvez solliciter la suppression définitive de votre compte et de vos données, sous réserve des délais légaux de conservation fiscale et comptable imposés par l&apos;OHADA.
          </div>
        </div>
      </section>

      {/* Article 5 : Autorité de Recours (APDP) */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>5.</span>
          <span>Exercice des Droits &amp; Voie de Recours APDP</span>
        </h2>
        <p style={pStyle}>
          Pour toute demande relative à vos données personnelles, vous pouvez saisir notre Délégué à la Protection des Données :
        </p>
        <div style={boxStyle}>
          <p style={{ ...pStyle, margin: '0 0 8px 0' }}>
            <strong>Direction Juridique &amp; DPO Aymard Store :</strong><br />
            Email : <a href="mailto:judesinaberogui@gmail.com" style={{ color: '#38bdf8' }}>judesinaberogui@gmail.com</a><br />
            Courrier : AYMARD STORE — Cellule Protection des Données, Cotonou, Bénin.
          </p>
          <p style={{ ...pStyle, margin: 0, fontSize: '13px', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>
            Si après nous avoir contactés, vous estimez que vos droits ne sont pas respectés, vous avez le droit légal d&apos;introduire une réclamation auprès de l&apos;<strong>Autorité de Protection des Données Personnelles (APDP Bénin)</strong> — Rue 2050, Immeuble APDP, Cotonou (Site web : <code>apdp.bj</code>).
          </p>
        </div>
      </section>

      {/* Article 6 : Cookies et Traceurs */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>6.</span>
          <span>Gestion des Cookies et Témoins de Connexion</span>
        </h2>
        <p style={pStyle}>
          Aymard Store utilise uniquement des témoins techniques nécessaires au fonctionnement du service :
        </p>
        <ul style={{ ...pStyle, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li><strong>Cookies de session :</strong> Maintien de votre panier d&apos;achats et session authentifiée sécurisée.</li>
          <li><strong>Préférences d&apos;affichage :</strong> Mémorisation de votre choix de thème (Mode Sombre / Mode Clair).</li>
          <li><strong>Non-revente de données :</strong> Aymard Store s&apos;interdit formellement et solennellement toute revente, location ou cession de vos données à des régies publicitaires tierces.</li>
        </ul>
      </section>
    </LegalLayout>
  );
}
