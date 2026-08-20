'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  // Forgot Password Flow State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'reset' | 'success'>('request');
  const [inputCode, setInputCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Page Transition Splash Screen states
  const [splashVisible, setSplashVisible] = useState(false);
  const [splashActive, setSplashActive] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock scroll during transition animation
  useEffect(() => {
    if (splashVisible) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [splashVisible]);

  const { language, login, merchantSettings } = useAppStore();
  const { t } = useTranslation(language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez renseigner votre adresse email et votre mot de passe.');
      return;
    }

    setSplashVisible(true);
    setTimeout(() => {
      setSplashActive(true);
    }, 40);

    setTimeout(() => {
      let destination = redirectUrl || '/account';

      // Check Admin account
      if (email === 'judesinaberogui@gmail.com' && password === 'Mercredi12@') {
        login(email, 'Judesinaberogui', 'ADMIN', '+229 01 97 36 29 06');
        destination = '/admin';
      } else {
        // Customer login
        login(email, email.split('@')[0], 'CUSTOMER', '+229 01 97 36 29 06');
      }

      router.push(destination);

      setTimeout(() => {
        setSplashActive(false);
        setTimeout(() => {
          setSplashVisible(false);
        }, 600);
      }, 350);
    }, 1600);
  };

  // Google Sign-In Integration (Google Identity Services & OAuth)
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    // Load Google GSI Script if not present
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

    // Handle OAuth redirect token in URL hash
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
          .then(res => res.json())
          .then(userInfo => {
            if (userInfo?.email) {
              const email = userInfo.email;
              const name = userInfo.name || email.split('@')[0];
              if (email.toLowerCase() === 'judesinaberogui@gmail.com') {
                login(email, name, 'ADMIN', '+229 01 97 36 29 06');
                router.push('/admin');
              } else {
                login(email, name, 'CUSTOMER', '+229 01 97 36 29 06');
                router.push(redirectUrl || '/account');
              }
            }
          })
          .catch(() => {});
      }
    }
  }, [redirectUrl, login, router]);

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

      setSplashVisible(true);
      setTimeout(() => setSplashActive(true), 40);

      setTimeout(() => {
        let destination = redirectUrl || '/account';
        if (email.toLowerCase() === 'judesinaberogui@gmail.com') {
          login(email, name, 'ADMIN', '+229 01 97 36 29 06');
          destination = '/admin';
        } else {
          login(email, name, 'CUSTOMER', '+229 01 97 36 29 06');
        }
        router.push(destination);
        setTimeout(() => {
          setSplashActive(false);
          setTimeout(() => setSplashVisible(false), 600);
        }, 350);
      }, 1200);
    } catch {
      setError('Erreur lors du traitement de la connexion Google.');
    }
  };

  const handleGoogleSignIn = () => {
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
          const redirectUri = `${window.location.origin}/auth/login`;
          const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=openid%20email%20profile`;
          window.location.href = googleOAuthUrl;
        }
      });
    } else {
      const redirectUri = `${window.location.origin}/auth/login`;
      const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=openid%20email%20profile`;
      window.location.href = googleOAuthUrl;
    }
  };

  const [sendingEmail, setSendingEmail] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Step 1: Send 6-digit Code to Email via API
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail) {
      setForgotError('Veuillez saisir votre adresse email.');
      return;
    }

    setSendingEmail(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: forgotEmail,
          resendApiKey: merchantSettings?.resendApiKey 
        })
      });
      const data = await res.json();
      if (data.success) {
        setInputCode('');
        setForgotMsg(`Un code de sécurité à 6 chiffres a été envoyé à ${forgotEmail}.`);
        setForgotStep('verify');
      } else {
        setForgotError(data.error || 'Erreur lors de l’envoi du code.');
      }
    } catch {
      setForgotError('Erreur de communication avec le serveur.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Step 2: Verify Code with Server-Side OTP Store
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!inputCode || inputCode.length < 6) {
      setForgotError('Veuillez saisir le code à 6 chiffres.');
      return;
    }

    setVerifyingCode(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, code: inputCode })
      });
      const data = await res.json();
      if (data.success) {
        setForgotMsg('Code vérifié avec succès. Définissez votre nouveau mot de passe.');
        setForgotStep('reset');
      } else {
        setForgotError(data.error || 'Code de sécurité invalide. Veuillez vérifier vos emails.');
      }
    } catch {
      setForgotError('Erreur lors de la validation du code.');
    } finally {
      setVerifyingCode(false);
    }
  };

  // Step 3: Save New Password
  const handleForgotSubmitNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!newPassword || !confirmNewPassword) {
      setForgotError('Veuillez renseigner tous les champs.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setForgotStep('success');
    setEmail(forgotEmail);
    setPassword(newPassword);
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
        maxWidth: '1020px',
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#111115',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7)'
      }}>

        {/* LEFT COLUMN: Editorial Visual & Heritage (Desktop Only) */}
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
              Authenticité Certifiée
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
                Aymard Store
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#ffffff',
                lineHeight: '1.3',
                marginBottom: '8px',
                fontFamily: 'var(--font-plus-jakarta), sans-serif'
              }}>
                Paires Rares &amp; Haute Couture
              </div>
              <p style={{
                fontSize: '13px',
                color: '#a1a1aa',
                margin: 0,
                lineHeight: '1.5'
              }}>
                Chaque pièce est rigoureusement vérifiée par nos experts avant conditionnement sécurisé et expédition express.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean Minimalist Login Form */}
        <div className="auth-form-column" style={{
          flex: '1 1 470px',
          padding: '48px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#111115'
        }}>
          {/* Header Navigation with Grand Original Aymard Store Logo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
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
                src="/logo.png" 
                alt="Aymard Store" 
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
              marginBottom: '24px',
              fontWeight: 600
            }}>
              Connectez-vous pour finaliser votre commande.
            </div>
          )}

          {/* Form Title & Subtitle */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{
              fontSize: '26px',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 6px 0',
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
              letterSpacing: '-0.3px'
            }}>
              Connexion
            </h1>
            <p style={{
              fontSize: '13.5px',
              color: '#a1a1aa',
              margin: 0,
              lineHeight: '1.4'
            }}>
              Accédez à votre espace client et au suivi de vos livraisons.
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
              marginBottom: '20px',
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
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
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
              <span>Continuer avec Google</span>
            </button>
          </div>

          {/* Minimal Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '0 0 22px 0',
            color: '#71717a',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1px'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
            <span style={{ padding: '0 12px', textTransform: 'uppercase' }}>ou avec votre email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#cbd5e1',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '6px'
              }}>
                Adresse email
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '16px', color: '#71717a', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-pro-input"
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#0c0c0f',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '0 16px 0 46px',
                    fontSize: '14px',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    fontFamily: 'var(--font-outfit), sans-serif'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.backgroundColor = '#0e0e12';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.backgroundColor = '#0c0c0f';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#cbd5e1',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '6px'
              }}>
                Mot de passe
              </label>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '16px', color: '#71717a', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-pro-input"
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#0c0c0f',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '0 46px 0 46px',
                    fontSize: '14px',
                    color: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    fontFamily: 'var(--font-outfit), sans-serif'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.backgroundColor = '#0e0e12';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.backgroundColor = '#0c0c0f';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    background: 'none',
                    border: 'none',
                    color: '#71717a',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2px 0 4px 0' }}>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    accentColor: '#10b981',
                    cursor: 'pointer'
                  }}
                />
                <span style={{
                  fontSize: '12.5px',
                  color: '#cbd5e1',
                  fontWeight: 600,
                  fontFamily: 'var(--font-outfit), sans-serif'
                }}>
                  Garder ma session active
                </span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setForgotError('');
                  setForgotMsg('');
                  setForgotEmail(email);
                  setForgotStep('request');
                  setShowForgotModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  color: '#10b981',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-outfit), sans-serif'
                }}
              >
                Mot de passe oublié ?
              </button>
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
                marginTop: '8px',
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
              Se connecter
            </button>
          </form>

          {/* Switch to Register */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            marginTop: '28px',
            paddingTop: '20px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#a1a1aa'
          }}>
            <span>Pas encore de compte ? </span>
            <Link
              href={redirectUrl ? `/auth/register?redirect=${encodeURIComponent(redirectUrl)}` : '/auth/register'}
              style={{ color: '#ffffff', fontWeight: 700, textDecoration: 'none', marginLeft: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Créer un compte
            </Link>
          </div>
        </div>

      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'var(--font-outfit), sans-serif'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: '#111115',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            position: 'relative'
          }}>
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              style={{
                position: 'absolute',
                right: '18px',
                top: '18px',
                background: 'none',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#71717a'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Step 1: Request Email */}
            {forgotStep === 'request' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
                  Réinitialisation du mot de passe
                </h3>
                <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                  Saisissez votre adresse email pour recevoir un code de sécurité à 6 chiffres.
                </p>

                {forgotError && (
                  <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', borderRadius: '10px', fontSize: '12.5px', marginBottom: '16px' }}>
                    {forgotError}
                  </div>
                )}

                <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                      Adresse email
                    </label>
                    <input
                      type="email"
                      placeholder="nom@exemple.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="auth-pro-input"
                      style={{
                        width: '100%',
                        height: '46px',
                        borderRadius: '10px',
                        backgroundColor: '#0c0c0f',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        padding: '0 14px',
                        fontSize: '14px',
                        color: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingEmail}
                    style={{
                      width: '100%',
                      height: '46px',
                      borderRadius: '10px',
                      backgroundColor: '#ffffff',
                      border: 'none',
                      color: '#000000',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: sendingEmail ? 'not-allowed' : 'pointer',
                      marginTop: '4px',
                      fontFamily: 'var(--font-outfit), sans-serif'
                    }}
                  >
                    {sendingEmail ? 'Envoi en cours...' : 'Envoyer le code de sécurité'}
                  </button>
                </form>

                {/* Direct Concierge Contact */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
                  <a
                    href="https://wa.me/2290197362906?text=Bonjour,%20j'ai%20besoin%20d'aide%20pour%20mon%20compte%20Aymard%20Store."
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '12px', color: '#10b981', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Assistance Client WhatsApp (+229 01 97 36 29 06)
                  </a>
                </div>
              </div>
            )}

            {/* Step 2: Verify 6-digit Code */}
            {forgotStep === 'verify' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
                  Vérification du code
                </h3>
                <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                  Un code de sécurité à 6 chiffres a été envoyé à <strong>{forgotEmail}</strong>.
                </p>

                {forgotError && (
                  <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', borderRadius: '10px', fontSize: '12.5px', marginBottom: '16px' }}>
                    {forgotError}
                  </div>
                )}

                <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                      Code à 6 chiffres
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                      required
                      className="auth-pro-input"
                      style={{
                        width: '100%',
                        height: '48px',
                        borderRadius: '10px',
                        backgroundColor: '#0c0c0f',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        padding: '0 14px',
                        fontSize: '20px',
                        letterSpacing: '6px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifyingCode}
                    style={{
                      width: '100%',
                      height: '46px',
                      borderRadius: '10px',
                      backgroundColor: '#ffffff',
                      border: 'none',
                      color: '#000000',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: verifyingCode ? 'not-allowed' : 'pointer',
                      marginTop: '4px'
                    }}
                  >
                    {verifyingCode ? 'Vérification...' : 'Valider le code'}
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setForgotStep('request')}
                      style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Changer d&apos;email
                    </button>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Renvoyer un code
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Enter New Password */}
            {forgotStep === 'reset' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
                  Nouveau mot de passe
                </h3>
                <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 16px 0' }}>
                  Définissez un nouveau mot de passe sécurisé (6 caractères minimum).
                </p>

                {forgotError && (
                  <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', borderRadius: '10px', fontSize: '12.5px', marginBottom: '16px' }}>
                    {forgotError}
                  </div>
                )}

                <form onSubmit={handleForgotSubmitNewPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      placeholder="Minimum 6 caractères"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="auth-pro-input"
                      style={{
                        width: '100%',
                        height: '46px',
                        borderRadius: '10px',
                        backgroundColor: '#0c0c0f',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        padding: '0 14px',
                        fontSize: '14px',
                        color: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      className="auth-pro-input"
                      style={{
                        width: '100%',
                        height: '46px',
                        borderRadius: '10px',
                        backgroundColor: '#0c0c0f',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        padding: '0 14px',
                        fontSize: '14px',
                        color: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      height: '46px',
                      borderRadius: '10px',
                      backgroundColor: '#ffffff',
                      border: 'none',
                      color: '#000000',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: '4px'
                    }}
                  >
                    Enregistrer le mot de passe
                  </button>
                </form>
              </div>
            )}

            {/* Step 4: Success Confirmation */}
            {forgotStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: '#10b981'
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
                  Mot de passe mis à jour
                </h3>
                <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                  Votre mot de passe a été modifié avec succès. Vous pouvez à présent vous connecter.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  style={{
                    width: '100%',
                    height: '46px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    border: 'none',
                    color: '#000000',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Continuer vers la connexion
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Splash Screen */}
      {mounted && splashVisible && createPortal(
        <div 
          id="aymard-auth-splash-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100dvh',
            minHeight: '100vh',
            background: splashActive ? 'rgba(9, 9, 11, 0.98)' : 'rgba(9, 9, 11, 0)',
            backdropFilter: splashActive ? 'blur(25px)' : 'blur(0px)',
            WebkitBackdropFilter: splashActive ? 'blur(25px)' : 'blur(0px)',
            zIndex: 2147483647,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            opacity: splashActive ? 1 : 0,
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'all'
          }}
        >
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px' }}>
            <img 
              src="/logo.png" 
              alt="Aymard Store" 
              style={{
                width: '240px',
                maxWidth: '80vw',
                height: 'auto',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)'
              }}
            />
            <div style={{
              width: '140px',
              height: '2px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              marginTop: '24px',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '2px'
            }}>
              <div style={{
                position: 'absolute',
                height: '100%',
                width: '70px',
                background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                animation: 'splashBarScan 1.3s infinite ease-in-out'
              }} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px 20px', color: '#ffffff', background: '#0a0a0c' }}>Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}
