import React from 'react';
import LegalLayout from './LegalLayout';
import { useThemeMode } from '@/lib/useThemeMode';

export default function EmploymentPage() {
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
      title="Politique d'Emploi, Recrutement Équitable & RSE"
      subtitle="Nos engagements solennels fondés sur le Code du Travail de la République du Bénin (Loi N° 98-004 & Loi N° 2017-05), la justice sociale, la dignité du travail et la valorisation des talents locaux."
      badge="Code du Travail Béninois & OIT"
      updatedAt="Septembre 2026"
    >
      {/* Introduction RSE & Justice Sociale */}
      <section style={sectionStyle}>
        <div style={boxStyle}>
          <div style={{ fontWeight: 800, fontSize: '15px', color: isDarkMode ? '#34d399' : '#059669', marginBottom: '8px' }}>
            🤝 Notre Charte Éthique &amp; Républicaine de l&apos;Emploi
          </div>
          <p style={{ ...pStyle, margin: 0 }}>
            Chez <strong>AYMARD STORE</strong>, l&apos;excellence commerciale et le luxe vestimentaire ne sauraient exister sans une éthique irréprochable dans nos relations de travail. Établie au cœur du Bénin, notre maison affirme son attachement indéfectible aux valeurs républicaines d&apos;équité, de mérite, de dignité humaine et de juste rémunération, conformément aux prescriptions de la <strong>Loi N° 98-004 du 27 janvier 1998 portant Code du Travail en République du Bénin</strong> et de la <strong>Loi N° 2017-05 fixant les conditions d&apos;embauche et du travail</strong>.
          </p>
        </div>
      </section>

      {/* Article 1 : Égalité des chances et non-discrimination */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>1.</span>
          <span>Égalité des Chances &amp; Non-Discrimination Absolue</span>
        </h2>
        <p style={pStyle}>
          Aymard Store applique une politique de recrutement rigoureusement objective et équitable. Conformément à l&apos;article 4 du Code du Travail béninois :
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', margin: '16px 0' }}>
          <div style={{ padding: '16px', borderRadius: '12px', background: isDarkMode ? '#1e1e24' : '#f1f5f9', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}` }}>
            <div style={{ fontWeight: 800, fontSize: '13.5px', color: isDarkMode ? '#38bdf8' : '#0284c7', marginBottom: '6px' }}>
              ✦ Recrutement au Mérite Exclusif
            </div>
            <div style={{ fontSize: '12.5px', color: isDarkMode ? '#a1a1aa' : '#64748b', lineHeight: 1.5 }}>
              Chaque candidature est examinée uniquement au regard des compétences techniques, de la passion pour l&apos;univers streetwear et du sens du service client.
            </div>
          </div>
          <div style={{ padding: '16px', borderRadius: '12px', background: isDarkMode ? '#1e1e24' : '#f1f5f9', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}` }}>
            <div style={{ fontWeight: 800, fontSize: '13.5px', color: isDarkMode ? '#38bdf8' : '#0284c7', marginBottom: '6px' }}>
              ✦ Zéro Tolérance pour la Discrimination
            </div>
            <div style={{ fontSize: '12.5px', color: isDarkMode ? '#a1a1aa' : '#64748b', lineHeight: 1.5 }}>
              Toute distinction fondée sur le genre, l&apos;ethnie, la confession religieuse, l&apos;origine sociale ou le handicap est formellement bannie et sanctionnée.
            </div>
          </div>
        </div>
      </section>

      {/* Article 2 : Juste rémunération, SMIG et CNSS */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>2.</span>
          <span>Rémunération Juste, Respect du SMIG &amp; Couverture Sociale (CNSS)</span>
        </h2>
        <p style={pStyle}>
          La dignité du travailleur passe par une rétribution équitable et protectrice :
        </p>
        <ul style={{ ...pStyle, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>
            <strong>Respect Intégral du SMIG Béninois :</strong> Aucun collaborateur employé à temps plein ne peut être rémunéré en deçà du Salaire Minimum Interprofessionnel Garanti (SMIG) en vigueur en République du Bénin (fixé à 52 000 FCFA net minimum par décret gouvernemental). Nos grilles internes prévoient en outre des salaires attractifs valorisant le savoir-faire.
          </li>
          <li>
            <strong>Déclaration &amp; Cotisations CNSS :</strong> Tous les salariés sous contrat d&apos;embauche sont déclarés à la <strong>Caisse Nationale de Sécurité Sociale (CNSS Bénin)</strong> dès leur prise de fonction, garantissant leurs droits à la retraite, aux allocations familiales et à la couverture des risques professionnels.
          </li>
          <li>
            <strong>Primes &amp; Gratifications au Mérite :</strong> Des primes de performance transparentes sont attribuées à notre personnel de vente, d&apos;authentification et de logistique.
          </li>
        </ul>
      </section>

      {/* Article 3 : Encadrement des Stages et Insertion des Jeunes */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>3.</span>
          <span>Insertion Professionnelle &amp; Encadrement Éthique des Stagiaires</span>
        </h2>
        <p style={pStyle}>
          Aymard Store constitue un tremplin professionnel pour la jeunesse béninoise, étudiante ou diplômée :
        </p>
        <div style={boxStyle}>
          <ul style={{ ...pStyle, paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>Indemnité de stage obligatoire :</strong> Tout stage conventionné (académique ou de perfectionnement) fait l&apos;objet d&apos;une gratification financière décente pour couvrir le transport et les frais quotidiens.</li>
            <li><strong>Interdiction des stages fictifs :</strong> Un stagiaire ne peut en aucun cas se substituer à un emploi permanent de l&apos;entreprise.</li>
            <li><strong>Mentorat actif :</strong> Chaque stagiaire est adossé à un tuteur qualifié chargé de lui transmettre les compétences clés du e-commerce moderne, de l&apos;authentification de sneakers et de la gestion de relation client omnichannel.</li>
          </ul>
        </div>
      </section>

      {/* Article 4 : Statut & Sécurité des Courtiers et Livreurs Partenaires */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>4.</span>
          <span>Dignité &amp; Sécurité des Livreurs et Partenaires Logistiques</span>
        </h2>
        <p style={pStyle}>
          Le dernier kilomètre de livraison à Cotonou, Calavi, Porto-Novo et en province est assuré par des livreurs partenaires respectés et valorisés :
        </p>
        <ul style={{ ...pStyle, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li><strong>Tarification kilométrique juste :</strong> Forfait de course respectueux du coût de carburant et de l&apos;effort physique fourni.</li>
          <li><strong>Exigences de sécurité routière :</strong> Port obligatoire du casque homologué et respect du code de la route béninois.</li>
          <li><strong>Relations humaines chaleureuses :</strong> Nos livreurs sont les ambassadeurs directs de notre maison auprès des clients et sont traités avec le plus grand respect par notre direction.</li>
        </ul>
      </section>

      {/* Article 5 : Interdiction Absolue du Travail des Enfants */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>5.</span>
          <span>Prohibition du Travail des Enfants &amp; Conventions OIT</span>
        </h2>
        <p style={pStyle}>
          En stricte conformité avec les conventions 138 et 182 de l&apos;Organisation Internationale du Travail (OIT) ratifiées par la République du Bénin :
        </p>
        <div style={{ padding: '14px 18px', borderRadius: '12px', background: isDarkMode ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: isDarkMode ? '#f87171' : '#b91c1c', fontSize: '13.5px', fontWeight: 600, lineHeight: 1.6 }}>
          ⚠️ Aymard Store interdit formellement et sans exception l&apos;emploi de mineurs en dessous de l&apos;âge légal de scolarité obligatoire ou d&apos;admission à l&apos;emploi au Bénin. Tous nos prestataires et fournisseurs partenaires doivent s&apos;engager par écrit à respecter cette clause d&apos;intégrité.
        </div>
      </section>

      {/* Article 6 : Comment Postuler ? */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>
          <span>6.</span>
          <span>Rejoindre l&apos;Équipe Aymard Store</span>
        </h2>
        <p style={pStyle}>
          Vous êtes passionné(e) par la mode streetwear, l&apos;authentification de sneakers d&apos;exception, le marketing digital ou la logistique urbaine ?
        </p>
        <div style={boxStyle}>
          <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '8px' }}>
            Postuler à nos offres ou déposer une candidature spontanée :
          </div>
          <p style={{ ...pStyle, margin: '0 0 12px 0' }}>
            Envoyez votre Curriculum Vitæ (CV) accompagné d&apos;un mot de motivation à notre cellule ressources humaines :<br />
            <strong>Email :</strong> <a href="mailto:judesinaberogui@gmail.com" style={{ color: '#38bdf8' }}>judesinaberogui@gmail.com</a> (Objet : <code>[CANDIDATURE] - Poste souhaité - Votre Nom</code>)<br />
            <strong>WhatsApp RH :</strong> <a href="https://wa.me/2290197362906" style={{ color: '#25d366' }}>+229 01 97 36 29 06</a>
          </p>
          <div style={{ fontSize: '12px', color: isDarkMode ? '#71717a' : '#94a3b8' }}>
            🔒 <em>Vos données de candidature sont conservées en toute confidentialité pour une durée maximale de 12 mois et ne seront jamais partagées avec des tiers.</em>
          </div>
        </div>
      </section>
    </LegalLayout>
  );
}
