import React from 'react';
import LegalLayout from './LegalLayout';
import { useThemeMode } from '@/lib/useThemeMode';

export default function TermsPage() {
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
      title="Conditions Générales de Vente & d'Utilisation"
      subtitle="Cadre contractuel régissant les transactions sur la plateforme Aymard Store, conformément au Livre IV du Code du Numérique en République du Bénin et au Droit Commercial Général OHADA."
      badge="Droit OHADA & Code Numérique Bénin"
      updatedAt="Septembre 2026"
    >
      {/* Préambule */}
      <section style={sectionStyle}>
        <div style={boxStyle}>
          <div style={{ fontWeight: 800, fontSize: '15px', color: isDarkMode ? '#facc15' : '#b45309', marginBottom: '8px' }}>
            📜 Préambule Contractuel
          </div>
          <p style={{ ...pStyle, margin: 0 }}>
            Les présentes Conditions Générales de Vente (CGV) et d&apos;Utilisation (CGU) déterminent les droits et obligations contractuels réciproques entre la société <strong>AYMARD STORE SARL</strong> (ci-après &quot;Aymard Store&quot; ou le &quot;Vendeur&quot;) et toute personne physique ou morale (ci-après le &quot;Client&quot;) réalisant un achat ou naviguant sur le site officiel. Elles sont soumises à la législation en vigueur en <strong>République du Bénin</strong> et aux dispositions de l&apos;<strong>Acte Uniforme portant Droit Commercial Général de l&apos;OHADA</strong>.
          </p>
        </div>
      </section>

      {/* Article 1 : Garantie d'Authenticité 100% */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>1.</span>
          <span>Garantie Inconditionnelle d&apos;Authenticité &amp; Traçabilité</span>
        </h2>
        <p style={pStyle}>
          Aymard Store est une enseigne haut de gamme engagée dans la lutte contre la contrefaçon :
        </p>
        <ul style={{ ...pStyle, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong>Certification Préalable :</strong> Chaque paire de sneakers et article de prêt-à-porter fait l&apos;objet d&apos;un protocole d&apos;inspection rigoureux par nos experts (coutures, matériaux, codes SKU, boîte d&apos;origine, étiquettes RFID).</li>
          <li><strong>Garantie &quot;Satisfait ou Remboursé&quot; sur l&apos;Authenticité :</strong> Si une pièce vendue s&apos;avérait non authentique, Aymard Store s&apos;engage au remboursement immédiat de 100% du prix payé ainsi qu&apos;à la prise en charge des frais de retour.</li>
        </ul>
      </section>

      {/* Article 2 : Formation du Contrat & Double Clic */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>2.</span>
          <span>Processus de Commande &amp; Formalisme du Double-Clic (Art. 351)</span>
        </h2>
        <p style={pStyle}>
          Conformément aux prescriptions de l&apos;article 351 du Code du Numérique de la République du Bénin :
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0' }}>
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: isDarkMode ? '#1e1e24' : '#f8fafc', borderLeft: '4px solid #38bdf8' }}>
            <strong>1. Étape 1 — Sélection &amp; Récapitulatif :</strong> Le Client sélectionne ses articles, pointures et renseigne ses coordonnées de livraison. Un écran de synthèse détaillé lui permet de vérifier la conformité de sa sélection.
          </div>
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: isDarkMode ? '#1e1e24' : '#f8fafc', borderLeft: '4px solid #10b981' }}>
            <strong>2. Étape 2 — Confirmation Ferme (Double-Clic) :</strong> Le contrat de vente est valablement formé lorsque le Client clique sur le bouton de validation finale après avoir pris connaissance des présentes conditions.
          </div>
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: isDarkMode ? '#1e1e24' : '#f8fafc', borderLeft: '4px solid #f59e0b' }}>
            <strong>3. Étape 3 — Accusé de Réception Automatisé :</strong> Le serveur d&apos;Aymard Store émet immédiatement une confirmation écrite de commande expédiée par Email et/ou WhatsApp comportant le numéro d&apos;ordre unique.
          </div>
        </div>
      </section>

      {/* Article 3 : Prix & Modalités de Règlement */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>3.</span>
          <span>Prix, Monnaie Légale &amp; Sécurité des Paiements</span>
        </h2>
        <p style={pStyle}>
          Les dispositions monétaires applicables sont les suivantes :
        </p>
        <ul style={{ ...pStyle, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li><strong>Monnaie de référence :</strong> Les prix sont libellés en <strong>Francs CFA (XOF)</strong>, monnaie ayant cours légal dans l&apos;UEMOA, avec indication facultative de l&apos;équivalent en <strong>Euros (€)</strong> au taux officiel fixe de 1 € = 655,957 FCFA.</li>
          <li><strong>Canaux de paiement acceptés :</strong>
            <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
              <li>Mobile Money Bénin &amp; UEMOA : <strong>MTN MoMo</strong>, <strong>Moov Money</strong>, <strong>Celtiis Cash</strong>, <strong>Wave</strong>.</li>
              <li>Cartes bancaires internationales : <strong>VISA</strong>, <strong>Mastercard</strong>.</li>
              <li>Paiement comptant à la livraison : Disponible sur le Grand Cotonou sous réserve d&apos;une confirmation téléphonique préalable.</li>
            </ul>
          </li>
          <li><strong>Sécurité financière :</strong> Tous les flux électroniques sont routés via des passerelles bancaires cryptées conformes aux normes PCI-DSS.</li>
        </ul>
      </section>

      {/* Article 4 : Délais de Livraison */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>4.</span>
          <span>Modalités d&apos;Expédition &amp; Délais de Livraison</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', margin: '14px 0' }}>
          <div style={{ padding: '16px', borderRadius: '12px', background: isDarkMode ? '#1e1e24' : '#f1f5f9' }}>
            <div style={{ fontWeight: 800, fontSize: '13.5px', color: isDarkMode ? '#38bdf8' : '#0284c7', marginBottom: '4px' }}>
              🛵 Cotonou &amp; Périphérie (Calavi / Akpakpa)
            </div>
            <div style={{ fontSize: '12.5px', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>
              Livraison express en <strong>24h à 48h</strong> par coursier dédié. Remise en main propre avec contrôle du colis.
            </div>
          </div>
          <div style={{ padding: '16px', borderRadius: '12px', background: isDarkMode ? '#1e1e24' : '#f1f5f9' }}>
            <div style={{ fontWeight: 800, fontSize: '13.5px', color: isDarkMode ? '#38bdf8' : '#0284c7', marginBottom: '4px' }}>
              📦 Départements du Bénin (Porto-Novo, Parakou...)
            </div>
            <div style={{ fontSize: '12.5px', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>
              Expédition sous <strong>48h à 72h</strong> via les réseaux de transport et points relais sécurisés.
            </div>
          </div>
          <div style={{ padding: '16px', borderRadius: '12px', background: isDarkMode ? '#1e1e24' : '#f1f5f9' }}>
            <div style={{ fontWeight: 800, fontSize: '13.5px', color: isDarkMode ? '#38bdf8' : '#0284c7', marginBottom: '4px' }}>
              ✈️ International &amp; Sous-Région UEMOA
            </div>
            <div style={{ fontSize: '12.5px', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>
              Acheminement sous <strong>3 à 5 jours ouvrés</strong> avec suivi de bout en bout (DHL / Colissimo / Chronopost).
            </div>
          </div>
        </div>
      </section>

      {/* Article 5 : Droit de Rétractation & Échanges */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>5.</span>
          <span>Droit de Rétractation, Retours &amp; Échanges</span>
        </h2>
        <p style={pStyle}>
          Le Client dispose d&apos;un délai légal de <strong>7 jours francs</strong> à compter de la réception de sa commande pour solliciter un échange de pointure ou un retour :
        </p>
        <div style={boxStyle}>
          <ul style={{ ...pStyle, paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>État du produit retourné :</strong> La pièce doit être rigoureusement neuve, jamais portée en extérieur, exempte de salissures, et restituée dans sa boîte d&apos;origine avec l&apos;intégralité de ses accessoires et scellés d&apos;authenticité intacts.</li>
            <li><strong>Procédure de retour :</strong> Contacter notre conciergerie WhatsApp (<a href="https://wa.me/2290197362906" style={{ color: '#25d366' }}>+229 01 97 36 29 06</a>) avec le numéro de commande et des photos de l&apos;article.</li>
            <li><strong>Modalités de remboursement :</strong> Après vérification et validation par nos experts, le remboursement est exécuté par le même moyen de paiement (Mobile Money ou virement) sous 48 heures ouvrées.</li>
          </ul>
        </div>
      </section>

      {/* Article 6 : Loi Applicable & Tribunal Compétent */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>6.</span>
          <span>Règlement des Litiges &amp; Compétence Juridictionnelle</span>
        </h2>
        <p style={pStyle}>
          Les présentes CGV sont soumises au <strong>Droit positif de la République du Bénin</strong> :
        </p>
        <p style={pStyle}>
          En cas de contestation ou de litige né de la validité, de l&apos;interprétation ou de l&apos;exécution d&apos;une commande, les parties s&apos;engagent expressément à rechercher préalablement un <strong>règlement amiable</strong> auprès de la Direction Générale d&apos;Aymard Store.
        </p>
        <p style={pStyle}>
          À défaut d&apos;accord amiable dans un délai de trente (30) jours calendaires, compétence exclusive est attribuée au <strong>Tribunal de Première Instance de Cotonou statuant en matière commerciale</strong> (République du Bénin), nonobstant pluralité de défendeurs ou appel en garantie.
        </p>
      </section>
    </LegalLayout>
  );
}
