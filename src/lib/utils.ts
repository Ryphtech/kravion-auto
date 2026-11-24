import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = '₹'): string {
  return `${currency}${price.toFixed(2)}`;
}

export function formatCurrency(
  amount?: number | null,
  currency: string = '₹'
): string {
  const safeAmount =
    typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `${currency}${safeAmount.toFixed(2)}`;
}

export function formatAuthError(err: any): string {
  if (!err) return 'Authentication failed. Please verify your credentials and try again.';

  const code = (err.code || '').toLowerCase();
  const rawMsg = (typeof err === 'string' ? err : err.message || '').toLowerCase();

  // Invalid credentials / wrong password / user not found
  if (
    code.includes('invalid-credential') ||
    code.includes('wrong-password') ||
    code.includes('user-not-found') ||
    rawMsg.includes('invalid-credential') ||
    rawMsg.includes('wrong-password') ||
    rawMsg.includes('user-not-found')
  ) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }

  // Account already exists
  if (
    code.includes('email-already-in-use') ||
    rawMsg.includes('email-already-in-use')
  ) {
    return 'An account with this email address already exists. Please sign in instead.';
  }

  // Weak password
  if (
    code.includes('weak-password') ||
    rawMsg.includes('weak-password')
  ) {
    return 'Password must be at least 6 characters long.';
  }

  // Invalid email format
  if (
    code.includes('invalid-email') ||
    rawMsg.includes('invalid-email')
  ) {
    return 'Please enter a valid email address.';
  }

  // Rate limiting / too many attempts
  if (
    code.includes('too-many-requests') ||
    rawMsg.includes('too-many-requests')
  ) {
    return 'Access temporarily paused due to multiple unsuccessful attempts. Please try again in a few minutes.';
  }

  // Network connection error
  if (
    code.includes('network-request-failed') ||
    rawMsg.includes('network-request-failed') ||
    rawMsg.includes('network error')
  ) {
    return 'Unable to reach the authentication service. Please check your network connection and try again.';
  }

  // Popup closed or cancelled
  if (
    code.includes('popup-closed-by-user') ||
    rawMsg.includes('popup-closed-by-user')
  ) {
    return 'Sign-in window was closed before completing verification.';
  }

  // Popup blocked by browser
  if (
    code.includes('popup-blocked') ||
    rawMsg.includes('popup-blocked')
  ) {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
  }

  // Account disabled
  if (
    code.includes('user-disabled') ||
    rawMsg.includes('user-disabled')
  ) {
    return 'This account has been deactivated. Please contact customer support.';
  }

  // If the error message is clean and does NOT contain 'firebase', 'auth/', or technical code
  if (
    err.message &&
    !rawMsg.includes('firebase') &&
    !rawMsg.includes('auth/') &&
    !rawMsg.includes('code:') &&
    !rawMsg.includes('api key') &&
    !rawMsg.includes('error (')
  ) {
    return err.message;
  }

  return 'Authentication failed. Please verify your credentials and try again.';
}
