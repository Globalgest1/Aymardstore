'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from '@/lib/compat-navigation';
import { useAppStore, SupportChatMessage } from '@/lib/store';
import { useThemeMode } from '@/lib/useThemeMode';

export default function SupportChat() {
  const pathname = usePathname();
  const isDarkMode = useThemeMode();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [teaserDismissed, setTeaserDismissed] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedImage(result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const {
    user,
    orders,
    supportConversations,
    currentConversationId,
    startNewSupportConversation,
    sendSupportMessage,
    switchToHumanAgent
  } = useAppStore();

  useEffect(() => {
    setMounted(true);

    // Show proactive teaser after 2.2 seconds if not previously dismissed
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && !sessionStorage.getItem('aymard_chat_teaser_dismissed')) {
        setShowTeaser(true);
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const conv = supportConversations?.find(c => c.id === currentConversationId) || supportConversations?.[0];
  const messages: SupportChatMessage[] = conv?.messages || [];
  const isHumanAgent = conv?.status === 'PENDING_AGENT' || conv?.status === 'IN_PROGRESS' || (conv?.status as string) === 'LIVE_AGENT';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const handleOpenChat = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setShowTeaser(false);
      setUnreadCount(0);

      // Initialize session only if none exists yet
      if (typeof window !== 'undefined') {
        const activeId = useAppStore.getState().currentConversationId;
        const allConvs = useAppStore.getState().supportConversations || [];
        const found = allConvs.find(c => c.id === activeId);
        if (!activeId || !found) {
          startNewSupportConversation(user?.name, 'Conseil & Renseignements');
        }
      }

      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  };

  const dismissTeaser = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTeaser(false);
    setTeaserDismissed(true);
    try {
      sessionStorage.setItem('aymard_chat_teaser_dismissed', '1');
    } catch {}
  };

  // High-end human-like AI response engine tailored for luxury shopping
  const generateHumanResponse = (query: string, actionKey?: string) => {
    const q = query.toLowerCase().trim();

    // 1. Demande de parler à Aymard Store / un vrai humain / conseiller réel
    if (
      actionKey === 'human_agent' ||
      q.includes('vrai agent') ||
      q.includes('humain') ||
      q.includes('vrai') ||
      q.includes('conseiller') ||
      q.includes('aymard') ||
      q.includes('parler à quelqu') ||
      q.includes('responsable') ||
      q.includes('téléphone') ||
      q.includes('whatsapp')
    ) {
      switchToHumanAgent();
      return null;
    }

    // 2. Pointures / Tailles / Guide
    if (
      actionKey === 'sizes_help' ||
      q.includes('pointure') ||
      q.includes('taille') ||
      q.includes('chausse') ||
      q.includes('comment taille') ||
      q.includes('petit') ||
      q.includes('grand')
    ) {
      return {
        text: "**Conseil Pointure & Coupe personnalisé :**\n\n• **Sneakers (Nike, Adidas Spezial, Campus, Jordan)** : Nous vous conseillons de prendre votre pointure habituelle. Pour les modèles comme les *Yeezy* ou *Dunk SB*, si vous avez le pied fort, privilégiez une demi-pointure au-dessus.\n• **Vêtements & Maillots** : Coupe standard européenne. Si vous appréciez un style *oversize streetwear*, prenez une taille au-dessus de votre taille habituelle.\n\nSouhaitez-vous un conseil spécifique sur une paire du catalogue ?",
        options: [
          { label: 'Voir les nouveautés sneakers', action: 'go_products' },
          { label: 'Conseiller Aymard Store en direct', action: 'human_agent' }
        ]
      };
    }

    // 3. Suivi de commande & Colis
    if (
      actionKey === 'track_order' ||
      q.includes('commande') ||
      q.includes('suivi') ||
      q.includes('où est mon colis') ||
      q.includes('numéro') ||
      q.includes('aym-')
    ) {
      if (orders && orders.length > 0) {
        const lastOrder = orders[0];
        const statusLabel =
          lastOrder.status === 'PENDING'
            ? 'En cours de préparation soignée dans nos ateliers'
            : lastOrder.status === 'SHIPPED'
            ? 'Expédiée et en cours d\'acheminement express'
            : 'Livrée avec succès';
        return {
          text: `J'ai retrouvé votre dernière commande **N° ${lastOrder.orderNumber}** (${lastOrder.total.toLocaleString()} ${lastOrder.currency}) !\n\n**Statut actuel :** ${statusLabel}\n\nVous pouvez consulter le suivi étape par étape dans votre Espace Membre.`,
          options: [
            { label: 'Accéder à mon Espace Membre', action: 'go_account' },
            { label: 'Poser une question à l\'équipe', action: 'human_agent' }
          ]
        };
      }
      return {
        text: "Pour suivre votre commande, vous pouvez vous connecter à votre **Espace Membre** ou m'indiquer directement votre référence commençant par **AYM-**.",
        options: [
          { label: 'Accéder à mon compte', action: 'go_account' },
          { label: 'Demander à un conseiller', action: 'human_agent' }
        ]
      };
    }

    // 4. Paiement sécurisé & Moyens de règlement (LeekPay)
    if (
      actionKey === 'payment_plans' ||
      q.includes('paiement') ||
      q.includes('payer') ||
      q.includes('leekpay') ||
      q.includes('momo') ||
      q.includes('moov') ||
      q.includes('celtiis') ||
      q.includes('orange money') ||
      q.includes('wave') ||
      q.includes('carte') ||
      q.includes('visa') ||
      q.includes('mastercard')
    ) {
      return {
        text: "**Moyens de Paiement 100% Sécurisés (LeekPay) :**\n\nSur Aymard Store, réglez vos commandes en toute simplicité et sécurité :\n\n• **Mobile Money (Validation instantanée)** : MTN MoMo, Moov Money, Celtiis Cash, Orange Money, Wave.\n• **Cartes Bancaires** : Visa, Mastercard (chiffrement bancaire SSL).\n• **Paiement à la livraison** : Disponible sur tout le territoire béninois (Cotonou, Calavi, Porto-Novo, etc.).",
        options: [
          { label: 'Voir mon Panier', action: 'go_cart' },
          { label: 'Découvrir le Catalogue', action: 'go_products' }
        ]
      };
    }

    // 5. Authenticité & Retours
    if (
      actionKey === 'authenticity' ||
      q.includes('vrai') ||
      q.includes('faux') ||
      q.includes('authentique') ||
      q.includes('retour') ||
      q.includes('rembourse') ||
      q.includes('échange')
    ) {
      return {
        text: "**Authenticité 100% & Politique de Vente :**\n\n• Tous nos articles sont certifiés 100% neufs, d'origine et vérifiés avec rigueur par nos experts avant expédition.\n• **Important (Retours non acceptés)** : En raison du caractère exclusif et limité de nos pièces, **aucun retour ni échange n'est accepté**. Nous vous recommandons de bien vérifier votre pointure et votre taille avant de commander. Notre équipe reste à votre entière disposition pour tout conseil !",
        options: [
          { label: 'Conseils sur les pointures', action: 'sizes' },
          { label: 'Conseiller Aymard Store en direct', action: 'human_agent' },
          { label: 'Découvrir la collection', action: 'go_products' }
        ]
      };
    }

    // 6. Délais & Frais de livraison
    if (
      actionKey === 'shipping_info' ||
      q.includes('livraison') ||
      q.includes('délai') ||
      q.includes('frais de port') ||
      q.includes('combien de temps') ||
      q.includes('france') ||
      q.includes('afrique') ||
      q.includes('abidjan') ||
      q.includes('dakar') ||
      q.includes('paris')
    ) {
      return {
        text: "**Délais d'Expédition & Tarifs :**\n\n• **Préparation express** : Expédition sous 24h à 48h ouvrées avec numéro de tracking remis en direct.\n• **France & Europe** : 2 à 4 jours ouvrés.\n• **International & Afrique (Côte d'Ivoire, Sénégal, Cameroun, etc.)** : 3 à 6 jours ouvrés par transporteur sécurisé (DHL / Colissimo International).\n• **Livraison offerte** dès 180€ ou pour tous les membres Privilège VIP.",
        options: [
          { label: 'Comment payer en 3X ?', action: 'payment_plans' },
          { label: 'Contacter l\'équipe', action: 'human_agent' }
        ]
      };
    }

    // 7. Salutations et politesse
    if (q.includes('bonjour') || q.includes('salut') || q.includes('hello') || q.includes('bonsoir') || q.includes('merci')) {
      return {
        text: "C'est un plaisir d'échanger avec vous !\nComment puis-je vous être utile en ce moment ? Souhaitez-vous un renseignement sur nos articles ou être mis en relation avec l'équipe Aymard Store ?",
        options: [
          { label: 'Conseils pointures', action: 'sizes_help' },
          { label: 'Suivre ma commande', action: 'track_order' },
          { label: 'Conseiller Aymard Store en direct', action: 'human_agent' }
        ]
      };
    }

    // 8. Réponse générale naturelle et humaine
    return {
      text: `J'ai bien compris votre demande concernant : "${query}".\n\nPour vous donner la réponse la plus précise possible, je peux vous orienter ci-dessous ou vous mettre directement en relation avec un responsable de la boutique Aymard Store :`,
      options: [
        { label: 'Conseiller Aymard Store en direct', action: 'human_agent' },
        { label: 'WhatsApp Direct Aymard Store', action: 'open_whatsapp' },
        { label: 'Suivre ma commande', action: 'track_order' }
      ]
    };
  };

  const handleSend = (textToSend?: string, actionKey?: string, imageToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputVal).trim();
    const img = imageToSend || selectedImage;
    if (!text && !actionKey && !img) return;

    // Determine topic based on action
    let topicToSet: string | undefined = undefined;
    if (actionKey === 'sizes_help') topicToSet = '👟 Guide & Conseil Pointures';
    else if (actionKey === 'track_order') topicToSet = '📦 Suivi de Commande';
    else if (actionKey === 'payment_plans') topicToSet = '💳 Paiement 3X sans frais';
    else if (actionKey === 'authenticity') topicToSet = '💎 Authenticité & Politique Vente';
    else if (actionKey === 'human_agent') topicToSet = '👤 Demande Conseiller Aymard Store';
    else if (text) topicToSet = text.length > 35 ? text.slice(0, 35) + '...' : text;

    // Navigation actions
    if (actionKey === 'go_account') {
      window.location.href = '/account';
      return;
    }
    if (actionKey === 'go_cart') {
      window.location.href = '/cart';
      return;
    }
    if (actionKey === 'go_products' || actionKey === 'go_product') {
      window.location.href = '/products';
      return;
    }
    if (actionKey && (actionKey.startsWith('/') || actionKey.startsWith('http'))) {
      window.location.href = actionKey;
      return;
    }
    if (actionKey === 'open_whatsapp') {
      const msg = encodeURIComponent("Bonjour Aymard Store, je vous contacte depuis le site au sujet d'une commande / d'un article.");
      window.open(`https://wa.me/2290197362906?text=${msg}`, '_blank');
      return;
    }

    if (actionKey === 'human_agent') {
      switchToHumanAgent(currentConversationId, '👤 Demande Conseiller Aymard Store');
      return;
    }

    // 1. Enregistrer le message de l'utilisateur dans le store avec image
    const userMessageText = text || (img ? '📷 Photo envoyée pour analyse' : '');
    if (userMessageText || img) {
      sendSupportMessage(userMessageText, 'user', undefined, img || undefined, currentConversationId, topicToSet);
      setInputVal('');
      setSelectedImage(null);
    }

    // 2. Si on est en mode agent humain, le message est stocké pour l'admin
    if (isHumanAgent && !actionKey) {
      return;
    }

    // 3. Traiter la réponse du bot avec l'IA Gemini (et fallback local élégant)
    setIsTyping(true);

    const historyPayload = messages.slice(-6).map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text || ''
    }));

    (async () => {
      try {
        const response = await fetch('/api/support/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text || (img ? "Que pensez-vous de ce modèle sur la photo ? L'avez-vous en stock et quel est son tarif ?" : ''),
            image: img || null,
            history: historyPayload,
            country: useAppStore.getState().detectedLocationId || 'benin'
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.text) {
            setIsTyping(false);
            sendSupportMessage(data.text, 'bot', data.options, undefined, currentConversationId, topicToSet);
            return;
          }
        }
      } catch (err) {
        console.warn('[SupportChat] Erreur appel IA, bascule sur moteur local:', err);
      }

      // Fallback local en cas de coupure réseau ou indisponibilité API
      setIsTyping(false);
      const res = generateHumanResponse(text, actionKey);
      if (res) {
        sendSupportMessage(res.text, 'bot', res.options, undefined, currentConversationId, topicToSet);
      }
    })();
  };

  // Don't render until mounted or if inside admin
  if (!mounted) return null;
  if (pathname && pathname.startsWith('/admin')) return null;

  const isProductPage = Boolean(pathname && pathname.startsWith('/products/'));

  const chatContent = (
    <aside
      id="aymard-support-chat-root"
      aria-label="Support client et conciergerie Aymard Store"
      style={{
        position: 'fixed',
        bottom: isProductPage ? 'max(82px, calc(env(safe-area-inset-bottom, 20px) + 68px))' : 'max(20px, env(safe-area-inset-bottom, 20px))',
        right: 'max(16px, env(safe-area-inset-right, 16px))',
        zIndex: 9999,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
        transition: 'bottom 0.3s ease'
      }}
    >
      {/* 1. Proactive Teaser Toast */}
      {showTeaser && !isOpen && !teaserDismissed && (
        <div
          role="status"
          aria-live="polite"
          className="chat-teaser-bubble"
          onClick={handleOpenChat}
          style={{
            pointerEvents: 'auto',
            background: isDarkMode
              ? 'linear-gradient(135deg, #09090b 0%, #18181b 100%)'
              : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#09090b',
            padding: '12px 18px',
            borderRadius: '18px',
            boxShadow: isDarkMode
              ? '0 12px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(234, 179, 8, 0.35)'
              : '0 10px 28px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(234, 179, 8, 0.3)',
            border: isDarkMode
              ? '1px solid rgba(234, 179, 8, 0.4)'
              : '1px solid rgba(234, 179, 8, 0.45)',
            maxWidth: '290px',
            cursor: 'pointer',
            animation: 'slideUpFade 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.25s ease'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '15px',
              boxShadow: '0 2px 8px rgba(234, 179, 8, 0.3)'
            }}
          >
            ✨
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12.5px', fontWeight: 800, color: isDarkMode ? '#facc15' : '#b45309' }}>Besoin d'un conseil ?</div>
            <div style={{ fontSize: '11.5px', color: isDarkMode ? '#e4e4e7' : '#475569', marginTop: '2px', lineHeight: '1.35' }}>
              Alex & nos conseillers vous répondent en direct !
            </div>
          </div>
          <button
            onClick={dismissTeaser}
            aria-label="Fermer la notification"
            style={{
              background: 'transparent',
              border: 'none',
              color: isDarkMode ? '#a1a1aa' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px 4px',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Main Chat Window Popup */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fenêtre de discussion conciergerie Aymard Store"
          style={{
            pointerEvents: 'auto',
            width: 'min(460px, calc(100vw - 16px))',
            height: 'min(680px, calc(100dvh - 50px))',
            background: isDarkMode ? '#121215' : '#ffffff',
            borderRadius: '24px',
            boxShadow: isDarkMode
              ? '0 25px 60px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.08)'
              : '0 25px 60px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'scaleInChat 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0'
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
              color: '#ffffff',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(250, 204, 21, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  position: 'relative',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isHumanAgent
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #27272a 0%, #09090b 100%)',
                  color: isHumanAgent ? '#ffffff' : '#facc15',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  letterSpacing: '0.5px',
                  border: '1.5px solid rgba(250, 204, 21, 0.4)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                }}
              >
                AS
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-1px',
                    right: '-1px',
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '2px solid #09090b',
                    animation: 'livePulseDot 2s infinite ease-in-out'
                  }}
                />
              </div>

              <div>
                <div style={{ fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>
                  <span>{isHumanAgent ? 'Conseiller Aymard Store' : 'Concierge IA Aymard Store'}</span>
                  {!isHumanAgent && (
                    <span style={{ fontSize: '10px', background: 'rgba(234,179,8,0.2)', color: '#facc15', padding: '2px 6px', borderRadius: '6px', fontWeight: 700, border: '1px solid rgba(234,179,8,0.3)' }}>
                      ✨ IA Active
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                  <span>{isHumanAgent ? 'Conseiller VIP en direct' : 'Reconnaissance Photos & Catalogue • 24/7'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Start New Conversation Button */}
              <button
                onClick={() => {
                  startNewSupportConversation(user?.name, 'Nouvelle Demande Client');
                  setInputVal('');
                  setSelectedImage(null);
                }}
                aria-label="Nouvelle discussion"
                title="Démarrer une nouvelle discussion distincte"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '6px 11px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                <span>+ Nouveau</span>
              </button>

              {/* WhatsApp Shortcut */}
              <button
                onClick={() => handleSend(undefined, 'open_whatsapp')}
                aria-label="Contacter sur WhatsApp"
                title="Discuter directement sur WhatsApp"
                style={{
                  background: 'rgba(37, 211, 102, 0.15)',
                  border: '1px solid rgba(37, 211, 102, 0.3)',
                  color: '#25d366',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  padding: 0
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/>
                </svg>
              </button>

              {/* Close / Minimize button */}
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Fermer la discussion"
                title="Réduire le chat"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 700,
                  transition: 'background 0.2s ease',
                  padding: 0
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div
            style={{
              flex: 1,
              padding: '18px 16px',
              overflowY: 'auto',
              background: isDarkMode ? '#09090b' : '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {/* Context Badge with Topic and Date */}
            <div style={{ textAlign: 'center', margin: '2px 0 6px 0' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isDarkMode ? '#cbd5e1' : '#475569',
                  background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                  padding: '4px 14px',
                  borderRadius: '100px',
                  letterSpacing: '0.2px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  maxWidth: '90%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{conv?.topic || 'Conciergerie VIP'}</span>
                <span>•</span>
                <span style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>{conv?.createdAt || 'Aujourd\'hui'}</span>
              </span>
            </div>

            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '92%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      background: isUser
                        ? 'linear-gradient(135deg, #09090b 0%, #27272a 100%)'
                        : (isDarkMode ? '#18181b' : '#ffffff'),
                      color: isUser ? '#ffffff' : (isDarkMode ? '#f4f4f5' : '#0f172a'),
                      padding: '13px 17px',
                      borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      fontSize: '14px',
                      lineHeight: '1.55',
                      boxShadow: isUser
                        ? '0 4px 14px rgba(0,0,0,0.18)'
                        : '0 2px 10px rgba(0,0,0,0.05)',
                      border: isUser ? 'none' : (isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'),
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {/* Image Attachment inside Bubble */}
                    {m.image && (
                      <div style={{ marginBottom: m.text ? '8px' : '0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                        <img 
                          src={m.image} 
                          alt="Photo partagée" 
                          style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block', cursor: 'pointer', borderRadius: '10px' }}
                          onClick={() => window.open(m.image, '_blank')}
                          title="Cliquer pour agrandir la photo"
                        />
                      </div>
                    )}

                    {m.text && <div>{m.text}</div>}
                  </div>

                  <span style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px', padding: '0 4px' }}>
                    {m.time}
                  </span>

                  {/* Interactive Option Buttons */}
                  {m.options && m.options.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', width: '100%' }}>
                      {m.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if ((opt as any).url) {
                              window.location.href = (opt as any).url;
                              return;
                            }
                            handleSend(opt.label, opt.action);
                          }}
                          style={{
                            background: isDarkMode ? '#18181b' : '#ffffff',
                            border: isDarkMode ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid #e2e8f0',
                            borderRadius: '14px',
                            padding: '11px 16px',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: isDarkMode ? '#f4f4f5' : '#0f172a',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#eab308';
                            e.currentTarget.style.background = '#fffdfa';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <span>{opt.label}</span>
                          <span style={{ color: '#ca8a04', fontSize: '14px', fontWeight: 800 }}>→</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '10px 14px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  width: 'fit-content'
                }}
              >
                <span style={{ fontSize: '11px', color: '#64748b', marginRight: '4px' }}>Alex rédige</span>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ca8a04', animation: 'livePulseDot 1s infinite 0ms' }}></span>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ca8a04', animation: 'livePulseDot 1s infinite 200ms' }}></span>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ca8a04', animation: 'livePulseDot 1s infinite 400ms' }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Help Action Bar */}
          <div
            style={{
              padding: '8px 14px',
              background: isDarkMode ? '#121215' : '#ffffff',
              borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <button
              onClick={() => handleSend('Guide des pointures', 'sizes_help')}
              style={{ padding: '6px 12px', borderRadius: '100px', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', fontSize: '11.5px', fontWeight: 700, color: isDarkMode ? '#cbd5e1' : '#334155', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Pointures
            </button>
            <button
              onClick={() => handleSend('Suivre mon colis', 'track_order')}
              style={{ padding: '6px 12px', borderRadius: '100px', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', fontSize: '11.5px', fontWeight: 700, color: isDarkMode ? '#cbd5e1' : '#334155', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Suivi colis
            </button>
            <button
              onClick={() => handleSend('Paiement en plusieurs fois', 'payment_plans')}
              style={{ padding: '6px 12px', borderRadius: '100px', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', fontSize: '11.5px', fontWeight: 700, color: isDarkMode ? '#cbd5e1' : '#334155', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Paiement 3X
            </button>
            <button
              onClick={() => handleSend('Parler à un conseiller Aymard Store', 'human_agent')}
              style={{ padding: '6px 13px', borderRadius: '100px', border: '1px solid rgba(234,179,8,0.5)', background: isDarkMode ? 'rgba(234,179,8,0.15)' : 'rgba(254,240,138,0.25)', fontSize: '11.5px', fontWeight: 800, color: isDarkMode ? '#facc15' : '#ca8a04', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Conseiller en direct
            </button>
          </div>

          {/* Selected Image Preview Bar (if an image is selected) */}
          {selectedImage && (
            <div style={{ padding: '8px 14px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={selectedImage} alt="Aperçu" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                <span style={{ fontSize: '12px', color: '#0f172a', fontWeight: 600 }}>Image prête à être envoyée</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                style={{ background: 'rgba(239,68,68,0.12)', border: 'none', color: '#ef4444', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Retirer la photo"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputVal);
            }}
            style={{
              padding: '12px 14px',
              background: isDarkMode ? '#121215' : '#ffffff',
              borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {/* Hidden File Input for Image Upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />

            {/* Image Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Joindre une photo"
              title="Envoyer une photo ou capture d'article"
              style={{
                background: selectedImage ? 'rgba(234,179,8,0.15)' : (isDarkMode ? '#18181b' : '#f8fafc'),
                border: selectedImage ? '1.5px solid #eab308' : (isDarkMode ? '1px solid #27272a' : '1px solid #cbd5e1'),
                color: selectedImage ? '#ca8a04' : (isDarkMode ? '#a1a1aa' : '#64748b'),
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                padding: 0
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={selectedImage ? "Posez votre question sur cette photo..." : "Posez une question ou envoyez une photo d'article..."}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '10px 14px',
                borderRadius: '12px',
                border: isDarkMode ? '1px solid #27272a' : '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                color: isDarkMode ? '#ffffff' : '#0f172a',
                background: isDarkMode ? '#18181b' : '#ffffff'
              }}
            />
            <button
              type="submit"
              disabled={!inputVal.trim() && !selectedImage}
              aria-label="Envoyer le message"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: (inputVal.trim() || selectedImage)
                  ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'
                  : '#e2e8f0',
                color: '#ffffff',
                border: 'none',
                cursor: (inputVal.trim() || selectedImage) ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* 4. Floating Circular Chat Trigger Button (only visible when chat is closed) */}
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          aria-label="Ouvrir le support client Aymard Store"
          title="Support client & Conciergerie en direct"
          id="aymard-live-chat-btn"
          style={{
            position: 'relative',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: isDarkMode
              ? 'linear-gradient(135deg, #09090b 0%, #1c1917 100%)'
              : '#ffffff',
            border: isDarkMode
              ? '2px solid rgba(234, 179, 8, 0.9)'
              : '2px solid #eab308',
            boxShadow: isDarkMode
              ? '0 10px 28px rgba(0, 0, 0, 0.45), 0 0 15px rgba(234, 179, 8, 0.3)'
              : '0 8px 24px rgba(0, 0, 0, 0.12), 0 0 15px rgba(234, 179, 8, 0.35)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            padding: 0,
            margin: 0,
            outline: 'none',
            pointerEvents: 'auto',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'floatGlow 3s infinite ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = isDarkMode
              ? '0 14px 34px rgba(0, 0, 0, 0.55), 0 0 25px rgba(234, 179, 8, 0.5)'
              : '0 12px 30px rgba(0, 0, 0, 0.18), 0 0 20px rgba(234, 179, 8, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = isDarkMode
              ? '0 10px 28px rgba(0, 0, 0, 0.45), 0 0 15px rgba(234, 179, 8, 0.3)'
              : '0 8px 24px rgba(0, 0, 0, 0.12), 0 0 15px rgba(234, 179, 8, 0.35)';
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg 
              width="26" 
              height="26" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke={isDarkMode ? '#facc15' : '#ca8a04'} 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#10b981',
                border: isDarkMode ? '2px solid #09090b' : '2px solid #ffffff',
                boxShadow: '0 0 6px #10b981',
                animation: 'livePulseDot 2s infinite ease-in-out'
              }}
            />
          </div>

          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      )}
    </aside>
  );

  return createPortal(chatContent, document.body);
}
