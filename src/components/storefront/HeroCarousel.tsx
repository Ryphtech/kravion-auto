'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CarouselPoster } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  Star,
  Truck,
  Headphones,
} from 'lucide-react';

interface HeroCarouselProps {
  posters: CarouselPoster[];
}

export function HeroCarousel({ posters }: HeroCarouselProps) {
  const [desktopIndex, setDesktopIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const activePosters = useMemo(() => posters.filter((p) => p.active !== false), [posters]);

  // Separate Desktop and Mobile Poster Collections
  const desktopPosters = useMemo(() => {
    const list = activePosters.filter(
      (p) => p.targetDevice === 'desktop' || p.targetDevice === 'all' || !p.targetDevice
    );
    return list.length > 0 ? list : activePosters;
  }, [activePosters]);

  const mobilePosters = useMemo(() => {
    const list = activePosters.filter(
      (p) => p.targetDevice === 'mobile' || p.targetDevice === 'all'
    );
    // If no mobile-specific slides configured yet, gracefully fallback to general active posters
    return list.length > 0 ? list : activePosters;
  }, [activePosters]);

  // Desktop navigation
  const nextDesktopSlide = useCallback(() => {
    if (desktopPosters.length > 0) {
      setDesktopIndex((prev) => (prev + 1) % desktopPosters.length);
    }
  }, [desktopPosters.length]);

  const prevDesktopSlide = useCallback(() => {
    if (desktopPosters.length > 0) {
      setDesktopIndex((prev) => (prev - 1 + desktopPosters.length) % desktopPosters.length);
    }
  }, [desktopPosters.length]);

  // Mobile navigation
  const nextMobileSlide = useCallback(() => {
    if (mobilePosters.length > 0) {
      setMobileIndex((prev) => (prev + 1) % mobilePosters.length);
    }
  }, [mobilePosters.length]);

  const prevMobileSlide = useCallback(() => {
    if (mobilePosters.length > 0) {
      setMobileIndex((prev) => (prev - 1 + mobilePosters.length) % mobilePosters.length);
    }
  }, [mobilePosters.length]);

  // Auto-advance desktop every 6.5s unless hovered
  useEffect(() => {
    if (desktopPosters.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setDesktopIndex((prev) => (prev + 1) % desktopPosters.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [desktopPosters.length, isPaused]);

  // Auto-advance mobile every 5.5s unless hovered/touched
  useEffect(() => {
    if (mobilePosters.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setMobileIndex((prev) => (prev + 1) % mobilePosters.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [mobilePosters.length, isPaused]);

  // Touch Swipe Handlers for mobile gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextMobileSlide();
    } else if (isRightSwipe) {
      prevMobileSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (activePosters.length === 0) return null;

  const currentDesktopPoster = desktopPosters[desktopIndex % desktopPosters.length];
  const currentMobilePoster = mobilePosters[mobileIndex % mobilePosters.length];

  return (
    <section
      className="relative w-full font-sans select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Hero Showcase"
    >
      {/* =========================================================================
          1. MOBILE VIEW (Shows ONLY the Image without text overlay on mobile)
             - Uses dedicated mobile hero carousel (mobilePosters)
             - Full, unobstructed automotive visual card with rounded bottom curve
             - Entire visual links to featured products
             - Centered slide indicators
             - Floating 3-stat white card beneath the image
         ========================================================================= */}
      <div className="sm:hidden w-full bg-[#F8FAFC]">
        {/* Main Rounded Hero Card: ONLY THE IMAGE (No text above image) */}
        {currentMobilePoster && (
          <Link
            href={currentMobilePoster.linkUrl || '/products'}
            className="relative block w-full h-[380px] rounded-b-[2.5rem] overflow-hidden bg-[#0A1A22] shadow-xl active:opacity-95 transition-opacity"
            aria-label={currentMobilePoster.title}
          >
            <div className="relative w-full h-full overflow-hidden" aria-hidden="true">
              {currentMobilePoster.imageUrl ? (
                <Image
                  src={currentMobilePoster.imageUrl}
                  alt={currentMobilePoster.title}
                  fill
                  priority
                  sizes="100vw"
                  className="w-full h-full object-cover object-center transition-all duration-700 ease-out"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0A1A22]" />
              )}
              {/* Subtle top shade so transparent navbar icons remain legible */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </Link>
        )}

        {/* Centered Slide Pagination Dots (Mobile) */}
        {mobilePosters.length > 1 && (
          <div className="flex items-center justify-center space-x-1.5 pt-3 pb-1">
            {mobilePosters.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setMobileIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  mobileIndex === idx
                    ? 'w-7 bg-[#DC2626]'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to mobile slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Floating 3-Pillar Stats Card Overlapping the Hero Card Bottom */}
        <div className="mx-4 mt-2 rounded-2xl bg-white border border-[#E2E8F0] shadow-card p-3 grid grid-cols-3 divide-x divide-slate-100 relative z-20">
          <div className="flex flex-col items-center text-center px-1">
            <div className="flex items-center space-x-1 text-[#DC2626] font-black text-xs sm:text-sm">
              <Truck className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Fast Delivery</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium font-label">Express Shipping</span>
          </div>
          <div className="flex flex-col items-center text-center px-1">
            <div className="flex items-center space-x-1 text-slate-800 font-black text-xs sm:text-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Quality Tested</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium font-label truncate max-w-full">
              100% Guaranteed
            </span>
          </div>
          <div className="flex flex-col items-center text-center px-1">
            <div className="flex items-center space-x-1 text-emerald-600 font-black text-xs sm:text-sm">
              <Headphones className="w-3.5 h-3.5 text-emerald-600" />
              <span>24*7 Support</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium font-label">Customer Support</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. DESKTOP VIEW (Cinematic Full-Width Showcase)
             - Uses dedicated desktop hero carousel (desktopPosters)
             - Hidden on mobile screens, full bleed on tablet & desktop
         ========================================================================= */}
      {currentDesktopPoster && (
        <div className="hidden sm:flex relative w-full min-h-[90vh] sm:min-h-screen overflow-hidden bg-[#0A1A22] text-white flex-col justify-end group">
          {/* Full-Bleed Visual */}
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden" aria-hidden="true">
            {currentDesktopPoster.imageUrl ? (
              <Image
                src={currentDesktopPoster.imageUrl}
                alt={currentDesktopPoster.title}
                fill
                priority
                sizes="100vw"
                className="w-full h-full object-cover object-center scale-105 animate-subtle-zoom transition-all duration-1000 ease-out"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0A1A22]" />
            )}
          </div>

          {/* Dual Gradients for Desktop */}
          <div
            className="absolute inset-0 z-[1] bg-gradient-to-r from-black/85 via-black/50 to-transparent sm:w-3/4"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 z-[1] bg-gradient-to-t from-[#0B1120] via-black/25 to-black/35"
            aria-hidden="true"
          />

          {/* Desktop Hero Content */}
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col justify-end min-h-[90vh] sm:min-h-screen pb-14 sm:pb-20 pt-32 sm:pt-44">
            <div key={desktopIndex} className="max-w-3xl space-y-4 sm:space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-label font-bold tracking-wider uppercase shadow-md">
                <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse"></span>
                <span>{currentDesktopPoster.tag || 'Precision Automotive Engineering'}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight uppercase leading-[1.05] drop-shadow-lg">
                {currentDesktopPoster.title}
              </h1>

              <p className="text-sm sm:text-lg text-slate-200 max-w-2xl font-label leading-relaxed drop-shadow">
                {currentDesktopPoster.subtitle}
              </p>

              <div className="pt-2 sm:pt-4 flex items-center gap-4">
                <Link
                  href={currentDesktopPoster.linkUrl || '/products'}
                  className="inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl bg-[#DC2626] hover:bg-red-700 hover:-translate-y-0.5 active:scale-95 text-white font-extrabold text-sm uppercase tracking-wider transition-all duration-200 ease-out shadow-xl shadow-red-600/30 hover:shadow-red-600/50 group/btn"
                >
                  <span>{currentDesktopPoster.buttonText || 'Explore Upgrades'}</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform duration-200 ease-out" />
                </Link>
              </div>
            </div>

            {/* Desktop Bottom Value Badges Strip */}
            <div className="mt-14 pt-6 border-t border-white/15 grid grid-cols-4 gap-4 text-slate-300 text-xs font-label">
              <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
                <Truck className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="font-semibold text-white truncate">Fast Delivery Worldwide</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="font-semibold text-white truncate">100% Quality Tested</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
                <Headphones className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-white truncate">24*7 Customer Support</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span className="font-semibold text-white truncate">Precision Verified Fitment</span>
              </div>
            </div>
          </div>

          {/* Desktop Controls */}
          {desktopPosters.length > 1 && (
            <>
              <button
                onClick={prevDesktopSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3.5 rounded-full bg-black/30 hover:bg-black/60 hover:scale-110 active:scale-95 backdrop-blur-md text-white border border-white/20 transition-all duration-200 ease-out opacity-0 group-hover:opacity-100 shadow-xl"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextDesktopSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3.5 rounded-full bg-black/30 hover:bg-black/60 hover:scale-110 active:scale-95 backdrop-blur-md text-white border border-white/20 transition-all duration-200 ease-out opacity-0 group-hover:opacity-100 shadow-xl"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Slide Progress Indicator Bars for Desktop */}
              <div className="absolute bottom-6 right-12 z-20 flex items-center space-x-2">
                {desktopPosters.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setDesktopIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      desktopIndex === idx
                        ? 'w-10 bg-[#DC2626] shadow-sm shadow-red-500'
                        : 'w-3 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to desktop slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
