'use client';

import React, { useState } from 'react';
import { 
  useAppStore, 
  DynamicCategory, 
  SubCategory, 
  Client, 
  Supplier, 
  SupplyOrder, 
  Employee, 
  EmployeePayment, 
  DeliveryZone, 
  PromoCode, 
  Expense, 
  ExpenseCategory 
} from '@/lib/store';
import { ModalType } from '../types';

interface CrudModalsProps {
  modal: ModalType;
  close: () => void;
  editingExpense: Expense | null;
  setEditingExpense: (e: Expense | null) => void;
  selectedParentCatForSub?: string;
  showToast: (msg: string) => void;
  allKnownClients: { email: string; name: string }[];
}

export const CrudModals: React.FC<CrudModalsProps> = ({
  modal,
  close,
  editingExpense,
  setEditingExpense,
  selectedParentCatForSub,
  showToast,
  allKnownClients,
}) => {
  const store = useAppStore();
  const [promoTargetType, setPromoTargetType] = useState<string>('ALL');
  const [broadcastTargetType, setBroadcastTargetType] = useState<string>('ALL');

  const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleAddCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const cat: DynamicCategory = { 
      id: genId(), 
      name: name, 
      slug: (fd.get('slug') as string) || name.toLowerCase().replace(/\s+/g, '-'), 
      icon: (fd.get('icon') as string) || '📁',
      description: (fd.get('description') as string) || '',
      image: (fd.get('image') as string) || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop',
      subCategories: []
    };
    store.addDynamicCategory(cat);
    showToast('Catégorie principale créée !');
    close();
  };

  const handleAddSubCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parentId = (fd.get('parentId') as string) || selectedParentCatForSub;
    const name = fd.get('name') as string;
    if (!parentId || !name) return;

    const sub: SubCategory = {
      id: genId(),
      name: name,
      slug: (fd.get('slug') as string) || name.toLowerCase().replace(/\s+/g, '-'),
      productCount: 0
    };
    store.addSubCategory(parentId, sub);
    showToast(`Sous-catégorie "${name}" ajoutée !`);
    close();
  };

  const handleAddClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const c: Client = { id: genId(), name: fd.get('name') as string, email: fd.get('email') as string, phone: fd.get('phone') as string, totalOrders: 0, totalSpent: 0, registeredDate: new Date().toISOString().split('T')[0] };
    store.addClient(c);
    showToast('Client ajouté !');
    close();
  };

  const handleAddSupplier = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const s: Supplier = { id: genId(), name: fd.get('name') as string, email: fd.get('email') as string, phone: fd.get('phone') as string, company: fd.get('company') as string, address: fd.get('address') as string };
    store.addSupplier(s);
    showToast('Fournisseur ajouté !');
    close();
  };

  const handleAddSupplyOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const so: SupplyOrder = { id: genId(), supplierId: fd.get('supplierId') as string, date: new Date().toISOString().split('T')[0], items: [{ productName: fd.get('productName') as string, quantity: parseInt(fd.get('quantity') as string), unitCost: parseFloat(fd.get('unitCost') as string) }], totalCost: parseInt(fd.get('quantity') as string) * parseFloat(fd.get('unitCost') as string), status: 'PENDING' };
    store.addSupplyOrder(so);
    showToast('Approvisionnement créé !');
    close();
  };

  const handleAddEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const emp: Employee = { id: genId(), name: fd.get('name') as string, email: fd.get('email') as string, phone: fd.get('phone') as string, role: fd.get('role') as string, salary: parseFloat(fd.get('salary') as string), startDate: new Date().toISOString().split('T')[0], status: 'ACTIVE' };
    store.addEmployee(emp);
    showToast('Employé ajouté !');
    close();
  };

  const handlePayEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const p: EmployeePayment = { id: genId(), employeeId: fd.get('employeeId') as string, amount: parseFloat(fd.get('amount') as string), date: new Date().toISOString().split('T')[0], period: fd.get('period') as string, method: fd.get('method') as 'CASH' | 'TRANSFER' | 'MOBILE' };
    store.addEmployeePayment(p);
    showToast('Paiement enregistré !');
    close();
  };

  const handleAddZone = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const z: DeliveryZone = { id: genId(), name: fd.get('name') as string, fee: parseFloat(fd.get('fee') as string), estimatedDays: fd.get('days') as string };
    store.addDeliveryZone(z);
    showToast('Zone ajoutée !');
    close();
  };

  const handleAddPromo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const targetSelection = (fd.get('targetClient') as string) || 'ALL';
    const customEmail = (fd.get('customEmail') as string || '').trim().toLowerCase();
    const finalTarget = targetSelection === 'CUSTOM' ? (customEmail || 'ALL') : targetSelection;
    const description = fd.get('description') as string;
    const notifyClients = fd.get('notifyClients') === 'on';
    const customMessage = fd.get('customMessage') as string;

    let targetClientName = undefined;
    if (finalTarget !== 'ALL') {
      const foundClient = allKnownClients.find(c => c.email.toLowerCase() === finalTarget.toLowerCase());
      targetClientName = foundClient ? foundClient.name : finalTarget;
    }

    const p: PromoCode = {
      code: (fd.get('code') as string).toUpperCase().trim(),
      type: fd.get('type') as 'percent' | 'fixed',
      value: parseFloat(fd.get('value') as string),
      target: finalTarget,
      targetClientName: targetClientName,
      description: description
    };

    store.addPromoCode(p, notifyClients, customMessage);
    showToast('Code promo ' + p.code + ' enregistré pour ' + (finalTarget === 'ALL' ? 'tous les clients' : targetClientName) + ' !');
    close();
  };

  const handleSendBroadcastNotif = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const targetSelection = (fd.get('targetClient') as string) || 'ALL';
    const customEmail = (fd.get('customEmail') as string || '').trim().toLowerCase();
    const finalTarget = targetSelection === 'CUSTOM' ? (customEmail || 'ALL') : targetSelection;
    const title = fd.get('title') as string;
    const message = fd.get('message') as string;
    const promoCode = fd.get('promoCode') as string;

    let targetName = 'Tous les clients';
    if (finalTarget !== 'ALL') {
      const foundClient = allKnownClients.find(c => c.email.toLowerCase() === finalTarget.toLowerCase());
      targetName = foundClient ? foundClient.name : finalTarget;
    }

    store.addNotification({
      targetEmail: finalTarget,
      targetName: targetName,
      title: title || '📢 Offre Spéciale Aymard Store',
      message: message,
      type: 'PROMO',
      promoCode: promoCode ? promoCode.toUpperCase().trim() : undefined
    });

    showToast(`Notification diffusée à ${targetName} !`);
    close();
  };

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = (fd.get('title') as string) || 'Dépense opérationnelle';
    const category = (fd.get('category') as ExpenseCategory) || 'OTHER';
    const rawAmount = parseFloat(fd.get('amount') as string) || 0;
    const currency = (fd.get('currency') as 'EUR' | 'FCFA') || 'EUR';
    const date = (fd.get('date') as string) || new Date().toISOString().split('T')[0];
    const paymentMethod = (fd.get('paymentMethod') as any) || 'TRANSFER';
    const status = (fd.get('status') as any) || 'PAID';
    const receiptNumber = (fd.get('receiptNumber') as string) || '';
    const notes = (fd.get('notes') as string) || '';

    const amountEur = currency === 'FCFA' ? Math.round((rawAmount / (store.exchangeRate || 655.957)) * 100) / 100 : rawAmount;
    const amountFcfa = currency === 'FCFA' ? rawAmount : Math.round(rawAmount * (store.exchangeRate || 655.957));

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      title,
      category,
      amount: amountEur,
      amountFcfa,
      currency,
      date,
      paymentMethod,
      status,
      receiptNumber,
      notes
    };

    store.addExpense(newExpense);
    showToast(`Dépense "${title}" enregistrée en comptabilité !`);
    close();
  };

  const handleEditExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingExpense) return;
    const fd = new FormData(e.currentTarget);
    const title = (fd.get('title') as string) || editingExpense.title;
    const category = (fd.get('category') as ExpenseCategory) || editingExpense.category;
    const rawAmount = parseFloat(fd.get('amount') as string) || editingExpense.amount;
    const currency = (fd.get('currency') as 'EUR' | 'FCFA') || editingExpense.currency;
    const date = (fd.get('date') as string) || editingExpense.date;
    const paymentMethod = (fd.get('paymentMethod') as any) || editingExpense.paymentMethod;
    const status = (fd.get('status') as any) || editingExpense.status;
    const receiptNumber = (fd.get('receiptNumber') as string) || '';
    const notes = (fd.get('notes') as string) || '';

    const amountEur = currency === 'FCFA' ? Math.round((rawAmount / (store.exchangeRate || 655.957)) * 100) / 100 : rawAmount;
    const amountFcfa = currency === 'FCFA' ? rawAmount : Math.round(rawAmount * (store.exchangeRate || 655.957));

    store.updateExpense(editingExpense.id, {
      title,
      category,
      amount: amountEur,
      amountFcfa,
      currency,
      date,
      paymentMethod,
      status,
      receiptNumber,
      notes
    });

    showToast(`Dépense "${title}" mise à jour !`);
    setEditingExpense(null);
    close();
  };

  if (modal === 'addCategory') {
    return (
      <form onSubmit={handleAddCategory}><div className="admin-form-grid">
        <div><label className="admin-label">Nom du Rayon</label><input name="name" className="admin-input" required placeholder="ex: Sneakerhead" /></div>
        <div><label className="admin-label">Slug URL</label><input name="slug" className="admin-input" placeholder="ex: sneakerhead" /></div>
        <div><label className="admin-label">Icône (emoji)</label><input name="icon" className="admin-input" placeholder="👟" defaultValue="📁" /></div>
        <div><label className="admin-label">URL Image de fond</label><input name="image" className="admin-input" placeholder="https://images.unsplash.com/..." /></div>
        <div style={{ gridColumn: '1 / -1' }}><label className="admin-label">Description</label><textarea name="description" className="admin-textarea" placeholder="Description pour le catalogue..." /></div>
      </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
        <button type="submit" className="admin-btn admin-btn-primary">Créer le Rayon</button>
      </div></form>
    );
  }

  if (modal === 'addSubCategory') {
    return (
      <form onSubmit={handleAddSubCategory}><div className="admin-form-grid">
        <div style={{ gridColumn: '1 / -1' }}><label className="admin-label">Catégorie Parent (Rayon)</label>
          <select name="parentId" className="admin-select" defaultValue={selectedParentCatForSub || ''} required>
            <option value="">Sélectionner le rayon principal...</option>
            {store.dynamicCategories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name} (/{c.slug})</option>
            ))}
          </select>
        </div>
        <div><label className="admin-label">Nom de la Sous-Catégorie</label><input name="name" className="admin-input" required placeholder="ex: Sneakers Hype" /></div>
        <div><label className="admin-label">Slug URL</label><input name="slug" className="admin-input" placeholder="ex: sneakers-hype" /></div>
      </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
        <button type="submit" className="admin-btn admin-btn-primary">Créer la Sous-Catégorie</button>
      </div></form>
    );
  }

  if (modal === 'addClient') {
    return (
      <form onSubmit={handleAddClient}><div className="admin-form-grid">
        <div><label className="admin-label">Nom complet</label><input name="name" className="admin-input" required /></div>
        <div><label className="admin-label">Email</label><input name="email" type="email" className="admin-input" required /></div>
        <div><label className="admin-label">Téléphone</label><input name="phone" className="admin-input" /></div>
      </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
        <button type="submit" className="admin-btn admin-btn-primary">Ajouter</button>
      </div></form>
    );
  }

  if (modal === 'addSupplier') {
    return (
      <form onSubmit={handleAddSupplier}><div className="admin-form-grid">
        <div><label className="admin-label">Nom</label><input name="name" className="admin-input" required /></div>
        <div><label className="admin-label">Entreprise</label><input name="company" className="admin-input" required /></div>
        <div><label className="admin-label">Email</label><input name="email" type="email" className="admin-input" required /></div>
        <div><label className="admin-label">Téléphone</label><input name="phone" className="admin-input" /></div>
        <div style={{ gridColumn: '1 / -1' }}><label className="admin-label">Adresse</label><input name="address" className="admin-input" /></div>
      </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
        <button type="submit" className="admin-btn admin-btn-primary">Ajouter</button>
      </div></form>
    );
  }

  if (modal === 'addSupplyOrder') {
    return (
      <form onSubmit={handleAddSupplyOrder}><div className="admin-form-grid">
        <div style={{ gridColumn: '1 / -1' }}><label className="admin-label">Fournisseur</label>
          <select name="supplierId" className="admin-select" required>
            <option value="">Sélectionner...</option>
            {store.suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.company})</option>)}
          </select></div>
        <div><label className="admin-label">Produit</label><input name="productName" className="admin-input" required /></div>
        <div><label className="admin-label">Quantité</label><input name="quantity" type="number" className="admin-input" required /></div>
        <div><label className="admin-label">Coût unitaire (€)</label><input name="unitCost" type="number" step="0.01" className="admin-input" required /></div>
      </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
        <button type="submit" className="admin-btn admin-btn-primary">Créer</button>
      </div></form>
    );
  }

  if (modal === 'addEmployee') {
    return (
      <form onSubmit={handleAddEmployee}><div className="admin-form-grid">
        <div><label className="admin-label">Nom complet</label><input name="name" className="admin-input" required /></div>
        <div><label className="admin-label">Email</label><input name="email" type="email" className="admin-input" required /></div>
        <div><label className="admin-label">Téléphone</label><input name="phone" className="admin-input" /></div>
        <div><label className="admin-label">Poste / Rôle</label><input name="role" className="admin-input" required placeholder="ex: Vendeur" /></div>
        <div><label className="admin-label">Salaire mensuel (€)</label><input name="salary" type="number" step="0.01" className="admin-input" required /></div>
      </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
        <button type="submit" className="admin-btn admin-btn-primary">Ajouter</button>
      </div></form>
    );
  }

  if (modal === 'payEmployee') {
    return (
      <form onSubmit={handlePayEmployee}><div className="admin-form-grid">
        <div style={{ gridColumn: '1 / -1' }}><label className="admin-label">Employé</label>
          <select name="employeeId" className="admin-select" required>
            <option value="">Sélectionner...</option>
            {store.employees.filter(e => e.status === 'ACTIVE').map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
          </select></div>
        <div><label className="admin-label">Montant (€)</label><input name="amount" type="number" step="0.01" className="admin-input" required /></div>
        <div><label className="admin-label">Période</label><input name="period" className="admin-input" required placeholder="ex: Août 2026" /></div>
        <div><label className="admin-label">Méthode</label>
          <select name="method" className="admin-select"><option value="TRANSFER">Virement</option><option value="CASH">Espèces</option><option value="MOBILE">Mobile Money</option></select></div>
      </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
        <button type="submit" className="admin-btn admin-btn-primary">Payer</button>
      </div></form>
    );
  }

  if (modal === 'addDeliveryZone') {
    return (
      <form onSubmit={handleAddZone}><div className="admin-form-grid">
        <div><label className="admin-label">Nom de la zone</label><input name="name" className="admin-input" required /></div>
        <div><label className="admin-label">Frais (€)</label><input name="fee" type="number" step="0.01" className="admin-input" required /></div>
        <div><label className="admin-label">Délai estimé</label><input name="days" className="admin-input" required placeholder="ex: 2-4 jours" /></div>
      </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
        <button type="submit" className="admin-btn admin-btn-primary">Ajouter</button>
      </div></form>
    );
  }

  if (modal === 'addPromo') {
    return (
      <form onSubmit={handleAddPromo}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--adm-text-h)' }}>
          Nouveau Code Promo &amp; Attribution Client
        </h3>
        <div className="admin-form-grid">
          <div>
            <label className="admin-label">Code Promo (Majuscules)</label>
            <input name="code" className="admin-input" required placeholder="ex: AYMARDVIP20" style={{ textTransform: 'uppercase' }} />
          </div>
          <div>
            <label className="admin-label">Type de Réduction</label>
            <select name="type" className="admin-select">
              <option value="percent">Pourcentage (-%)</option>
              <option value="fixed">Montant Fixe (-€ / -FCFA)</option>
            </select>
          </div>
          <div>
            <label className="admin-label">Valeur de la Réduction</label>
            <input name="value" type="number" step="0.01" className="admin-input" required placeholder="ex: 15 (pour -15%)" />
          </div>
          <div>
            <label className="admin-label">Destinataire / Attribution</label>
            <select 
              name="targetClient" 
              className="admin-select"
              value={promoTargetType}
              onChange={(e) => setPromoTargetType(e.target.value)}
            >
              <option value="ALL">🌐 Tous les clients (Offre Publique)</option>
              <option value="CUSTOM">✍️ Saisir une adresse email client personnalisée...</option>
              {allKnownClients.map(c => (
                <option key={c.email} value={c.email}>👤 Client : {c.name} ({c.email})</option>
              ))}
            </select>
          </div>

          {promoTargetType === 'CUSTOM' && (
            <div style={{ gridColumn: '1 / -1', background: 'rgba(2, 132, 199, 0.05)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
              <label className="admin-label">Adresse Email du Client Cible</label>
              <input 
                name="customEmail" 
                type="email" 
                className="admin-input" 
                required 
                placeholder="ex: client.vip@gmail.com" 
              />
              <small style={{ display: 'block', marginTop: '4px', color: 'var(--adm-text-sub)', fontSize: '11px' }}>
                Ce code promo sera strictement réservé au compte connecté avec cet email.
              </small>
            </div>
          )}

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="admin-label">Description / Condition de l&apos;Offre</label>
            <input name="description" className="admin-input" placeholder="ex: Remise VIP exclusive réservée aux membres privilégiés" />
          </div>

          <div style={{ gridColumn: '1 / -1', background: 'rgba(56, 189, 248, 0.08)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '13px', color: 'var(--adm-text-h)' }}>
              <input type="checkbox" name="notifyClients" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#0284c7' }} />
              <span>🔔 Envoyer une notification instantanée au client</span>
            </label>
            <div style={{ marginTop: '10px' }}>
              <label className="admin-label">Message de la notification</label>
              <textarea
                name="customMessage"
                className="admin-textarea"
                rows={2}
                placeholder="ex: Vous avez reçu un privilège exclusif de -15% sur votre commande !"
              />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
          <button type="submit" className="admin-btn admin-btn-primary">Enregistrer &amp; Attribuer</button>
        </div>
      </form>
    );
  }

  if (modal === 'addBroadcastNotif') {
    return (
      <form onSubmit={handleSendBroadcastNotif}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--adm-text-h)' }}>
          📢 Diffuser une Notification Instantanée
        </h3>
        <div className="admin-form-grid">
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="admin-label">Destinataire de l&apos;Alerte</label>
            <select 
              name="targetClient" 
              className="admin-select"
              value={broadcastTargetType}
              onChange={(e) => setBroadcastTargetType(e.target.value)}
            >
              <option value="ALL">🌐 Tous les clients de la boutique</option>
              <option value="CUSTOM">✍️ Saisir une adresse email client spécifique...</option>
              {allKnownClients.map(c => (
                <option key={c.email} value={c.email}>👤 Client spécifique : {c.name} ({c.email})</option>
              ))}
            </select>
          </div>

          {broadcastTargetType === 'CUSTOM' && (
            <div style={{ gridColumn: '1 / -1', background: 'rgba(2, 132, 199, 0.05)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
              <label className="admin-label">Adresse Email du Client Cible</label>
              <input 
                name="customEmail" 
                type="email" 
                className="admin-input" 
                required 
                placeholder="ex: client.vip@gmail.com" 
              />
              <small style={{ display: 'block', marginTop: '4px', color: 'var(--adm-text-sub)', fontSize: '11px' }}>
                Seul l&apos;utilisateur connecté avec cette adresse recevra la notification.
              </small>
            </div>
          )}

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="admin-label">Titre de la Notification</label>
            <input name="title" className="admin-input" required placeholder="ex: 🎁 Offre Spéciale du Week-end !" defaultValue="🎁 Vente Privée VIP Aymard Store" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="admin-label">Message de l&apos;Alerte</label>
            <textarea
              name="message"
              className="admin-textarea"
              rows={3}
              required
              placeholder="Ecrivez votre message ici..."
              defaultValue="Profitez de réductions exclusives sur toute la nouvelle collection d'Aymard Store !"
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="admin-label">Rattacher un Code Promo (Optionnel)</label>
            <select name="promoCode" className="admin-select">
              <option value="">-- Aucun code rattaché --</option>
              {store.promoCodes.map(p => (
                <option key={p.code} value={p.code}>{p.code} ({p.type === 'percent' ? `-${p.value}%` : `-${p.value}€`})</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
          <button type="submit" className="admin-btn admin-btn-primary">Envoyer la Notification</button>
        </div>
      </form>
    );
  }

  if (modal === 'addExpense') {
    return (
      <form onSubmit={handleAddExpense}>
        <div className="admin-form-grid">
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="admin-label">Libellé / Objet de la dépense</label>
            <input name="title" className="admin-input" required placeholder="ex: Achat Stock Sneakers Nike, Pub Meta Ads..." />
          </div>

          <div>
            <label className="admin-label">Poste de Dépense (Catégorie)</label>
            <select name="category" className="admin-select" required>
              <option value="STOCK">📦 Achats Stocks &amp; Marchandises</option>
              <option value="LOGISTICS">🚚 Logistique, Fret &amp; Douanes</option>
              <option value="MARKETING">📢 Marketing, Pubs &amp; Influenceurs</option>
              <option value="SALARIES">💼 Salaires &amp; Commissions Livreur</option>
              <option value="RENT">🏢 Loyer, Bureaux &amp; Charges Fixes</option>
              <option value="SOFTWARE">🛠️ Outils, Abonnements &amp; Cloud</option>
              <option value="FEES">💳 Frais bancaires &amp; Passerelles</option>
              <option value="OTHER">🏷️ Divers &amp; Imprévus</option>
            </select>
          </div>

          <div>
            <label className="admin-label">Devise de saisie</label>
            <select name="currency" className="admin-select" defaultValue={store.currency}>
              <option value="EUR">€ Euro (EUR)</option>
              <option value="FCFA">FCFA (Franc CFA)</option>
            </select>
          </div>

          <div>
            <label className="admin-label">Montant</label>
            <input name="amount" type="number" step="0.01" className="admin-input" required placeholder="ex: 150.00 ou 100000" />
          </div>

          <div>
            <label className="admin-label">Date du règlement</label>
            <input name="date" type="date" className="admin-input" defaultValue={new Date().toISOString().split('T')[0]} required />
          </div>

          <div>
            <label className="admin-label">Mode de règlement</label>
            <select name="paymentMethod" className="admin-select">
              <option value="TRANSFER">Virement Bancaire</option>
              <option value="CARD">Carte Bancaire (CB / Visa / Mastercard)</option>
              <option value="MOBILE_MONEY">Mobile Money (MTN / Moov / Wave)</option>
              <option value="CASH">Espèces / Caisse</option>
              <option value="PAYPAL">PayPal / Autre</option>
            </select>
          </div>

          <div>
            <label className="admin-label">Statut</label>
            <select name="status" className="admin-select">
              <option value="PAID">✅ Payé / Décaissé</option>
              <option value="PENDING">⏳ En attente de règlement</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="admin-label">N° de Facture / Réf Justificatif (Optionnel)</label>
            <input name="receiptNumber" className="admin-input" placeholder="ex: FAC-2026-092, DHL-BJ-883..." />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="admin-label">Notes &amp; Détails complémentaires</label>
            <textarea name="notes" className="admin-input" rows={2} placeholder="Précisions sur la dépense, fournisseur, conditions..." style={{ resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
          <button type="submit" className="admin-btn admin-btn-primary">Enregistrer la dépense</button>
        </div>
      </form>
    );
  }

  if (modal === 'editExpense' && editingExpense) {
    return (
      <form onSubmit={handleEditExpense}>
        <div className="admin-form-grid">
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="admin-label">Libellé / Objet de la dépense</label>
            <input name="title" className="admin-input" defaultValue={editingExpense.title} required />
          </div>

          <div>
            <label className="admin-label">Poste de Dépense</label>
            <select name="category" className="admin-select" defaultValue={editingExpense.category} required>
              <option value="STOCK">📦 Achats Stocks &amp; Marchandises</option>
              <option value="LOGISTICS">🚚 Logistique, Fret &amp; Douanes</option>
              <option value="MARKETING">📢 Marketing, Pubs &amp; Influenceurs</option>
              <option value="SALARIES">💼 Salaires &amp; Commissions Livreur</option>
              <option value="RENT">🏢 Loyer, Bureaux &amp; Charges Fixes</option>
              <option value="SOFTWARE">🛠️ Outils, Abonnements &amp; Cloud</option>
              <option value="FEES">💳 Frais bancaires &amp; Passerelles</option>
              <option value="OTHER">🏷️ Divers &amp; Imprévus</option>
            </select>
          </div>

          <div>
            <label className="admin-label">Devise de saisie</label>
            <select name="currency" className="admin-select" defaultValue={editingExpense.currency || 'EUR'}>
              <option value="EUR">€ Euro (EUR)</option>
              <option value="FCFA">FCFA (Franc CFA)</option>
            </select>
          </div>

          <div>
            <label className="admin-label">Montant</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              className="admin-input"
              defaultValue={editingExpense.currency === 'FCFA' && editingExpense.amountFcfa ? editingExpense.amountFcfa : editingExpense.amount}
              required
            />
          </div>

          <div>
            <label className="admin-label">Date</label>
            <input name="date" type="date" className="admin-input" defaultValue={editingExpense.date} required />
          </div>

          <div>
            <label className="admin-label">Mode de règlement</label>
            <select name="paymentMethod" className="admin-select" defaultValue={editingExpense.paymentMethod}>
              <option value="TRANSFER">Virement Bancaire</option>
              <option value="CARD">Carte Bancaire (CB / Visa / Mastercard)</option>
              <option value="MOBILE_MONEY">Mobile Money (MTN / Moov / Wave)</option>
              <option value="CASH">Espèces / Caisse</option>
              <option value="PAYPAL">PayPal / Autre</option>
            </select>
          </div>

          <div>
            <label className="admin-label">Statut</label>
            <select name="status" className="admin-select" defaultValue={editingExpense.status}>
              <option value="PAID">✅ Payé / Décaissé</option>
              <option value="PENDING">⏳ En attente de règlement</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="admin-label">N° de Facture / Réf Justificatif</label>
            <input name="receiptNumber" className="admin-input" defaultValue={editingExpense.receiptNumber || ''} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="admin-label">Notes</label>
            <textarea name="notes" className="admin-input" rows={2} defaultValue={editingExpense.notes || ''} style={{ resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="admin-btn admin-btn-outline" onClick={() => { setEditingExpense(null); close(); }}>Annuler</button>
          <button type="submit" className="admin-btn admin-btn-primary">Mettre à jour</button>
        </div>
      </form>
    );
  }

  return null;
};
