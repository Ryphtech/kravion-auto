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
      className="relative w-full min-h-[90vh] sm:min-h-screen overflow-hidden bg-[#0A1A22] text-white flex flex-col justify-end font-sans group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Hero Showcase"
    >
      {/* 1. Full-Bleed Edge-to-Edge High-Resolution Visual */}
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

      {/* 2. Cinematic Dual Gradient Overlays for High Legibility & Depth */}
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-r from-black/85 via-black/50 to-transparent sm:w-3/4"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-t from-[#0B1120] via-black/25 to-black/35"
        aria-hidden="true"
      />

      {/* 3. Hero Content Container */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col justify-end min-h-[90vh] sm:min-h-screen pb-14 sm:pb-20 pt-32 sm:pt-44">
        <div key={currentIndex} className="max-w-3xl space-y-4 sm:space-y-6 animate-fade-in-up">
          {/* Tag Pill with Live Glowing Accent */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-label font-bold tracking-wider uppercase shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse"></span>
            <span>{currentPoster.tag || 'Precision Automotive Engineering'}</span>
          </div>

          {/* Grand Cinematic Typography */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight uppercase leading-[1.05] drop-shadow-lg">
            {currentPoster.title}
          </h1>

          {/* Descriptive Subtitle */}
          <p className="text-sm sm:text-lg text-slate-200 max-w-2xl font-label leading-relaxed drop-shadow">
            {currentPoster.subtitle}
          </p>

          {/* Action CTAs */}
          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <Link
              href={currentPoster.linkUrl || '/products'}
              className="inline-flex items-center justify-center space-x-2 px-7 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-[#DC2626] hover:bg-red-700 hover:-translate-y-0.5 active:scale-95 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 ease-out shadow-xl shadow-red-600/30 hover:shadow-red-600/50 group/btn"
            >
              <span>{currentPoster.buttonText || 'Explore Upgrades'}</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform duration-200 ease-out" />
            </Link>
            <Link
              href="/products?fitsGarage=true"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 sm:px-7 sm:py-4 rounded-2xl bg-white/10 hover:bg-white/20 hover:-translate-y-0.5 active:scale-95 backdrop-blur-md text-white border border-white/25 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 ease-out shadow-md"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
              <span>Verify Fitment</span>
            </Link>
          </div>
        </div>

        {/* 4. Bottom Value Badges Strip (Inspired by Reference Architecture) */}
        <div className="mt-10 sm:mt-14 pt-6 border-t border-white/15 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-slate-300 text-xs font-label">
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

      {/* 5. Left / Right Glassy Carousel Controls */}
      <div className="hidden sm:block">
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
      </div>

      {/* 6. Slide Progress Indicator Bars */}
      {count > 1 && (
        <div className="absolute bottom-6 right-6 sm:right-12 z-20 flex items-center space-x-2">
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
    </section>
  );
}
