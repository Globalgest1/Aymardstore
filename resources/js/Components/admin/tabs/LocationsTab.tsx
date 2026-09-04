'use client';

import React, { useState } from 'react';
import Link from '@/lib/compat-link';
import { useAppStore } from '@/lib/store';
import { Product } from '@/lib/products-data';
import { ModalType, cleanExistingSizes, getCategoryLabel } from '../types';
import { EmptyState } from '../ui';

interface LocationsTabProps {
  openAddProductModal: () => void;
  openBatchModal: () => void;
  setEditingProduct: (p: Product | null) => void;
  setSelectedSizes: (sizes: string[]) => void;
  setSelectedColors: (colors: any[]) => void;
  onOpenModal: (type: ModalType) => void;
  showToast: (msg: string) => void;
}

export const LocationsTab: React.FC<LocationsTabProps> = ({
  openAddProductModal,
  openBatchModal,
  setEditingProduct,
  setSelectedSizes,
  setSelectedColors,
  onOpenModal,
  showToast,
}) => {
  const { 
    products, 
    locations, 
    detectedLocationId, 
    dynamicCategories, 
    setDetectedLocation, 
    updateLocation, 
    updateLocationPrice 
  } = useAppStore();

  const [locationSearch, setLocationSearch] = useState('');
  const [locationPage, setLocationPage] = useState(1);
  const [tempRates, setTempRates] = useState<Record<string, number>>({});
  const [tempPrices, setTempPrices] = useState<Record<string, Record<string, number>>>({});

  const filteredLocationProducts = products.filter(p => 
    p.name_fr.toLowerCase().includes(locationSearch.toLowerCase()) || 
    (p.brand || '').toLowerCase().includes(locationSearch.toLowerCase())
  );
  const totalLocationPages = Math.ceil(filteredLocationProducts.length / 15) || 1;
  const paginatedLocationProducts = filteredLocationProducts.slice((locationPage - 1) * 15, locationPage * 15);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Card */}
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0284c7' }}>
              GÉOLOCALISATION & DEVISES
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              Gestion des Prix par Pays & Devises
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
              Détection automatique du lieu de connexion des visiteurs (IP & fuseau horaire) : <strong>Bénin 🇧🇯 (Afrique - FCFA)</strong>, <strong>France 🇫🇷 (Europe - €)</strong> et <strong>Belgique 🇧🇪 (Europe - €)</strong>.
            </p>
          </div>
          <Link 
            href="/products" 
            target="_blank" 
            className="admin-btn admin-btn-primary" 
            style={{ borderRadius: '30px', padding: '12px 24px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span>👀 Voir la boutique en direct</span>
          </Link>
        </div>
      </div>

      {/* Live Client Geolocation Simulator */}
      <div className="admin-card" style={{ padding: '24px 30px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🧪</span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                Simulateur de Connexion Client (Test en direct)
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
              Cliquez sur un pays pour tester les prix, devises et règles de livraison comme si vous étiez connecté depuis ce lieu :
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {locations.map(loc => {
              const isSelected = detectedLocationId === loc.id;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    setDetectedLocation(loc.id);
                    showToast(`Simulation activée : Vue client ${loc.name} (${loc.currency})`);
                  }}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '16px',
                    border: isSelected ? '2px solid #0284c7' : '1px solid var(--adm-card-border)',
                    background: isSelected ? '#0284c7' : 'var(--adm-card-bg)',
                    color: isSelected ? '#ffffff' : 'var(--adm-text-h)',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none',
                    transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{loc.flag}</span>
                  <span>{loc.name}</span>
                  <span style={{ fontSize: '11px', opacity: isSelected ? 0.9 : 0.6 }}>({loc.currency})</span>
                  {isSelected && <span style={{ fontWeight: 900 }}>✓ Actif</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Location & Rates Configuration Table */}
      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 16 }}>
          ⚙️ Pays Pris en Charge & Taux de Conversion
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Pays / Territoire</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Code</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Devise</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Taux de change (pour 1 €)</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Statut</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map(loc => {
                const currentRateVal = tempRates[loc.id] !== undefined ? tempRates[loc.id] : loc.exchangeRate;

                return (
                  <tr key={loc.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                    <td style={{ padding: '16px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '22px' }}>{loc.flag}</span>
                        <div>
                          <div>{loc.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', fontWeight: 500 }}>
                            {loc.id === 'benin' ? 'Afrique de l\'Ouest' : 'Union Européenne'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: 'var(--adm-text-m)' }}>
                      <span style={{ background: 'var(--adm-card-border)', padding: '3px 8px', borderRadius: '6px' }}>{loc.countryCode}</span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', fontWeight: 800, color: '#0284c7' }}>
                      {loc.currency} ({loc.currencySymbol})
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          step={loc.currency === 'FCFA' ? '0.001' : '0.01'}
                          value={currentRateVal}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            setTempRates(prev => ({ ...prev, [loc.id]: isNaN(val) ? 0 : val }));
                          }}
                          className="admin-input"
                          style={{ width: '130px', padding: '6px 10px', fontSize: '12px', borderRadius: '8px' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (currentRateVal > 0) {
                              updateLocation(loc.id, { exchangeRate: currentRateVal });
                              showToast(`Taux de change mis à jour pour ${loc.name} (${currentRateVal} ${loc.currency})`);
                            }
                          }}
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          style={{ borderRadius: '8px', fontSize: '11px', fontWeight: 700, padding: '6px 10px' }}
                        >
                          💾 Enregistrer
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: loc.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: loc.active ? '#10b981' : '#ef4444'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                        {loc.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => {
                          updateLocation(loc.id, { active: !loc.active });
                          showToast(`Statut de ${loc.name} mis à jour (${loc.active ? 'Désactivé' : 'Activé'})`);
                        }}
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        style={{ borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}
                      >
                        {loc.active ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matrix of Catalog Products per Country */}
      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
              📊 Tarifs Produits par Pays ({filteredLocationProducts.length} articles)
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
              Modifiez directement les prix pour chaque pays ou ouvrez l&apos;éditeur complet.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Rechercher un produit..."
              value={locationSearch}
              onChange={e => {
                setLocationSearch(e.target.value);
                setLocationPage(1);
              }}
              className="admin-input"
              style={{ width: '220px', borderRadius: '12px', padding: '8px 14px', fontSize: '12px' }}
            />
            <button
              type="button"
              className="admin-btn admin-btn-sm"
              onClick={openBatchModal}
              style={{
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                color: '#ffffff',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)',
                cursor: 'pointer'
              }}
            >
              <span>⚡</span>
              <span>Import Multi-Produits IA</span>
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-sm"
              onClick={openAddProductModal}
              style={{
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#ffffff',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                cursor: 'pointer'
              }}
            >
              <span>✨</span>
              <span>Scan Photo IA</span>
            </button>
            <button 
              type="button"
              className="admin-btn admin-btn-primary admin-btn-sm" 
              onClick={openAddProductModal} 
              style={{ borderRadius: '20px', padding: '8px 18px', fontSize: '12px', fontWeight: 700 }}
            >
              + Nouveau Produit
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Produit</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Base (€)</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>🇧🇯 Bénin (FCFA)</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>🇫🇷 France (€)</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>🇧🇪 Belgique (€)</th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLocationProducts.map(p => {
                const pPrices = tempPrices[p.id] || {};
                const beninVal = pPrices.benin !== undefined ? pPrices.benin : (p.locationPrices?.benin || Math.round(p.price * 655.957));
                const franceVal = pPrices.france !== undefined ? pPrices.france : (p.locationPrices?.france || p.price);
                const belgiqueVal = pPrices.belgique !== undefined ? pPrices.belgique : (p.locationPrices?.belgique || p.price);

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                    <td style={{ padding: '14px', fontWeight: 700, color: 'var(--adm-text-h)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img 
                          src={p.images[0]} 
                          alt={p.name_fr} 
                          style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'contain', background: '#f8fafc' }} 
                        />
                        <div>
                          <div style={{ fontSize: '13px' }}>{p.name_fr.slice(0, 32)}</div>
                          <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                            {p.brand || 'AYMARD'} • {getCategoryLabel(p.category, dynamicCategories)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                      {p.price.toFixed(2)} €
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="100"
                          value={beninVal}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            setTempPrices(prev => ({
                              ...prev,
                              [p.id]: { ...(prev[p.id] || {}), benin: isNaN(val) ? 0 : val }
                            }));
                          }}
                          className="admin-input"
                          style={{ width: '100px', padding: '5px 8px', fontSize: '12px', borderRadius: '6px' }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>FCFA</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={franceVal}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            setTempPrices(prev => ({
                              ...prev,
                              [p.id]: { ...(prev[p.id] || {}), france: isNaN(val) ? 0 : val }
                            }));
                          }}
                          className="admin-input"
                          style={{ width: '85px', padding: '5px 8px', fontSize: '12px', borderRadius: '6px' }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>€</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={belgiqueVal}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            setTempPrices(prev => ({
                              ...prev,
                              [p.id]: { ...(prev[p.id] || {}), belgique: isNaN(val) ? 0 : val }
                            }));
                          }}
                          className="admin-input"
                          style={{ width: '85px', padding: '5px 8px', fontSize: '12px', borderRadius: '6px' }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>€</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const currentBenin = pPrices.benin !== undefined ? pPrices.benin : beninVal;
                            const currentFrance = pPrices.france !== undefined ? pPrices.france : franceVal;
                            const currentBelgique = pPrices.belgique !== undefined ? pPrices.belgique : belgiqueVal;

                            updateLocationPrice(p.id, 'benin', currentBenin);
                            updateLocationPrice(p.id, 'france', currentFrance);
                            updateLocationPrice(p.id, 'belgique', currentBelgique);

                            showToast(`Prix enregistrés pour ${p.name_fr.slice(0, 20)} !`);
                          }}
                          className="admin-btn admin-btn-primary admin-btn-sm"
                          style={{ borderRadius: '8px', fontSize: '11px', fontWeight: 700, padding: '5px 10px' }}
                          title="Sauvegarder les prix saisis"
                        >
                          💾 Sauvegarder
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(p);
                            setSelectedSizes(cleanExistingSizes(p.sizes));
                            setSelectedColors(p.colors || []);
                            onOpenModal('editProduct');
                          }}
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          style={{ borderRadius: '8px', padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Modifier tous les détails"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredLocationProducts.length === 0 && <EmptyState icon="🌍" text="Aucun produit trouvé pour cette recherche" />}
        </div>

        {/* Pagination Controls */}
        {filteredLocationProducts.length > 15 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--adm-card-border)', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
              Articles {(locationPage - 1) * 15 + 1} à {Math.min(locationPage * 15, filteredLocationProducts.length)} sur {filteredLocationProducts.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button 
                type="button"
                onClick={() => setLocationPage(p => Math.max(1, p - 1))}
                disabled={locationPage === 1}
                className="admin-btn admin-btn-outline admin-btn-sm"
                style={{ borderRadius: 8, opacity: locationPage === 1 ? 0.4 : 1 }}
              >
                ◀ Précédent
              </button>
              <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-h)', background: 'rgba(56,189,248,0.1)', borderRadius: 8 }}>
                {locationPage} / {totalLocationPages}
              </span>
              <button 
                type="button"
                onClick={() => setLocationPage(p => Math.min(totalLocationPages, p + 1))}
                disabled={locationPage >= totalLocationPages}
                className="admin-btn admin-btn-outline admin-btn-sm"
                style={{ borderRadius: 8, opacity: locationPage >= totalLocationPages ? 0.4 : 1 }}
              >
                Suivant ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
