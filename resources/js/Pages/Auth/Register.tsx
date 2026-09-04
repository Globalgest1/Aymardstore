'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from '@/lib/compat-navigation';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import Link from '@/lib/compat-link';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const { language, login, registerReferralSignup, brandSettings } = useAppStore();
  const { t } = useTranslation(language);

  // Google Sign-In Integration (Google Identity Services & OAuth)
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    if (!document.getElementById('google-gsi-client')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const googleObj = typeof window !== 'undefined' ? (window as any).google : undefined;
        if (googleObj?.accounts?.id) {
          googleObj.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        }
      };
      document.body.appendChild(script);
    } else {
      const googleObj = typeof window !== 'undefined' ? (window as any).google : undefined;
      if (googleObj?.accounts?.id) {
        googleObj.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    }
  }, []);

  const handleGoogleCredentialResponse = (response: any) => {
    if (!response?.credential) return;
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      const email = payload.email;
      const name = payload.name || payload.given_name || email.split('@')[0];

      const storedRef = typeof window !== 'undefined' ? (localStorage.getItem('aymard_referrer_code') || searchParams.get('ref')) : null;
      if (storedRef) {
        registerReferralSignup(email, storedRef);
      }

      if (email.toLowerCase() === 'judesinaberogui@gmail.com') {
        login(email, name, 'ADMIN', '+229 01 97 36 29 06');
        router.push('/admin');
      } else {
        login(email, name, 'CUSTOMER', '+229 01 97 36 29 06');
        router.push(redirectUrl || '/account');
      }
    } catch {
      setError('Erreur lors du traitement de l’inscription Google.');
    }
  };

  const handleGoogleSignUp = () => {
    setError('');
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Service de connexion Google temporairement indisponible.');
      return;
    }

    const googleObj = typeof window !== 'undefined' ? (window as any).google : undefined;
    if (googleObj?.accounts?.id) {
      googleObj.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const redirectUri = `${window.location.origin}/auth/register`;
          const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=openid%20email%20profile`;
          window.location.href = googleOAuthUrl;
        }
      });
    } else {
      const redirectUri = `${window.location.origin}/auth/register`;
      const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=openid%20email%20profile`;
      window.location.href = googleOAuthUrl;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    const storedRef = typeof window !== 'undefined' ? (localStorage.getItem('aymard_referrer_code') || searchParams.get('ref')) : null;
    if (storedRef) {
      registerReferralSignup(email, storedRef);
    }

    login(email, name, 'CUSTOMER', phone || '+229 01 97 36 29 06');
    const destination = redirectUrl || '/account';
    router.push(destination);
  };

  return (
    <div className="auth-page-container" style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0c',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 20px',
      fontFamily: 'var(--font-outfit), sans-serif',
      position: 'relative'
    }}>
      {/* Global CSS for Responsive Mobile & Desktop Layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        .auth-pro-input:-webkit-autofill,
        .auth-pro-input:-webkit-autofill:hover,
        .auth-pro-input:-webkit-autofill:focus,
        .auth-pro-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #0f0f13 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        @media (max-width: 768px) {
          .auth-page-container {
            padding: 24px 14px !important;
            background-image: linear-gradient(180deg, rgba(10, 10, 12, 0.78) 0%, rgba(10, 10, 12, 0.94) 100%), url(/auth_hero_sneakers.jpg) !important;
            background-size: cover !important;
            background-position: center !important;
            background-attachment: fixed !important;
          }
          .auth-main-card {
            background: rgba(17, 17, 21, 0.85) !important;
            backdrop-filter: blur(28px) !important;
            -webkit-backdrop-filter: blur(28px) !important;
            border-radius: 24px !important;
            border: 1px solid rgba(255, 255, 255, 0.14) !important;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8) !important;
            max-width: 480px !important;
          }
          .auth-hero-column {
            display: none !important;
          }
          .auth-form-column {
            padding: 32px 20px !important;
            background: transparent !important;
          }
        }

        @media (min-width: 769px) {
          .auth-page-container {
            background-color: #0a0a0c !important;
            background-image: radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.03) 0%, transparent 70%) !important;
          }
          .auth-main-card {
            background-color: #111115 !important;
          }
          .auth-hero-column {
            display: flex !important;
          }
        }
      `}} />

      {/* Main Luxury Split Card */}
      <div className="auth-main-card" style={{
        width: '100%',
        maxWidth: '1040px',
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#111115',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7)'
      }}>

        {/* LEFT COLUMN: Editorial Visual & Heritage */}
        <div className="auth-hero-column" style={{
          flex: '1 1 450px',
          position: 'relative',
          minHeight: '580px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px',
          backgroundImage: 'url(/auth_hero_sneakers.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          {/* Subtle Vignette */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10, 10, 12, 0.4) 0%, rgba(10, 10, 12, 0.7) 60%, rgba(10, 10, 12, 0.95) 100%)'
          }} />

          {/* Top Badge: Monochrome Certification */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(17, 17, 21, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '8px 16px',
            borderRadius: '100px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-outfit), sans-serif'
            }}>
              Nouveau Client
            </span>
          </div>

          {/* Bottom Statement */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              backgroundColor: 'rgba(15, 15, 19, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '18px',
              padding: '24px'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#10b981',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}>
                Espace Client
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#ffffff',
                lineHeight: '1.3',
                marginBottom: '8px',
                fontFamily: 'var(--font-plus-jakarta), sans-serif'
              }}>
                Commandes &amp; Suivi en Temps Réel
              </div>
              <p style={{
                fontSize: '13px',
                color: '#a1a1aa',
                margin: 0,
                lineHeight: '1.5'
              }}>
                En créant votre compte, bénéficiez de vos récapitulatifs d&apos;achats, de vos adresses enregistrées et du suivi sécurisé de livraison.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean Registration Form */}
        <div className="auth-form-column" style={{
          flex: '1 1 480px',
          padding: '48px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#111115'
        }}>
          {/* Header Navigation with Grand Original Aymard Store Logo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <Link 
              href="/" 
              style={{ 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center',
                transition: 'opacity 0.2s ease, transform 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.85';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <img 
                src={brandSettings?.logoUrl || "/logo.png"} 
                alt={`${brandSettings?.storeName || 'Aymard'} ${brandSettings?.storeSubtitle || 'Store'}`} 
                style={{
                  height: '72px',
                  width: 'auto',
                  maxWidth: '300px',
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)',
                  display: 'block'
                }}
              />
            </Link>

            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#94a3b8',
                textDecoration: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '7px 14px',
                borderRadius: '100px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <span>Retour à la boutique</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17l9.2-9.2M17 17V7H7"/>
              </svg>
            </Link>
          </div>

          {/* Cart Notice Banner */}
          {redirectUrl === '/cart' && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              borderRadius: '12px',
              fontSize: '13px',
              marginBottom: '20px',
              fontWeight: 600
            }}>
              Créez votre compte pour finaliser votre commande.
            </div>
          )}

          {/* Form Title & Subtitle */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{
              fontSize: '26px',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 6px 0',
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
              letterSpacing: '-0.3px'
            }}>
              Créer un compte
            </h1>
            <p style={{
              fontSize: '13.5px',
              color: '#a1a1aa',
              margin: 0,
              lineHeight: '1.4'
            }}>
              Renseignez vos coordonnées pour activer votre compte client.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              borderRadius: '12px',
              fontSize: '13px',
              marginBottom: '18px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Google Instant Sign-In */}
          <div style={{ marginBottom: '18px' }}>
            <button
              type="button"
              onClick={handleGoogleSignUp}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: '#18181d',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font-outfit), sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#202027';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#18181d';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"/>
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"/>
              </svg>
              <span>S&apos;inscrire avec Google</span>
            </button>
          </div>

          {/* Minimal Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '0 0 18px 0',
            color: '#71717a',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1px'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
            <span style={{ padding: '0 12px', textTransform: 'uppercase' }}>ou avec vos coordonnées</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Full Name */}
            <div>
              <label htmlFor="reg-name" style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#cbd5e1',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '6px'
              }}>
                Nom complet *
              </label>
              <input
                id="reg-name"
                type="text"
                placeholder="Ex: Jude Aymard"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-pro-input"
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: '#0c0c0f',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '0 16px',
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-outfit), sans-serif'
                }}
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="reg-email" style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#cbd5e1',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '6px'
              }}>
                Adresse email *
              </label>
              <input
                id="reg-email"
                type="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-pro-input"
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: '#0c0c0f',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '0 16px',
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-outfit), sans-serif'
                }}
              />
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="reg-phone" style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#cbd5e1',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '6px'
              }}>
                Téléphone (pour le suivi de livraison)
              </label>
              <input
                id="reg-phone"
                type="tel"
                placeholder="+229 01 97 36 29 06"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="auth-pro-input"
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: '#0c0c0f',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '0 16px',
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-outfit), sans-serif'
                }}
              />
            </div>

            {/* Passwords in Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="reg-password" style={{
                  display: 'block',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#cbd5e1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  marginBottom: '6px'
                }}>
                  Mot de passe *
                </label>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-pro-input"
                  style={{
                    width: '100%',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: '#0c0c0f',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '0 14px',
                    fontSize: '14px',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'var(--font-outfit), sans-serif'
                  }}
                />
              </div>

              <div>
                <label htmlFor="reg-confirmPassword" style={{
                  display: 'block',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#cbd5e1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  marginBottom: '6px'
                }}>
                  Confirmation *
                </label>
                <input
                  id="reg-confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="auth-pro-input"
                  style={{
                    width: '100%',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: '#0c0c0f',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '0 14px',
                    fontSize: '14px',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'var(--font-outfit), sans-serif'
                  }}
                />
              </div>
            </div>

            {/* Toggle show password */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="show-pass-reg"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#10b981' }}
              />
              <label htmlFor="show-pass-reg" style={{ fontSize: '12px', color: '#a1a1aa', cursor: 'pointer' }}>
                Afficher le mot de passe
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: 'none',
                color: '#000000',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '6px',
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font-outfit), sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e4e4e7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              Créer mon compte
            </button>
          </form>

          {/* Switch to Login */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            marginTop: '24px',
            paddingTop: '18px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#a1a1aa'
          }}>
            <span>Déjà inscrit ? </span>
            <Link
              href={redirectUrl ? `/auth/login?redirect=${encodeURIComponent(redirectUrl)}` : '/auth/login'}
              style={{ color: '#ffffff', fontWeight: 700, textDecoration: 'none', marginLeft: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Se connecter
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px 20px', color: '#ffffff', background: '#0a0a0c' }}>Chargement...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
