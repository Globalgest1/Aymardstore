import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from '@/lib/compat-navigation';
import { useAppStore, Client, Product, Expense } from '@/lib/store';
import { getLiveVisitorsDetails, LiveVisitorsReport } from '@/lib/internal-tracker';

// Modular Admin Components
import { Tab, ModalType } from '@/Components/admin/types';
import { AdminHeader } from '@/Components/admin/AdminHeader';
import { AdminSidebar } from '@/Components/admin/AdminSidebar';
import { AdminConfirmDialog, ConfirmDialogOptions } from '@/Components/admin/AdminConfirmDialog';
import { AdminModals } from '@/Components/admin/modals/AdminModals';
import { LiveVisitorsModal } from '@/Components/admin/modals/LiveVisitorsModal';
import { OrderTrackingModal } from '@/Components/admin/modals/OrderTrackingModal';
import { ClientPerkModals } from '@/Components/admin/modals/ClientPerkModals';

// Modular Tabs (All 22 Tabs)
import { DashboardTab } from '@/Components/admin/tabs/DashboardTab';
import { ProductsTab } from '@/Components/admin/tabs/ProductsTab';
import { CategoriesTab } from '@/Components/admin/tabs/CategoriesTab';
import { HomeCmsTab } from '@/Components/admin/tabs/HomeCmsTab';
import { OrdersTab } from '@/Components/admin/tabs/OrdersTab';
import { AbandonedTab } from '@/Components/admin/tabs/AbandonedTab';
import { ReviewsTab } from '@/Components/admin/tabs/ReviewsTab';
import { MarketingTab } from '@/Components/admin/tabs/MarketingTab';
import { BlogCmsTab } from '@/Components/admin/tabs/BlogCmsTab';
import { ClientsTab } from '@/Components/admin/tabs/ClientsTab';
import { SupportChatTab } from '@/Components/admin/tabs/SupportChatTab';
import { TransactionsTab } from '@/Components/admin/tabs/TransactionsTab';
import { AccountingTab } from '@/Components/admin/tabs/AccountingTab';
import { PromosTab } from '@/Components/admin/tabs/PromosTab';
import { DeliveryTab } from '@/Components/admin/tabs/DeliveryTab';
import { LocationsTab } from '@/Components/admin/tabs/LocationsTab';
import { SuppliersTab } from '@/Components/admin/tabs/SuppliersTab';
import { EmployeesTab } from '@/Components/admin/tabs/EmployeesTab';
import { AnalyticsTab } from '@/Components/admin/tabs/AnalyticsTab';
import { PixelsTab } from '@/Components/admin/tabs/PixelsTab';
import { SettingsTab } from '@/Components/admin/tabs/SettingsTab';
import { ProfileTab } from '@/Components/admin/tabs/ProfileTab';

// Toast Notification Hook
function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const show = useCallback((msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, show };
}

interface AdminIndexProps {
  initialProducts?: any[];
  initialOrders?: any[];
  initialClients?: any[];
  initialCoupons?: any[];
  settings?: any;
}

export default function AdminDashboard({ initialProducts, initialOrders, initialClients, initialCoupons, settings }: AdminIndexProps) {
  const router = useRouter();
  const store = useAppStore();

  // Synchronize server props into Zustand store
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      useAppStore.setState({ products: initialProducts });
    }
    if (initialOrders && initialOrders.length > 0) {
      useAppStore.setState({ orders: initialOrders });
    }
    if (initialClients && initialClients.length > 0) {
      useAppStore.setState({ clients: initialClients });
    }
    if (initialCoupons && initialCoupons.length > 0) {
      useAppStore.setState({ promoCodes: initialCoupons });
    }
  }, [initialProducts, initialOrders, initialClients, initialCoupons]);

  // Navigation & View State
  const [tab, setTab] = useState<Tab>('dashboard');
  const [modal, setModal] = useState<ModalType>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [adminDarkMode, setAdminDarkMode] = useState(false);

  // Toast & Confirmation Dialogs
  const { toast, show: showToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);

  const showConfirmDialog = (opts: ConfirmDialogOptions) => {
    setConfirmDialog(opts);
  };
  const closeConfirmDialog = () => {
    setConfirmDialog(null);
  };

  // Editing Entities State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedParentCatForSub, setSelectedParentCatForSub] = useState<string | undefined>(undefined);

  // Marketing Drop State
  const [selectedBroadcastProductId, setSelectedBroadcastProductId] = useState<string>('');

  // Live Tracking Modal State
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);

  // Client Perk & Bonus Points Modals State
  const [grantPerkClient, setGrantPerkClient] = useState<Client | null>(null);
  const [grantBonusPointsClient, setGrantBonusPointsClient] = useState<Client | null>(null);
  const [bonusPointsInput, setBonusPointsInput] = useState<number>(100);
  const [bonusPointsReason, setBonusPointsReason] = useState<string>('');
  const [auditClient, setAuditClient] = useState<Client | null>(null);

  // Live Visitors Modal State
  const [showLiveVisitorsModal, setShowLiveVisitorsModal] = useState<boolean>(false);
  const [liveVisitorsReport, setLiveVisitorsReport] = useState<LiveVisitorsReport>(() => getLiveVisitorsDetails());

  const refreshLiveVisitors = useCallback(() => {
    setLiveVisitorsReport(getLiveVisitorsDetails());
  }, []);

  // Periodic heartbeat / live report poll
  useEffect(() => {
    const timer = setInterval(() => {
      if (showLiveVisitorsModal || tab === 'analytics' || tab === 'dashboard') {
        setLiveVisitorsReport(getLiveVisitorsDetails());
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [showLiveVisitorsModal, tab]);

  // Theme Initializer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('admin-theme');
    setAdminDarkMode(saved !== 'light');
    setMounted(true);
    if (window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }
  }, []);

  const toggleAdminTheme = () => {
    const newDark = !adminDarkMode;
    setAdminDarkMode(newDark);
    localStorage.setItem('admin-theme', newDark ? 'dark' : 'light');
  };

  // Server Session Guard & SQLite DB Sync
  useEffect(() => {
    async function checkServerSession() {
      try {
        const res = await fetch('/api/auth/admin-status');
        if (!res.ok) {
          router.push('/auth/login?redirect=/admin&unauthorized=1');
          return;
        }

        // Chargement automatique des commandes depuis la base SQLite
        const ordersRes = await fetch('/api/orders');
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (ordersData.success && Array.isArray(ordersData.orders)) {
            useAppStore.setState({ orders: ordersData.orders });
          }
        }
      } catch {
        router.push('/auth/login?redirect=/admin&unauthorized=1');
      }
    }

    if (mounted && store._hasHydrated) {
      if (!store.user || store.user.role !== 'ADMIN') {
        router.push('/auth/login?redirect=/admin&unauthorized=1');
      } else {
        checkServerSession();
      }
    }
  }, [store.user, store._hasHydrated, mounted, router]);

  // Aggregated Clients Map (CRM + Orders + Users)
  const allKnownClients: { email: string; name: string }[] = useMemo(() => {
    const clientMap = new Map<string, string>();
    (store.clients || []).forEach((c: Client) => {
      if (c.email) clientMap.set(c.email.toLowerCase().trim(), c.name || c.email);
    });
    (store.orders || []).forEach((o: any) => {
      if (o.customerEmail) {
        const email = o.customerEmail.toLowerCase().trim();
        if (!clientMap.has(email)) {
          clientMap.set(email, o.shippingAddress?.fullName || 'Client Commande');
        }
      }
    });
    if (store.user?.email) {
      const email = store.user.email.toLowerCase().trim();
      if (!clientMap.has(email)) {
        clientMap.set(email, store.user.name || 'Compte Boutique');
      }
    }
    return Array.from(clientMap.entries()).map(([email, name]) => ({ email, name }));
  }, [store.clients, store.orders, store.user]);

  // Routing Table for All 22 Modular Tabs
  const tabContent: Record<Tab, () => React.ReactNode> = {
    dashboard: () => (
      <DashboardTab
        setModal={setModal}
        showToast={showToast}
      />
    ),
    products: () => (
      <ProductsTab
        onOpenModal={(type) => setModal(type)}
        onEditProduct={(p) => {
          setEditingProduct(p);
          setSelectedSizes(p.sizes || []);
          setSelectedColors(p.colors || []);
          setModal('editProduct');
        }}
        showConfirmDialog={showConfirmDialog}
        showToast={showToast}
        onBroadcastProduct={(productId) => {
          setSelectedBroadcastProductId(productId);
          setTab('marketing');
        }}
      />
    ),
    categories: () => (
      <CategoriesTab
        onOpenModal={(type) => setModal(type)}
        setSelectedParentCatForSub={(id) => setSelectedParentCatForSub(id)}
        showConfirmDialog={showConfirmDialog}
        showToast={showToast}
      />
    ),
    homeCms: () => (
      <HomeCmsTab
        showToast={showToast}
      />
    ),
    orders: () => (
      <OrdersTab
        openTrackingManager={(order) => setTrackingOrder(order)}
        showToast={showToast}
      />
    ),
    abandonedCheckouts: () => (
      <AbandonedTab
        showToast={showToast}
        showConfirmDialog={showConfirmDialog}
      />
    ),
    reviews: () => (
      <ReviewsTab
        showToast={showToast}
        showConfirmDialog={showConfirmDialog}
      />
    ),
    marketing: () => (
      <MarketingTab
        selectedBroadcastProductId={selectedBroadcastProductId}
        setSelectedBroadcastProductId={setSelectedBroadcastProductId}
        showToast={showToast}
        showConfirmDialog={showConfirmDialog}
      />
    ),
    blog: () => (
      <BlogCmsTab
        showToast={showToast}
        showConfirmDialog={showConfirmDialog}
      />
    ),
    clients: () => (
      <ClientsTab
        onOpenModal={(type) => setModal(type)}
        setAuditClient={setAuditClient}
        setGrantBonusPointsClient={setGrantBonusPointsClient}
        setBonusPointsInput={setBonusPointsInput}
        setBonusPointsReason={setBonusPointsReason}
        showToast={showToast}
      />
    ),
    supportChat: () => (
      <SupportChatTab
        showToast={showToast}
      />
    ),
    transactions: () => (
      <TransactionsTab
        showToast={showToast}
      />
    ),
    accounting: () => (
      <AccountingTab
        onOpenModal={(type) => setModal(type)}
        setEditingExpense={setEditingExpense}
        showConfirmDialog={showConfirmDialog}
        showToast={showToast}
      />
    ),
    promos: () => (
      <PromosTab
        onOpenModal={(type) => setModal(type)}
        showToast={showToast}
        showConfirmDialog={showConfirmDialog}
      />
    ),
    delivery: () => (
      <DeliveryTab
        onOpenModal={(type) => setModal(type)}
        showToast={showToast}
        showConfirmDialog={showConfirmDialog}
      />
    ),
    locations: () => (
      <LocationsTab
        showToast={showToast}
      />
    ),
    suppliers: () => (
      <SuppliersTab
        onOpenModal={(type) => setModal(type)}
        showToast={showToast}
        showConfirmDialog={showConfirmDialog}
      />
    ),
    employees: () => (
      <EmployeesTab
        onOpenModal={(type) => setModal(type)}
        showToast={showToast}
        showConfirmDialog={showConfirmDialog}
      />
    ),
    analytics: () => (
      <AnalyticsTab
        showToast={showToast}
        onOpenLiveRadar={() => {
          refreshLiveVisitors();
          setShowLiveVisitorsModal(true);
        }}
      />
    ),
    pixels: () => (
      <PixelsTab
        showToast={showToast}
      />
    ),
    settings: () => (
      <SettingsTab
        showToast={showToast}
      />
    ),
    profile: () => (
      <ProfileTab
        showToast={showToast}
      />
    ),
  };

  return (
    <div className="admin-dashboard-container" data-theme={adminDarkMode ? 'dark' : 'light'}>
      {/* Navigation Sidebar */}
      <AdminSidebar
        tab={tab}
        setTab={setTab}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        onAnalyticsBadgeClick={() => {
          setTab('analytics');
          refreshLiveVisitors();
          setShowLiveVisitorsModal(true);
        }}
      />

      {/* Main Back-Office Wrapper */}
      <div className="admin-main-wrapper">
        <AdminHeader
          tab={tab}
          setTab={setTab}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          adminDarkMode={adminDarkMode}
          toggleAdminTheme={toggleAdminTheme}
        />

        <main className="admin-main">
          {tabContent[tab] ? tabContent[tab]() : <DashboardTab setModal={setModal} showToast={showToast} />}
        </main>
      </div>

      {/* Unified Modals Controller */}
      <AdminModals
        modal={modal}
        setModal={setModal}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        selectedSizes={selectedSizes}
        setSelectedSizes={setSelectedSizes}
        selectedColors={selectedColors}
        setSelectedColors={setSelectedColors}
        editingExpense={editingExpense}
        setEditingExpense={setEditingExpense}
        selectedParentCatForSub={selectedParentCatForSub}
        showToast={showToast}
        showConfirmDialog={showConfirmDialog}
        setSelectedBroadcastProductId={setSelectedBroadcastProductId}
        setTab={setTab}
        allKnownClients={allKnownClients}
      />

      {/* Package Tracking & GPS Delivery Modal */}
      <OrderTrackingModal
        order={trackingOrder}
        onClose={() => setTrackingOrder(null)}
        showToast={showToast}
      />

      {/* Client Loyalty & VIP Perk Modals */}
      <ClientPerkModals
        grantPerkClient={grantPerkClient}
        setGrantPerkClient={setGrantPerkClient}
        grantBonusPointsClient={grantBonusPointsClient}
        setGrantBonusPointsClient={setGrantBonusPointsClient}
        auditClient={auditClient}
        setAuditClient={setAuditClient}
        showToast={showToast}
      />

      {/* Live Visitors Radar Modal */}
      <LiveVisitorsModal
        isOpen={showLiveVisitorsModal}
        onClose={() => setShowLiveVisitorsModal(false)}
        report={liveVisitorsReport}
        refreshLiveVisitors={refreshLiveVisitors}
        showToast={showToast}
      />

      {/* Luxury Confirmation Dialog */}
      {confirmDialog && (
        <AdminConfirmDialog
          dialog={confirmDialog}
          onClose={closeConfirmDialog}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <div 
          className={`admin-toast ${toast.type}`}
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 22px',
            borderRadius: '18px',
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : toast.type === 'warning' ? 'rgba(245, 158, 11, 0.95)' : toast.type === 'info' ? 'rgba(2, 132, 199, 0.95)' : 'rgba(16, 185, 129, 0.95)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '13.5px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            animation: 'chatTeaserSlideIn 0.25s ease forwards'
          }}
        >
          <span style={{ fontSize: '18px' }}>
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
