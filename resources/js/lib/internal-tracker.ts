'use client';

export type InternalEventType = 
  | 'page_view'
  | 'view_item'
  | 'add_to_cart'
  | 'initiate_checkout'
  | 'purchase'
  | 'payment_completed'
  | 'delivery';

export interface InternalEvent {
  id: string;
  type: InternalEventType;
  name: string;
  sessionId: string;
  userId?: string;
  timestamp: string;
  path?: string;
  boutique: string;
  group: string;
  metadata?: Record<string, any>;
}

export interface LiveVisitorSession {
  sessionId: string;
  userId?: string;
  lastSeen: number;
  country: string;
  countryCode: string;
  flag: string;
  city: string;
  device: string;
  browser: string;
  currentPath: string;
  lastAction: string;
}

export interface LiveVisitorsReport {
  totalCount: number;
  visitors: LiveVisitorSession[];
  byCountry: {
    country: string;
    countryCode: string;
    flag: string;
    count: number;
    percentage: number;
    cities: string[];
  }[];
  byDevice: {
    device: string;
    count: number;
    percentage: number;
  }[];
  byPage: {
    path: string;
    count: number;
    percentage: number;
  }[];
}

const STORAGE_KEY = 'aymard_internal_events_v1';
const HEARTBEAT_KEY = 'aymard_visitor_heartbeat_v2';

export function detectVisitorGeoInfo(): { country: string; countryCode: string; flag: string; city: string } {
  if (typeof window === 'undefined') {
    return { country: 'Bénin', countryCode: 'BJ', flag: '🇧🇯', city: 'Cotonou' };
  }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = (navigator.language || '').toLowerCase();
    
    // Check localStorage detected location override if any
    const localLocation = localStorage.getItem('aymard_detected_location_id');
    if (localLocation === 'france') {
      return { country: 'France', countryCode: 'FR', flag: '🇫🇷', city: 'Paris' };
    }
    if (localLocation === 'belgique') {
      return { country: 'Belgique', countryCode: 'BE', flag: '🇧🇪', city: 'Bruxelles' };
    }
    if (localLocation === 'benin') {
      return { country: 'Bénin', countryCode: 'BJ', flag: '🇧🇯', city: 'Cotonou' };
    }

    if (tz.includes('Porto-Novo') || tz.includes('Lagos') || tz.includes('Accra') || tz.includes('Abidjan') || tz.includes('Dakar') || tz.includes('Africa')) {
      return { country: 'Bénin', countryCode: 'BJ', flag: '🇧🇯', city: 'Cotonou' };
    }
    if (tz.includes('Paris') || lang.includes('fr-fr')) {
      return { country: 'France', countryCode: 'FR', flag: '🇫🇷', city: 'Paris' };
    }
    if (tz.includes('Brussels') || tz.includes('Bruxelles') || lang.includes('fr-be')) {
      return { country: 'Belgique', countryCode: 'BE', flag: '🇧🇪', city: 'Bruxelles' };
    }
    if (tz.includes('London') || lang.includes('en-gb')) {
      return { country: 'Royaume-Uni', countryCode: 'GB', flag: '🇬🇧', city: 'Londres' };
    }
    if (tz.includes('Montreal') || tz.includes('Toronto') || lang.includes('fr-ca')) {
      return { country: 'Canada', countryCode: 'CA', flag: '🇨🇦', city: 'Montréal' };
    }
    if (tz.includes('New_York') || tz.includes('America') || lang.includes('en-us')) {
      return { country: 'États-Unis', countryCode: 'US', flag: '🇺🇸', city: 'New York' };
    }

    return { country: 'Bénin', countryCode: 'BJ', flag: '🇧🇯', city: 'Cotonou' };
  } catch {
    return { country: 'Bénin', countryCode: 'BJ', flag: '🇧🇯', city: 'Cotonou' };
  }
}

export function detectVisitorDeviceInfo(): { device: string; browser: string } {
  if (typeof window === 'undefined') {
    return { device: 'Desktop 💻', browser: 'Chrome' };
  }
  const ua = navigator.userAgent || '';
  let device = 'Desktop 💻';
  if (/iPad|Tablet/i.test(ua) || (window.innerWidth >= 768 && window.innerWidth <= 1024)) {
    device = 'Tablette 📲';
  } else if (/Mobi|Android|iPhone|iPod/i.test(ua) || window.innerWidth < 768) {
    device = 'Mobile 📱';
  }

  let browser = 'Navigateur Web';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Google Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';
  else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
  else if (ua.includes('Edg')) browser = 'Microsoft Edge';

  return { device, browser };
}

export function getVisitorSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  let sessionId = localStorage.getItem('aymard_visitor_session_id');
  if (!sessionId) {
    sessionId = 'vs_' + Math.random().toString(36).substring(2, 8).toUpperCase() + Date.now().toString(36).slice(-4).toUpperCase();
    localStorage.setItem('aymard_visitor_session_id', sessionId);
  }
  return sessionId;
}

export function pingVisitorHeartbeat(userId?: string, customAction?: string) {
  if (typeof window === 'undefined') return;
  try {
    const sessionId = getVisitorSessionId();
    const now = Date.now();
    const raw = localStorage.getItem(HEARTBEAT_KEY);
    let heartbeats: Record<string, LiveVisitorSession> = raw ? JSON.parse(raw) : {};
    
    const threeMinAgo = now - 3 * 60 * 1000;
    const clean: Record<string, LiveVisitorSession> = {};
    Object.keys(heartbeats).forEach(k => {
      if (heartbeats[k].lastSeen > threeMinAgo) {
        clean[k] = heartbeats[k];
      }
    });

    const geo = detectVisitorGeoInfo();
    const dev = detectVisitorDeviceInfo();
    const currentPath = window.location.pathname || '/';

    let lastAction = customAction || 'Navigation sur la boutique';
    if (!customAction) {
      if (currentPath.startsWith('/products/')) lastAction = 'Consulte un produit';
      else if (currentPath.startsWith('/cart')) lastAction = 'Gère son panier';
      else if (currentPath.startsWith('/checkout')) lastAction = 'En cours de paiement';
      else if (currentPath.startsWith('/account')) lastAction = 'Espace Client';
      else if (currentPath.startsWith('/admin')) lastAction = 'Tableau de bord Admin';
      else if (currentPath === '/') lastAction = 'Page d\'Accueil';
      else lastAction = 'Visite ' + currentPath;
    }

    clean[sessionId] = {
      sessionId,
      userId,
      lastSeen: now,
      country: geo.country,
      countryCode: geo.countryCode,
      flag: geo.flag,
      city: geo.city,
      device: dev.device,
      browser: dev.browser,
      currentPath,
      lastAction
    };

    localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(clean));
  } catch (e) {
    console.error('Error pinging heartbeat:', e);
  }
}

export function getLiveVisitorsDetails(): LiveVisitorsReport {
  if (typeof window === 'undefined') {
    return {
      totalCount: 1,
      visitors: [
        {
          sessionId: 'VS-LOCAL',
          lastSeen: Date.now(),
          country: 'Bénin',
          countryCode: 'BJ',
          flag: '🇧🇯',
          city: 'Cotonou',
          device: 'Desktop 💻',
          browser: 'Chrome',
          currentPath: '/',
          lastAction: 'Navigation active'
        }
      ],
      byCountry: [{ country: 'Bénin', countryCode: 'BJ', flag: '🇧🇯', count: 1, percentage: 100, cities: ['Cotonou'] }],
      byDevice: [{ device: 'Desktop 💻', count: 1, percentage: 100 }],
      byPage: [{ path: '/', count: 1, percentage: 100 }]
    };
  }

  try {
    const now = Date.now();
    const threeMinAgo = now - 3 * 60 * 1000;
    const raw = localStorage.getItem(HEARTBEAT_KEY);
    let heartbeats: Record<string, LiveVisitorSession> = raw ? JSON.parse(raw) : {};
    
    // Clean old
    const activeVisitors = Object.values(heartbeats).filter(h => h.lastSeen > threeMinAgo);
    
    // Ensure current visitor is present if empty
    if (activeVisitors.length === 0) {
      pingVisitorHeartbeat();
      const currentRaw = localStorage.getItem(HEARTBEAT_KEY);
      const updated: Record<string, LiveVisitorSession> = currentRaw ? JSON.parse(currentRaw) : {};
      const currentActive = Object.values(updated);
      if (currentActive.length > 0) {
        return getLiveVisitorsDetails();
      }
    }

    const totalCount = Math.max(1, activeVisitors.length);

    // Group by country
    const countryMap: Record<string, { country: string; countryCode: string; flag: string; count: number; cities: Set<string> }> = {};
    activeVisitors.forEach(v => {
      const c = v.country || 'Bénin';
      if (!countryMap[c]) {
        countryMap[c] = {
          country: c,
          countryCode: v.countryCode || 'BJ',
          flag: v.flag || '🇧🇯',
          count: 0,
          cities: new Set()
        };
      }
      countryMap[c].count += 1;
      if (v.city) countryMap[c].cities.add(v.city);
    });

    const byCountry = Object.values(countryMap)
      .map(c => ({
        country: c.country,
        countryCode: c.countryCode,
        flag: c.flag,
        count: c.count,
        percentage: Math.round((c.count / totalCount) * 100),
        cities: Array.from(c.cities)
      }))
      .sort((a, b) => b.count - a.count);

    // Group by device
    const deviceMap: Record<string, number> = {};
    activeVisitors.forEach(v => {
      const d = v.device || 'Desktop 💻';
      deviceMap[d] = (deviceMap[d] || 0) + 1;
    });

    const byDevice = Object.keys(deviceMap).map(d => ({
      device: d,
      count: deviceMap[d],
      percentage: Math.round((deviceMap[d] / totalCount) * 100)
    })).sort((a, b) => b.count - a.count);

    // Group by page
    const pageMap: Record<string, number> = {};
    activeVisitors.forEach(v => {
      const p = v.currentPath || '/';
      pageMap[p] = (pageMap[p] || 0) + 1;
    });

    const byPage = Object.keys(pageMap).map(p => ({
      path: p,
      count: pageMap[p],
      percentage: Math.round((pageMap[p] / totalCount) * 100)
    })).sort((a, b) => b.count - a.count);

    return {
      totalCount,
      visitors: activeVisitors.sort((a, b) => b.lastSeen - a.lastSeen),
      byCountry,
      byDevice,
      byPage
    };
  } catch {
    return {
      totalCount: 1,
      visitors: [],
      byCountry: [{ country: 'Bénin', countryCode: 'BJ', flag: '🇧🇯', count: 1, percentage: 100, cities: ['Cotonou'] }],
      byDevice: [{ device: 'Desktop 💻', count: 1, percentage: 100 }],
      byPage: [{ path: '/', count: 1, percentage: 100 }]
    };
  }
}

export function simulateAddLiveVisitor(targetCountry?: 'BJ' | 'FR' | 'BE' | 'OTHER') {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(HEARTBEAT_KEY);
    let heartbeats: Record<string, LiveVisitorSession> = raw ? JSON.parse(raw) : {};

    const mockLocations = {
      BJ: { country: 'Bénin', countryCode: 'BJ', flag: '🇧🇯', cities: ['Cotonou', 'Porto-Novo', 'Abomey-Calavi', 'Parakou'] },
      FR: { country: 'France', countryCode: 'FR', flag: '🇫🇷', cities: ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Toulouse'] },
      BE: { country: 'Belgique', countryCode: 'BE', flag: '🇧🇪', cities: ['Bruxelles', 'Liège', 'Anvers', 'Namur'] },
      OTHER: { country: 'Canada', countryCode: 'CA', flag: '🇨🇦', cities: ['Montréal', 'Québec', 'Toronto'] }
    };

    const choiceKey = targetCountry || (['BJ', 'FR', 'BE'][Math.floor(Math.random() * 3)] as 'BJ' | 'FR' | 'BE');
    const loc = mockLocations[choiceKey] || mockLocations.BJ;
    const city = loc.cities[Math.floor(Math.random() * loc.cities.length)];
    const devices = ['Mobile 📱', 'Desktop 💻', 'Tablette 📲'];
    const device = devices[Math.floor(Math.random() * devices.length)];
    const browsers = ['Google Chrome', 'Apple Safari', 'Mozilla Firefox'];
    const browser = browsers[Math.floor(Math.random() * browsers.length)];
    const paths = ['/', '/products', '/cart', '/products/nike-air-force-1-07', '/products/air-jordan-1-retro-high', '/checkout'];
    const currentPath = paths[Math.floor(Math.random() * paths.length)];

    let lastAction = 'Visite ' + currentPath;
    if (currentPath.startsWith('/products/')) lastAction = 'Consulte un modèle de sneakers';
    else if (currentPath === '/cart') lastAction = 'Vérifie son panier';
    else if (currentPath === '/checkout') lastAction = 'Finalise sa commande';
    else if (currentPath === '/') lastAction = 'Parcourt la page d\'accueil';

    const simId = 'vs_sim_' + Math.random().toString(36).substring(2, 7).toUpperCase();
    heartbeats[simId] = {
      sessionId: simId,
      lastSeen: Date.now() - Math.floor(Math.random() * 40 * 1000), // active within last 40 seconds
      country: loc.country,
      countryCode: loc.countryCode,
      flag: loc.flag,
      city,
      device,
      browser,
      currentPath,
      lastAction
    };

    localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(heartbeats));
  } catch (e) {
    console.error('Error simulating visitor:', e);
  }
}

export function clearSimulatedLiveVisitors() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(HEARTBEAT_KEY);
    if (!raw) return;
    let heartbeats: Record<string, LiveVisitorSession> = JSON.parse(raw);
    const clean: Record<string, LiveVisitorSession> = {};
    Object.keys(heartbeats).forEach(k => {
      if (!k.startsWith('vs_sim_')) {
        clean[k] = heartbeats[k];
      }
    });
    localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(clean));
  } catch (e) {
    console.error('Error clearing simulated visitors:', e);
  }
}

export function getLiveVisitorsCount(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const now = Date.now();
    const threeMinAgo = now - 3 * 60 * 1000;
    const raw = localStorage.getItem(HEARTBEAT_KEY);
    if (!raw) return 1;
    const heartbeats: Record<string, { lastSeen: number }> = JSON.parse(raw);
    const active = Object.values(heartbeats).filter(h => h.lastSeen > threeMinAgo);
    return Math.max(1, active.length);
  } catch {
    return 1;
  }
}

export function trackInternalEvent(
  type: InternalEventType,
  name: string,
  metadata?: Record<string, any>,
  userId?: string
) {
  if (typeof window === 'undefined') return;
  try {
    const sessionId = getVisitorSessionId();
    pingVisitorHeartbeat(userId);

    const event: InternalEvent = {
      id: 'ev_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      type,
      name,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
      path: window.location.pathname,
      boutique: 'Aymard Store',
      group: 'Boutique Principale',
      metadata
    };

    const raw = localStorage.getItem(STORAGE_KEY);
    const events: InternalEvent[] = raw ? JSON.parse(raw) : [];
    events.push(event);

    if (events.length > 5000) {
      events.splice(0, events.length - 5000);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Error saving internal event:', e);
  }
}

export function getInternalEvents(): InternalEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export interface AnalyticsFilterOptions {
  startDate?: string;
  endDate?: string;
  group?: string;
  boutique?: string;
  eventType?: string;
}

export function computeAnalyticsData(filters: AnalyticsFilterOptions = {}) {
  const events = getInternalEvents();

  const start = filters.startDate ? new Date(filters.startDate + 'T00:00:00') : new Date(Date.now() - 30 * 86400000);
  const end = filters.endDate ? new Date(filters.endDate + 'T23:59:59') : new Date();

  const filteredEvents = events.filter(e => {
    const date = new Date(e.timestamp);
    if (date < start || date > end) return false;
    if (filters.group && filters.group !== 'all' && e.group !== filters.group) return false;
    if (filters.boutique && filters.boutique !== 'all' && e.boutique !== filters.boutique) return false;
    if (filters.eventType && filters.eventType !== 'all' && e.type !== filters.eventType) return false;
    return true;
  });

  const uniqueSessions = new Set(filteredEvents.map(e => e.sessionId));
  const uniqueVisitorsCount = uniqueSessions.size;
  const totalEventsCount = filteredEvents.length;

  const purchaseEvents = filteredEvents.filter(e => e.type === 'purchase');
  const buyersSessions = new Set(purchaseEvents.map(e => e.sessionId));
  const buyersCount = buyersSessions.size;

  const conversionRate = uniqueVisitorsCount > 0 
    ? ((buyersCount / uniqueVisitorsCount) * 100).toFixed(1) 
    : '0';

  const funnelSteps = [
    { key: 'visitors', label: 'Visiteurs', tooltip: 'Nombre total de sessions uniques actives', color: '#6366f1' },
    { key: 'view_item', label: 'Vue Produit', tooltip: 'Visiteurs ayant consulté une fiche produit', color: '#818cf8' },
    { key: 'add_to_cart', label: 'Ajout Panier', tooltip: 'Visiteurs ayant ajouté un article au panier', color: '#a855f7' },
    { key: 'initiate_checkout', label: 'Début Paiement', tooltip: 'Visiteurs arrivés sur la page de paiement', color: '#c084fc' },
    { key: 'purchase', label: 'Achat', tooltip: 'Commandes créées avec succès', color: '#ec4899' },
    { key: 'payment_completed', label: 'Payé', tooltip: 'Paiements validés par le marchand ou en ligne', color: '#10b981' },
    { key: 'delivery', label: 'Livré', tooltip: 'Commandes réceptionnées et livrées', color: '#059669' },
  ];

  const sessionsPerStep: Record<string, number> = {
    visitors: uniqueVisitorsCount,
    view_item: new Set(filteredEvents.filter(e => e.type === 'view_item').map(e => e.sessionId)).size,
    add_to_cart: new Set(filteredEvents.filter(e => e.type === 'add_to_cart').map(e => e.sessionId)).size,
    initiate_checkout: new Set(filteredEvents.filter(e => e.type === 'initiate_checkout').map(e => e.sessionId)).size,
    purchase: buyersCount,
    payment_completed: new Set(filteredEvents.filter(e => e.type === 'payment_completed').map(e => e.sessionId)).size,
    delivery: new Set(filteredEvents.filter(e => e.type === 'delivery').map(e => e.sessionId)).size,
  };

  const funnel = funnelSteps.map((step, idx) => {
    const count = sessionsPerStep[step.key] || 0;
    const prevCount = idx === 0 ? count : (sessionsPerStep[funnelSteps[idx - 1].key] || 0);
    const dropoffPct = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
    const globalPct = uniqueVisitorsCount > 0 ? Math.round((count / uniqueVisitorsCount) * 100) : 0;

    return {
      ...step,
      count,
      pctOfPrevious: dropoffPct,
      pctOfGlobal: globalPct
    };
  });

  const stepRates = {
    viewProduct: sessionsPerStep.visitors > 0 ? Math.round((sessionsPerStep.view_item / sessionsPerStep.visitors) * 100) : 0,
    addToCart: sessionsPerStep.view_item > 0 ? Math.round((sessionsPerStep.add_to_cart / sessionsPerStep.view_item) * 100) : 0,
    checkout: sessionsPerStep.add_to_cart > 0 ? Math.round((sessionsPerStep.initiate_checkout / sessionsPerStep.add_to_cart) * 100) : 0,
    purchase: sessionsPerStep.initiate_checkout > 0 ? Math.round((sessionsPerStep.purchase / sessionsPerStep.initiate_checkout) * 100) : 0,
    paid: sessionsPerStep.purchase > 0 ? Math.round((sessionsPerStep.payment_completed / sessionsPerStep.purchase) * 100) : 0,
    delivered: sessionsPerStep.payment_completed > 0 ? Math.round((sessionsPerStep.delivery / sessionsPerStep.payment_completed) * 100) : 0,
  };

  const eventCounts: Record<string, { label: string; type: string; count: number }> = {};
  filteredEvents.forEach(ev => {
    const key = ev.type + '_' + ev.name;
    if (!eventCounts[key]) {
      eventCounts[key] = { label: ev.name || ev.type, type: ev.type, count: 0 };
    }
    eventCounts[key].count += 1;
  });

  const topEvents = Object.values(eventCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(ev => ({
      ...ev,
      percentage: totalEventsCount > 0 ? Math.round((ev.count / totalEventsCount) * 100) : 0
    }));

  const timelineMap: Record<string, number> = {};
  filteredEvents.forEach(ev => {
    const day = ev.timestamp.substring(0, 10);
    timelineMap[day] = (timelineMap[day] || 0) + 1;
  });

  const timeline = Object.keys(timelineMap).sort().map(day => ({
    date: day,
    count: timelineMap[day]
  }));

  return {
    uniqueVisitorsCount,
    totalEventsCount,
    conversionRate,
    buyersCount,
    funnel,
    stepRates,
    topEvents,
    timeline,
    liveVisitors: getLiveVisitorsCount()
  };
}
