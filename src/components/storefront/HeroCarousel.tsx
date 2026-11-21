'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CarouselPoster } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Wrench,
  CheckCircle2,
  MapPin,
  PhoneCall,
  Star,
  Award,
} from 'lucide-react';

interface HeroCarouselProps {
  posters: CarouselPoster[];
}

export function HeroCarousel({ posters }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const activePosters = posters.filter((p) => p.active !== false);
  const count = activePosters.length;

  const nextSlide = useCallback(() => {
    if (count > 0) {
      setCurrentIndex((prev) => (prev + 1) % count);
    }
  }, [count]);

  const prevSlide = useCallback(() => {
    if (count > 0) {
      setCurrentIndex((prev) => (prev - 1 + count) % count);
    }
  }, [count]);

  // Auto-advance every 6.5 seconds unless hovered
  useEffect(() => {
    if (count <= 1 || isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6500);
    return () => clearInterval(interval);
  }, [count, isPaused, nextSlide]);

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
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (count === 0) return null;

  const currentPoster = activePosters[currentIndex];

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
          1. MOBILE VIEW (Modeled directly after pexacare.com mobile hero)
             - Sleek rounded-bottom hero card (rounded-b-[2.5rem])
             - Top brand + Pan-India Concierge meta tags
             - Two-tier bold typography headline
             - Bullet points with icons (Carbon / Ambient / Exhaust)
             - Primary CTA button
             - Dark accent bottom ribbon with 3 micro-features
             - Sub-banner strip: Phone Number + WWW.KRAVIONAUTO.COM
             - Centered slide indicator dots
             - Floating 3-stat white card overlapping bottom (-mt-5)
         ========================================================================= */}
      <div className="sm:hidden w-full bg-[#F8FAFC]">
        {/* Main Rounded Hero Card */}
        <div className="relative w-full h-[470px] rounded-b-[2.5rem] overflow-hidden bg-[#0A1A22] text-white shadow-xl flex flex-col justify-between pt-24 pb-0">
          {/* Background Visual */}
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden" aria-hidden="true">
            {currentPoster.imageUrl ? (
              <Image
                src={currentPoster.imageUrl}
                alt={currentPoster.title}
                fill
                priority
                sizes="100vw"
                className="w-full h-full object-cover object-center scale-105 animate-subtle-zoom transition-all duration-700 ease-out"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0A1A22]" />
            )}
            {/* Dual gradient masks for crisp mobile contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-black/30" />
          </div>

          {/* Top Meta Header inside Slide */}
          <div className="relative z-10 px-4 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse"></span>
              <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">
                KRAVION AUTO
              </span>
            </div>
            <div className="flex items-center space-x-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-[10px] text-slate-200 shadow-sm">
              <MapPin className="w-3 h-3 text-red-400 shrink-0" />
              <span className="font-semibold uppercase tracking-wider">Pan-India Concierge</span>
            </div>
          </div>

          {/* Center Content: Headline, Feature Highlights & CTA */}
          <div key={currentIndex} className="relative z-10 px-4 space-y-2.5 animate-fade-in-up">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 font-label">
                {currentPoster.tag || 'BESPOKE AUTOMOTIVE STYLING'}
              </p>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-[1.1] drop-shadow-md">
                {currentPoster.title}
              </h1>
            </div>

            {/* Feature Bullets (Pexacare-style) */}
            <div className="space-y-1 text-slate-200 text-[11px] font-label">
              <div className="flex items-center space-x-1.5">
                <span className="text-red-400 font-bold text-xs">✦</span>
                <span className="truncate">Autoclave Toray T700 Dry Carbon</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-red-400 font-bold text-xs">✦</span>
                <span className="truncate">Bespoke 64-Color Dynamic Ambient Cockpit</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-red-400 font-bold text-xs">✦</span>
                <span className="truncate">Valvetronic Stainless & Titanium Exhausts</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-1 flex items-center space-x-2">
              <Link
                href={currentPoster.linkUrl || '/products'}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-red-600/40 transition-all"
              >
                <span>{currentPoster.buttonText || 'Explore Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/products?fitsGarage=true"
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md text-white border border-white/20 font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fitment</span>
              </Link>
            </div>
          </div>

          {/* Bottom Accent Ribbon (like Pexacare's 3-feature bottom strip) */}
          <div className="relative z-10 w-full bg-[#0F172A]/90 backdrop-blur-md border-t border-white/10 px-3 py-2 flex items-center justify-around text-[10px] text-slate-300">
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-red-400 shrink-0" />
              <span className="font-semibold text-white">100% CAD Fit</span>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <div className="flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="font-semibold text-white">2-Yr Guarantee</span>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="font-semibold text-white">Fast WhatsApp</span>
            </div>
          </div>
        </div>

        {/* Sub-Banner Strip: Contact & Brand URL (Pexacare-style) */}
        <div className="px-5 pt-3 pb-1 flex items-center justify-between text-[11px] font-bold text-slate-700 font-label">
          <a
            href="https://wa.me/1234567890?text=Hello%20Kravion%20Auto"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-[#DC2626] transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>+91 974 540 1234</span>
          </a>
          <span className="tracking-wider uppercase text-slate-500 text-[10px]">
            WWW.KRAVIONAUTO.COM
          </span>
        </div>

        {/* Centered Slide Pagination Dots (Pexacare-style) */}
        {count > 1 && (
          <div className="flex items-center justify-center space-x-1.5 py-1.5">
            {activePosters.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx
                    ? 'w-7 bg-[#DC2626]'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Floating 3-Pillar Stats Card Overlapping the Hero Card Bottom */}
        <div className="mx-4 mt-2 rounded-2xl bg-white border border-[#E2E8F0] shadow-card p-3 grid grid-cols-3 divide-x divide-slate-100 relative z-20">
          <div className="flex flex-col items-center text-center px-1">
            <div className="flex items-center space-x-1 text-[#DC2626] font-black text-sm">
              <Star className="w-3.5 h-3.5 fill-red-500 text-red-500" />
              <span>4.9/5</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium font-label">CAD Fitments</span>
          </div>
          <div className="flex flex-col items-center text-center px-1">
            <div className="flex items-center space-x-1 text-slate-800 font-black text-sm">
              <span>4 Marques</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium font-label truncate max-w-full">
              Audi · BMW · Benz
            </span>
          </div>
          <div className="flex flex-col items-center text-center px-1">
            <div className="flex items-center space-x-1 text-emerald-600 font-black text-sm">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium font-label">WhatsApp</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. DESKTOP VIEW (Cinematic Full-Width Showcase)
             - Hidden on mobile screens, full bleed on tablet & desktop
         ========================================================================= */}
      <div className="hidden sm:flex relative w-full min-h-[90vh] sm:min-h-screen overflow-hidden bg-[#0A1A22] text-white flex-col justify-end">
        {/* Full-Bleed Visual */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden" aria-hidden="true">
          {currentPoster.imageUrl ? (
            <Image
              src={currentPoster.imageUrl}
              alt={currentPoster.title}
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
          <div key={currentIndex} className="max-w-3xl space-y-4 sm:space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-label font-bold tracking-wider uppercase shadow-md">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse"></span>
              <span>{currentPoster.tag || 'Precision Automotive Engineering'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight uppercase leading-[1.05] drop-shadow-lg">
              {currentPoster.title}
            </h1>

            <p className="text-sm sm:text-lg text-slate-200 max-w-2xl font-label leading-relaxed drop-shadow">
              {currentPoster.subtitle}
            </p>

            <div className="pt-2 sm:pt-4 flex items-center gap-4">
              <Link
                href={currentPoster.linkUrl || '/products'}
                className="inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl bg-[#DC2626] hover:bg-red-700 hover:-translate-y-0.5 active:scale-95 text-white font-extrabold text-sm uppercase tracking-wider transition-all duration-200 ease-out shadow-xl shadow-red-600/30 hover:shadow-red-600/50 group/btn"
              >
                <span>{currentPoster.buttonText || 'Explore Upgrades'}</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform duration-200 ease-out" />
              </Link>
              <Link
                href="/products?fitsGarage=true"
                className="inline-flex items-center justify-center space-x-2 px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 hover:-translate-y-0.5 active:scale-95 backdrop-blur-md text-white border border-white/25 font-bold text-sm uppercase tracking-wider transition-all duration-200 ease-out shadow-md"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
                <span>Verify Fitment</span>
              </Link>
            </div>
          </div>

          {/* Desktop Bottom Value Badges Strip */}
          <div className="mt-14 pt-6 border-t border-white/15 grid grid-cols-4 gap-4 text-slate-300 text-xs font-label">
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span className="font-semibold text-white truncate">100% Precision CAD Fitment</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span className="font-semibold text-white truncate">Toray T700 Dry Carbon</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="font-semibold text-white truncate">Direct WhatsApp Concierge</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span className="font-semibold text-white truncate">Audi · BMW · Mercedes · Porsche</span>
            </div>
          </div>
        </div>

        {/* Desktop Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3.5 rounded-full bg-black/30 hover:bg-black/60 hover:scale-110 active:scale-95 backdrop-blur-md text-white border border-white/20 transition-all duration-200 ease-out opacity-0 group-hover:opacity-100 shadow-xl"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3.5 rounded-full bg-black/30 hover:bg-black/60 hover:scale-110 active:scale-95 backdrop-blur-md text-white border border-white/20 transition-all duration-200 ease-out opacity-0 group-hover:opacity-100 shadow-xl"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slide Progress Indicator Bars for Desktop */}
        {count > 1 && (
          <div className="absolute bottom-6 right-12 z-20 flex items-center space-x-2">
            {activePosters.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx
                    ? 'w-10 bg-[#DC2626] shadow-sm shadow-red-500'
                    : 'w-3 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
