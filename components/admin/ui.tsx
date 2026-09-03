'use client';

import React from 'react';

export const Badge: React.FC<{ status: string }> = ({ status }) => {
  const cls = status === 'PENDING' ? 'pending' : 
              status === 'SHIPPED' ? 'shipped' : 
              status === 'DELIVERED' ? 'delivered' : 
              status === 'RECEIVED' ? 'received' : 
              status === 'CANCELLED' ? 'cancelled' : 
              status === 'ACTIVE' ? 'active' : 'inactive';
  
  const labels: Record<string, string> = { 
    PENDING: '⏳ En attente', 
    SHIPPED: '📦 Expédiée', 
    DELIVERED: '✅ Livrée', 
    RECEIVED: '✅ Reçu', 
    CANCELLED: '❌ Annulé', 
    ACTIVE: '🟢 Actif', 
    INACTIVE: '⚪ Inactif' 
  };

  return <span className={`admin-badge ${cls}`}>{labels[status] || status}</span>;
};

export const EmptyState: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div className="admin-empty-state">
    <div className="admin-empty-state-icon">{icon}</div>
    <div className="admin-empty-state-text">{text}</div>
  </div>
);
