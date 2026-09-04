// In-memory server-side OTP Store for password resets
interface OtpEntry {
  code: string;
  expiresAt: number;
}

// Global OTP store surviving Next.js hot reloads in dev
const globalForOtp = global as unknown as { otpStore: Map<string, OtpEntry> };

export const otpStore = globalForOtp.otpStore || new Map<string, OtpEntry>();

if (process.env.NODE_ENV !== 'production') {
  globalForOtp.otpStore = otpStore;
}

/**
 * Save an OTP code for an email (valid 10 minutes)
 */
export function saveOtp(email: string, code: string): void {
  const normalizedEmail = email.toLowerCase().trim();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(normalizedEmail, { code, expiresAt });
}

/**
 * Verify an OTP code for an email
 */
export function checkOtp(email: string, code: string): { valid: boolean; message?: string } {
  const normalizedEmail = email.toLowerCase().trim();
  const entry = otpStore.get(normalizedEmail);

  if (!entry) {
    return { valid: false, message: 'Aucun code actif trouvé pour cet email. Veuillez redemander un code.' };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedEmail);
    return { valid: false, message: 'Ce code a expiré (validité 10 minutes). Veuillez en demander un nouveau.' };
  }

  if (entry.code.trim() !== code.trim()) {
    return { valid: false, message: 'Code de sécurité incorrect. Vérifiez votre boîte mail.' };
  }

  // Once verified, delete to prevent reuse
  otpStore.delete(normalizedEmail);
  return { valid: true };
}
