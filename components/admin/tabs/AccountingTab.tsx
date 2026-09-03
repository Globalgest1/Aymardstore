'use client';

import React, { useState } from 'react';
import { useAppStore, Expense, ExpenseCategory } from '@/lib/store';
import { Tab, ModalType } from '../types';
import { ConfirmDialogOptions } from '../AdminConfirmDialog';
import { EmptyState } from '../ui';

interface AccountingTabProps {
  onOpenModal: (type: ModalType) => void;
  setEditingExpense: (exp: Expense | null) => void;
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
  setTab: (tab: Tab) => void;
  showToast: (msg: string) => void;
}

export const AccountingTab: React.FC<AccountingTabProps> = ({
  onOpenModal,
  setEditingExpense,
  showConfirmDialog,
  setTab,
  showToast,
}) => {
  const { expenses, orders, exchangeRate, clearAccountingData, deleteExpense } = useAppStore();

  const [accountingPeriod, setAccountingPeriod] = useState<'all' | 'today' | '7days' | 'month' | 'quarter' | 'year'>('all');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');

  const rawExpenses = expenses || [];
  const rawOrders = orders || [];

  const now = new Date();
  const isWithinPeriod = (dateStr?: string) => {
    if (accountingPeriod === 'all') return true;
    if (!dateStr) return true;
    let d: Date;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      } else {
        d = new Date(dateStr);
      }
    } else {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return true;
    if (accountingPeriod === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (accountingPeriod === '7days') {
      const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
      return diff >= 0 && diff <= 7;
    }
    if (accountingPeriod === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (accountingPeriod === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const itemQuarter = Math.floor(d.getMonth() / 3);
      return currentQuarter === itemQuarter && d.getFullYear() === now.getFullYear();
    }
    if (accountingPeriod === 'year') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const filteredOrders = rawOrders.filter(o => isWithinPeriod(o.date));
  
  const totalTurnoverEur = filteredOrders.reduce((sum, o) => {
    const orderTotal = typeof o.total === 'number' ? o.total : 0;
    if (o.currency === 'FCFA' || orderTotal > 5000) {
      return sum + (orderTotal / (exchangeRate || 655.957));
    }
    return sum + orderTotal;
  }, 0);

  const totalTurnoverFcfa = Math.round(totalTurnoverEur * (exchangeRate || 655.957));

  const periodExpenses = rawExpenses.filter(e => isWithinPeriod(e.date));
  const filteredExpenses = periodExpenses.filter(e => {
    const matchCat = expenseCategoryFilter === 'ALL' || e.category === expenseCategoryFilter;
    const q = expenseSearch.toLowerCase().trim();
    const matchQuery = !q || e.title.toLowerCase().includes(q) || (e.notes && e.notes.toLowerCase().includes(q)) || (e.receiptNumber && e.receiptNumber.toLowerCase().includes(q));
    return matchCat && matchQuery;
  });

  const totalExpensesEur = periodExpenses.reduce((sum, e) => {
    const rawAmt = typeof e.amount === 'number' ? e.amount : 0;
    if (e.currency === 'FCFA' || (e.amountFcfa && !e.amount)) {
      return sum + ((e.amountFcfa || rawAmt) / (exchangeRate || 655.957));
    }
    return sum + rawAmt;
  }, 0);
  const totalExpensesFcfa = Math.round(totalExpensesEur * (exchangeRate || 655.957));

  const netProfitEur = totalTurnoverEur - totalExpensesEur;
  const netProfitFcfa = totalTurnoverFcfa - totalExpensesFcfa;
  const marginPercent = totalTurnoverEur > 0 ? Math.round((netProfitEur / totalTurnoverEur) * 100) : 0;
  const isProfitable = netProfitEur >= 0;

  const categoryBreakdown: { key: ExpenseCategory; label: string; icon: string; color: string; totalEur: number; count: number }[] = [
    { key: 'STOCK', label: 'Achats Stocks & Marchandises', icon: '📦', color: '#0284c7', totalEur: 0, count: 0 },
    { key: 'LOGISTICS', label: 'Logistique, Fret & Douanes', icon: '🚚', color: '#10b981', totalEur: 0, count: 0 },
    { key: 'MARKETING', label: 'Marketing, Pubs & Influenceurs', icon: '📢', color: '#f59e0b', totalEur: 0, count: 0 },
    { key: 'SALARIES', label: 'Salaires & Commissions Livreur', icon: '💼', color: '#8b5cf6', totalEur: 0, count: 0 },
    { key: 'RENT', label: 'Loyer, Bureaux & Charges Fixes', icon: '🏢', color: '#ec4899', totalEur: 0, count: 0 },
    { key: 'SOFTWARE', label: 'Outils, Hébergement & Cloud', icon: '🛠️', color: '#06b6d4', totalEur: 0, count: 0 },
    { key: 'FEES', label: 'Frais bancaires & Passerelles', icon: '💳', color: '#f97316', totalEur: 0, count: 0 },
    { key: 'OTHER', label: 'Divers & Imprévus', icon: '🏷️', color: '#64748b', totalEur: 0, count: 0 },
  ];

  periodExpenses.forEach(e => {
    const cat = categoryBreakdown.find(c => c.key === e.category);
    if (cat) {
      cat.totalEur += (e.amount || 0);
      cat.count += 1;
    }
  });

  const categoryLabels: Record<ExpenseCategory, { label: string; icon: string; bg: string; color: string }> = {
    STOCK: { label: 'Achats Stocks', icon: '📦', bg: 'rgba(2,132,199,0.12)', color: '#0284c7' },
    LOGISTICS: { label: 'Logistique & Fret', icon: '🚚', bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    MARKETING: { label: 'Marketing & Pubs', icon: '📢', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    SALARIES: { label: 'Salaires & Commissions', icon: '💼', bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
    RENT: { label: 'Loyer & Charges Fixes', icon: '🏢', bg: 'rgba(236,72,153,0.12)', color: '#ec4899' },
    SOFTWARE: { label: 'Logiciels & Cloud', icon: '🛠️', bg: 'rgba(6,182,212,0.12)', color: '#06b6d4' },
    FEES: { label: 'Frais & Passerelles', icon: '💳', bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
    OTHER: { label: 'Divers & Imprévus', icon: '🏷️', bg: 'rgba(100,116,139,0.12)', color: '#64748b' }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Reference', 'Libelle', 'Categorie', 'Mode_Paiement', 'Statut', 'Montant_EUR', 'Montant_FCFA', 'Notes'];
    const rows = filteredExpenses.map(e => [
      e.date,
      e.receiptNumber || `EXP-${e.id.slice(-4)}`,
      `"${e.title.replace(/"/g, '""')}"`,
      e.category,
      e.paymentMethod,
      e.status,
      e.amount,
      e.amountFcfa || Math.round(e.amount * (exchangeRate || 655.957)),
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `grand-livre-comptable-aymard-store-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export du Grand Livre comptable téléchargé !');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Quick Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button 
          type="button"
          onClick={() => setTab('dashboard')} 
          className="admin-btn admin-btn-outline admin-btn-sm" 
          style={{ 
            borderRadius: '20px', 
            padding: '7px 16px', 
            fontSize: '12.5px', 
            fontWeight: 700, 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6,
            background: 'var(--adm-card-bg)',
            border: '1px solid var(--adm-card-border)',
            cursor: 'pointer'
          }}
        >
          <span>←</span> Retour au Tableau de bord
        </button>
      </div>

      {/* Top Header Card */}
      <div 
        className="admin-card" 
        style={{ 
          padding: '24px 28px', 
          borderRadius: '20px', 
          background: 'var(--adm-card-bg)', 
          border: '1px solid var(--adm-card-border)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ minWidth: 0, flex: '1 1 300px' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#10b981' }}>
                GESTION FINANCIÈRE &amp; RENTABILITÉ
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                Exercice 2026
              </span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              Comptabilité &amp; Bilan Financier
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--adm-text-m)', margin: 0, maxWidth: '720px' }}>
              Suivez en temps réel votre chiffre d&apos;affaires, enregistrez vos dépenses (achats stocks, logistique, pubs, salaires) et pilotez votre bénéfice net.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              className="admin-btn admin-btn-primary" 
              onClick={() => {
                setEditingExpense(null);
                onOpenModal('addExpense');
              }}
              style={{
                borderRadius: '30px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 800 }}>+</span>
              Nouvelle dépense / charge
            </button>

            <button 
              className="admin-btn admin-btn-outline" 
              onClick={handleExportCSV}
              style={{ borderRadius: '30px', padding: '10px 18px', fontSize: '12.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0 }}
              title="Exporter le journal comptable au format CSV"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exporter (CSV)
            </button>

            <button 
              className="admin-btn admin-btn-outline" 
              onClick={() => {
                if (confirm('Voulez-vous vraiment remettre à 0 toutes les écritures comptables et dépenses ?')) {
                  clearAccountingData();
                  showToast('Comptabilité réinitialisée à 0 € / 0 FCFA.');
                }
              }}
              style={{ borderRadius: '30px', padding: '10px 18px', fontSize: '12.5px', fontWeight: 600, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}
              title="Remettre toutes les dépenses à zéro"
            >
              <span>🗑️</span>
              Remettre compta à 0
            </button>
          </div>
        </div>

        {/* Time Filter Pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--adm-card-border)', paddingTop: 16 }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)', marginRight: 4 }}>
            Période comptable :
          </span>
          {[
            { id: 'all', label: 'Tout l\'historique' },
            { id: 'today', label: 'Aujourd\'hui' },
            { id: '7days', label: '7 derniers jours' },
            { id: 'month', label: 'Ce mois-ci' },
            { id: 'quarter', label: 'Ce trimestre' },
            { id: 'year', label: 'Cette année (2026)' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setAccountingPeriod(p.id as any)}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                border: accountingPeriod === p.id ? '1px solid #10b981' : '1px solid var(--adm-card-border)',
                background: accountingPeriod === p.id ? 'rgba(16,185,129,0.15)' : 'var(--adm-card-bg)',
                color: accountingPeriod === p.id ? '#10b981' : 'var(--adm-text-m)',
                fontSize: '11.5px',
                fontWeight: accountingPeriod === p.id ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16, width: '100%', boxSizing: 'border-box' }}>
        {/* Card 1 */}
        <div 
          className="admin-card" 
          style={{ 
            padding: '20px', 
            borderRadius: '18px', 
            background: 'var(--adm-card-bg)', 
            border: '1px solid var(--adm-card-border)',
            position: 'relative',
            overflow: 'hidden',
            minWidth: 0,
            boxSizing: 'border-box',
            margin: 0
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--adm-text-m)' }}>
              Chiffre d&apos;Affaires (Revenus)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56,189,248,0.15)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              💰
            </div>
          </div>
          <div style={{ fontSize: 'clamp(18px, 1.8vw, 24px)', fontWeight: 900, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)', wordBreak: 'break-word', lineHeight: 1.2 }}>
            {totalTurnoverFcfa.toLocaleString('fr-FR')} FCFA
          </div>
          <div style={{ fontSize: '12px', color: 'var(--adm-text-m)', marginTop: 4 }}>
            soit <strong style={{ color: 'var(--adm-text-h)' }}>{totalTurnoverEur.toLocaleString('fr-FR')} €</strong> ({filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''})
          </div>
          <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '10.5px', fontWeight: 700 }}>
            <span>↗</span> Encaissements réels
          </div>
        </div>

        {/* Card 2 */}
        <div 
          className="admin-card" 
          style={{ 
            padding: '20px', 
            borderRadius: '18px', 
            background: 'var(--adm-card-bg)', 
            border: '1px solid var(--adm-card-border)',
            position: 'relative',
            overflow: 'hidden',
            minWidth: 0,
            boxSizing: 'border-box',
            margin: 0
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--adm-text-m)' }}>
              Total Dépenses &amp; Charges
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              📉
            </div>
          </div>
          <div style={{ fontSize: 'clamp(18px, 1.8vw, 24px)', fontWeight: 900, color: '#ef4444', fontFamily: 'var(--font-plus-jakarta)', wordBreak: 'break-word', lineHeight: 1.2 }}>
            -{totalExpensesFcfa.toLocaleString('fr-FR')} FCFA
          </div>
          <div style={{ fontSize: '12px', color: 'var(--adm-text-m)', marginTop: 4 }}>
            soit <strong style={{ color: '#ef4444' }}>-{totalExpensesEur.toLocaleString('fr-FR')} €</strong> ({periodExpenses.length} décaissement{periodExpenses.length > 1 ? 's' : ''})
          </div>
          <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: '10.5px', fontWeight: 700 }}>
            <span>↘</span> Achats, Pubs &amp; Salaires
          </div>
        </div>

        {/* Card 3 */}
        <div 
          className="admin-card" 
          style={{ 
            padding: '20px', 
            borderRadius: '18px', 
            background: isProfitable ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', 
            border: isProfitable ? '1.5px solid rgba(16,185,129,0.4)' : '1.5px solid rgba(239,68,68,0.4)',
            position: 'relative',
            overflow: 'hidden',
            minWidth: 0,
            boxSizing: 'border-box',
            margin: 0
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: isProfitable ? '#10b981' : '#ef4444' }}>
              Bénéfice Net (Profit Réel)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isProfitable ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: isProfitable ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              💎
            </div>
          </div>
          <div style={{ fontSize: 'clamp(18px, 1.8vw, 24px)', fontWeight: 900, color: isProfitable ? '#10b981' : '#ef4444', fontFamily: 'var(--font-plus-jakarta)', wordBreak: 'break-word', lineHeight: 1.2 }}>
            {isProfitable ? '+' : ''}{netProfitFcfa.toLocaleString('fr-FR')} FCFA
          </div>
          <div style={{ fontSize: '12px', color: 'var(--adm-text-m)', marginTop: 4 }}>
            soit <strong style={{ color: isProfitable ? '#10b981' : '#ef4444' }}>{isProfitable ? '+' : ''}{netProfitEur.toLocaleString('fr-FR')} €</strong> net
          </div>
          <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: '10px', background: isProfitable ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)', color: isProfitable ? '#059669' : '#dc2626', fontSize: '10.5px', fontWeight: 800 }}>
            {isProfitable ? '✓ BÉNÉFICIAIRE' : '⚠️ DÉFICIT TEMPORAIRE'}
          </div>
        </div>

        {/* Card 4 */}
        <div 
          className="admin-card" 
          style={{ 
            padding: '20px', 
            borderRadius: '18px', 
            background: 'var(--adm-card-bg)', 
            border: '1px solid var(--adm-card-border)',
            position: 'relative',
            overflow: 'hidden',
            minWidth: 0,
            boxSizing: 'border-box',
            margin: 0
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--adm-text-m)' }}>
              Taux de Marge Nette
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(234,179,8,0.15)', color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              📊
            </div>
          </div>
          <div style={{ fontSize: 'clamp(18px, 1.8vw, 24px)', fontWeight: 900, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)', wordBreak: 'break-word', lineHeight: 1.2 }}>
            {marginPercent}%
          </div>
          <div style={{ fontSize: '13px', color: 'var(--adm-text-m)', marginTop: 4 }}>
            sur chaque euro / FCFA vendu
          </div>
          <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: '12px', background: 'rgba(234,179,8,0.12)', color: '#ca8a04', fontSize: '11px', fontWeight: 700 }}>
            Ratio : Bénéfice Net / Ventes Brutes
          </div>
        </div>
      </div>

      {/* 2-Column Analytical Cards: Breakdown & P&L */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
        {/* Column 1: Répartition des Dépenses */}
        <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🎯</span> Répartition des Charges &amp; Dépenses
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>
              {totalExpensesFcfa.toLocaleString('fr-FR')} FCFA total
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {categoryBreakdown.map(cat => {
              const pct = totalExpensesEur > 0 ? Math.round((cat.totalEur / totalExpensesEur) * 100) : 0;
              const catFcfa = Math.round(cat.totalEur * (exchangeRate || 655.957));
              return (
                <div key={cat.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--adm-text-h)' }}>
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      {cat.count > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', fontWeight: 600 }}>({cat.count})</span>
                      )}
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--adm-text-h)' }}>
                      {catFcfa.toLocaleString('fr-FR')} FCFA <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', fontWeight: 600 }}>({pct}%)</span>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '8px', borderRadius: '10px', background: 'var(--adm-card-border)', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${pct}%`, 
                        height: '100%', 
                        borderRadius: '10px', 
                        background: cat.color,
                        transition: 'width 0.4s ease'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Compte de Résultat (P&L) */}
        <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📋</span> Compte de Résultat Simplifié (P&amp;L)
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 20 }}>
              Synthèse Directe
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(56,189,248,0.08)' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--adm-text-h)' }}>Produits d&apos;Exploitation (Ventes)</div>
                <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>Commandes clients &amp; encaissements réels</div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0284c7' }}>
                +{totalTurnoverFcfa.toLocaleString('fr-FR')} FCFA
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.06)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--adm-text-h)' }}>- Achats de Marchandises &amp; Stocks (COGS)</div>
                <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>Fournisseurs, paires de sneakers &amp; emballages</div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                -{Math.round((categoryBreakdown.find(c => c.key === 'STOCK')?.totalEur || 0) * (exchangeRate || 655.957)).toLocaleString('fr-FR')} FCFA
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.06)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--adm-text-h)' }}>- Charges Opérationnelles (Fret, Pubs, Outils)</div>
                <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>DHL, Meta Ads, TikTok, abonnements cloud</div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                -{Math.round(((categoryBreakdown.find(c => c.key === 'LOGISTICS')?.totalEur || 0) + (categoryBreakdown.find(c => c.key === 'MARKETING')?.totalEur || 0) + (categoryBreakdown.find(c => c.key === 'SOFTWARE')?.totalEur || 0) + (categoryBreakdown.find(c => c.key === 'FEES')?.totalEur || 0) + (categoryBreakdown.find(c => c.key === 'OTHER')?.totalEur || 0)) * (exchangeRate || 655.957)).toLocaleString('fr-FR')} FCFA
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.06)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--adm-text-h)' }}>- Charges de Personnel &amp; Livraisons</div>
                <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>Équipe boutique &amp; coursiers express</div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                -{Math.round((categoryBreakdown.find(c => c.key === 'SALARIES')?.totalEur || 0) * (exchangeRate || 655.957)).toLocaleString('fr-FR')} FCFA
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '14px', background: isProfitable ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.2) 100%)' : 'rgba(239,68,68,0.12)', border: isProfitable ? '1.5px solid #10b981' : '1.5px solid #ef4444', marginTop: 6 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: '14px', color: 'var(--adm-text-h)' }}>= RÉSULTAT NET COMPTABLE</div>
                <div style={{ fontSize: '11px', color: isProfitable ? '#059669' : '#dc2626', fontWeight: 700 }}>
                  {isProfitable ? 'Bénéfice Réel Encaissé' : 'Déficit Net'} • Marge {marginPercent}%
                </div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: isProfitable ? '#10b981' : '#ef4444', fontFamily: 'var(--font-plus-jakarta)' }}>
                {isProfitable ? '+' : ''}{netProfitFcfa.toLocaleString('fr-FR')} FCFA
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grand Livre & Journal des Dépenses */}
      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0, fontFamily: 'var(--font-plus-jakarta)' }}>
              Journal des Dépenses &amp; Grand Livre ({filteredExpenses.length} écritures)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
              Enregistrez chaque paiement de facture, achat de stock ou dépense opérationnelle.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input 
              className="admin-input" 
              placeholder="🔍 Rechercher une dépense, n° reçu..." 
              value={expenseSearch}
              onChange={e => setExpenseSearch(e.target.value)}
              style={{ width: 260, borderRadius: 12, padding: '8px 14px', fontSize: '13px' }}
            />

            <button 
              className="admin-btn admin-btn-primary" 
              onClick={() => {
                setEditingExpense(null);
                onOpenModal('addExpense');
              }}
              style={{ borderRadius: 12, padding: '8px 18px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>+</span> Nouvelle Dépense
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 12, marginBottom: 16 }}>
          <button
            onClick={() => setExpenseCategoryFilter('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: expenseCategoryFilter === 'ALL' ? '1px solid #10b981' : '1px solid var(--adm-card-border)',
              background: expenseCategoryFilter === 'ALL' ? 'rgba(16,185,129,0.15)' : 'var(--adm-card-bg)',
              color: expenseCategoryFilter === 'ALL' ? '#10b981' : 'var(--adm-text-m)',
              fontSize: '12px',
              fontWeight: expenseCategoryFilter === 'ALL' ? 800 : 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Toutes les charges ({periodExpenses.length})
          </button>

          {Object.keys(categoryLabels).map(catKey => {
            const catInfo = categoryLabels[catKey as ExpenseCategory];
            const count = periodExpenses.filter(e => e.category === catKey).length;
            return (
              <button
                key={catKey}
                onClick={() => setExpenseCategoryFilter(catKey)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: expenseCategoryFilter === catKey ? `1px solid ${catInfo.color}` : '1px solid var(--adm-card-border)',
                  background: expenseCategoryFilter === catKey ? catInfo.bg : 'var(--adm-card-bg)',
                  color: expenseCategoryFilter === catKey ? catInfo.color : 'var(--adm-text-m)',
                  fontSize: '12px',
                  fontWeight: expenseCategoryFilter === catKey ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{catInfo.icon}</span>
                <span>{catInfo.label}</span>
                {count > 0 && <span style={{ opacity: 0.8 }}>({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Expenses Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Date</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Réf / Reçu</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Libellé de la Dépense</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Poste / Catégorie</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Règlement</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Statut</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Montant</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(exp => {
                const catInfo = categoryLabels[exp.category] || categoryLabels.OTHER;
                const expFcfa = exp.amountFcfa || Math.round(exp.amount * (exchangeRate || 655.957));
                return (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                    <td style={{ padding: '14px 16px', fontSize: '12.5px', color: 'var(--adm-text-m)', whiteSpace: 'nowrap' }}>
                      {exp.date}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-h)', whiteSpace: 'nowrap' }}>
                      <span style={{ background: 'var(--adm-card-border)', padding: '3px 8px', borderRadius: '6px' }}>
                        {exp.receiptNumber || `EXP-${exp.id.slice(-4).toUpperCase()}`}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--adm-text-h)' }}>
                      <div>{exp.title}</div>
                      {exp.notes && (
                        <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', fontWeight: 500, marginTop: 2 }}>{exp.notes}</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 5, 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '11.5px', 
                          fontWeight: 700, 
                          background: catInfo.bg, 
                          color: catInfo.color 
                        }}
                      >
                        <span>{catInfo.icon}</span>
                        <span>{catInfo.label}</span>
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--adm-text-m)' }}>
                      {exp.paymentMethod === 'TRANSFER' ? '🏦 Virement' : exp.paymentMethod === 'CARD' ? '💳 Carte' : exp.paymentMethod === 'MOBILE_MONEY' ? '📱 Mobile Money' : exp.paymentMethod === 'CASH' ? '💵 Espèces' : '🅿️ PayPal'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span 
                        style={{ 
                          display: 'inline-block',
                          padding: '3px 10px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          fontWeight: 800,
                          background: exp.status === 'PAID' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                          color: exp.status === 'PAID' ? '#10b981' : '#f59e0b'
                        }}
                      >
                        {exp.status === 'PAID' ? '✓ Payé' : '⏳ En attente'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#ef4444', fontFamily: 'var(--font-plus-jakarta)' }}>
                        -{expFcfa.toLocaleString('fr-FR')} FCFA
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                        -{exp.amount.toFixed(2)} €
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => {
                            setEditingExpense(exp);
                            onOpenModal('editExpense');
                          }}
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          style={{ borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Modifier la dépense"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          onClick={() => {
                            showConfirmDialog({
                              title: 'Supprimer la dépense',
                              message: `Voulez-vous vraiment supprimer l'écriture de dépense "${exp.title}" ?`,
                              icon: '💸',
                              type: 'danger',
                              confirmLabel: 'Supprimer',
                              cancelLabel: 'Annuler',
                              onConfirm: () => {
                                deleteExpense(exp.id);
                                showToast(`Dépense "${exp.title}" supprimée.`);
                              }
                            });
                          }}
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          style={{ borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Supprimer la dépense"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--adm-card-border)', background: 'rgba(0,0,0,0.02)' }}>
                  <td colSpan={6} style={{ padding: '14px 16px', fontWeight: 800, fontSize: '13px', color: 'var(--adm-text-h)' }}>
                    TOTAL DES CHARGES AFFICHÉES ({filteredExpenses.length} écritures) :
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 900, fontSize: '15px', color: '#ef4444', fontFamily: 'var(--font-plus-jakarta)' }}>
                    -{filteredExpenses.reduce((sum, e) => sum + (e.amountFcfa || Math.round(e.amount * (exchangeRate || 655.957))), 0).toLocaleString('fr-FR')} FCFA
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
          {filteredExpenses.length === 0 && (
            <EmptyState icon="💸" text="Aucune dépense ne correspond aux filtres sélectionnés" />
          )}
        </div>
      </div>
    </div>
  );
};
