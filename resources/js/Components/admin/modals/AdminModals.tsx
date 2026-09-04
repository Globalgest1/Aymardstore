'use client';

import React from 'react';
import { Product, Expense } from '@/lib/store';
import { ModalType, Tab } from '../types';
import { ConfirmDialogOptions } from '../AdminConfirmDialog';
import { ProductFormModal } from './ProductFormModal';
import { BatchAddModal } from './BatchAddModal';
import { CrudModals } from './CrudModals';

interface AdminModalsProps {
  modal: ModalType;
  setModal: (m: ModalType) => void;
  editingProduct: Product | null;
  setEditingProduct: (p: Product | null) => void;
  selectedSizes: string[];
  setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedColors: string[];
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  editingExpense: Expense | null;
  setEditingExpense: (e: Expense | null) => void;
  selectedParentCatForSub?: string;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
  setSelectedBroadcastProductId?: (id: string) => void;
  setTab?: (tab: Tab) => void;
  allKnownClients?: { email: string; name: string }[];
}

export const AdminModals: React.FC<AdminModalsProps> = ({
  modal,
  setModal,
  editingProduct,
  setEditingProduct,
  selectedSizes,
  setSelectedSizes,
  selectedColors,
  setSelectedColors,
  editingExpense,
  setEditingExpense,
  selectedParentCatForSub,
  showToast,
  showConfirmDialog,
  setSelectedBroadcastProductId,
  setTab,
  allKnownClients = [],
}) => {
  if (!modal) return null;

  const close = () => setModal(null);

  const titles: Record<string, string> = {
    addProduct: '📦 Ajouter un nouveau produit', 
    batchAddProducts: '⚡ Import Multi-Produits en Masse par IA',
    editProduct: '✏️ Modifier le produit, pointures & couleurs',
    addCategory: '🏷️ Nouvelle catégorie principale', 
    addSubCategory: '🌿 Nouvelle sous-catégorie', 
    addClient: '👥 Nouveau client',
    addSupplier: '🏭 Nouveau fournisseur', 
    addSupplyOrder: '📥 Nouvel approvisionnement', 
    addEmployee: '👔 Nouvel employé',
    payEmployee: '💳 Payer un employé', 
    addDeliveryZone: '🚚 Nouvelle zone', 
    addPromo: '🎟️ Nouveau code promo',
    addBroadcastNotif: '📢 Diffuser une Notification',
    addExpense: '💰 Enregistrer une nouvelle dépense / charge',
    editExpense: '✏️ Modifier la dépense',
  };

  return (
    <div className="admin-modal-overlay" onClick={close} role="presentation">
      <div 
        className="admin-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="admin-modal-title" 
        style={{ 
          maxWidth: modal === 'batchAddProducts' ? '960px' : '640px', 
          width: modal === 'batchAddProducts' ? '96%' : undefined, 
          maxHeight: '90vh', 
          overflowY: 'auto' 
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="admin-modal-title" id="admin-modal-title">
          {titles[modal] || 'Action Admin'}
        </div>

        {modal === 'addProduct' && (
          <ProductFormModal
            isEdit={false}
            close={close}
            switchToBatch={() => setModal('batchAddProducts')}
            selectedSizes={selectedSizes}
            setSelectedSizes={setSelectedSizes}
            selectedColors={selectedColors}
            setSelectedColors={setSelectedColors}
            showToast={showToast}
            showConfirmDialog={showConfirmDialog}
            setSelectedBroadcastProductId={setSelectedBroadcastProductId}
            setTab={setTab}
          />
        )}

        {modal === 'batchAddProducts' && (
          <BatchAddModal
            close={close}
            switchToSingle={() => setModal('addProduct')}
            showToast={showToast}
          />
        )}

        {modal === 'editProduct' && editingProduct && (
          <ProductFormModal
            isEdit={true}
            editingProduct={editingProduct}
            close={() => {
              setEditingProduct(null);
              close();
            }}
            selectedSizes={selectedSizes}
            setSelectedSizes={setSelectedSizes}
            selectedColors={selectedColors}
            setSelectedColors={setSelectedColors}
            showToast={showToast}
            showConfirmDialog={showConfirmDialog}
          />
        )}

        {modal !== 'addProduct' && modal !== 'batchAddProducts' && modal !== 'editProduct' && (
          <CrudModals
            modal={modal}
            close={close}
            editingExpense={editingExpense}
            setEditingExpense={setEditingExpense}
            selectedParentCatForSub={selectedParentCatForSub}
            showToast={showToast}
            allKnownClients={allKnownClients}
          />
        )}
      </div>
    </div>
  );
};
