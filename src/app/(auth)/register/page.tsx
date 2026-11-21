'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const { register, loginWithGoogle, error: authError, clearError } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!displayName.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      await register(email.trim(), password, displayName.trim());
      router.push(redirectPath);
    } catch (err: any) {
      setLocalError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    setSubmitting(true);
    try {
      await loginWithGoogle();
      router.push(redirectPath);
    } catch (err: any) {
      setLocalError(err.message || 'Google sign-in could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-7 bg-white p-8 sm:p-9 rounded-3xl border border-[#E2E8F0] shadow-card relative overflow-hidden">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#DC2626] mb-3 transition-colors font-label"
          >
            ← Back to Kravion Storefront
          </Link>
          <div>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-12 w-auto mb-2 hover:scale-105 transition-transform"
            >
              <img
                src="/logo.svg"
                alt="Kravion Auto"
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            Create Kravion Account
          </h2>
          <p className="text-xs text-slate-500 font-label">
            Join Kravion Auto to sync your garage vehicles, manage bespoke wishlists, and place concierge orders.
          </p>
        </div>

        {/* Error Banner */}
        {displayedError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-3 animate-in fade-in font-label">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{displayedError}</div>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label block">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Marcus Vance"
                className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label block">
              Password (Min 6 Characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-label block">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-[#DC2626] hover:bg-red-700 active:scale-[0.99] disabled:opacity-50 text-white font-extrabold uppercase text-xs tracking-wider transition-all flex items-center justify-center space-x-2 shadow-md shadow-red-500/20"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#E2E8F0] w-full" />
          <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-label font-bold">
            Or sign up with
          </span>
          <div className="border-t border-[#E2E8F0] w-full" />
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={submitting}
          className="w-full py-3 px-4 rounded-xl bg-white border border-[#E2E8F0] hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all flex items-center justify-center space-x-3 shadow-sm font-label"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign Up with Google</span>
        </button>

        {/* Footer Link */}
        <div className="text-center pt-2 font-label">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
              className="text-[#DC2626] hover:text-red-700 font-bold underline underline-offset-4 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center text-slate-500 text-xs font-label">Loading registration...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
