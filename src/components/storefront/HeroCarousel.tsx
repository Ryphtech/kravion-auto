'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CarouselPoster } from '@/types';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

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

  // Auto-advance every 6 seconds unless hovered
  useEffect(() => {
    if (count <= 1 || isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [count, isPaused, nextSlide]);

  // Touch Swipe Handlers
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
      className="relative w-full rounded-3xl overflow-hidden border border-[#E2E8F0] bg-[#0F172A] shadow-card-hover group font-sans"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Hero Carousel"
    >
      {/* High-Resolution Automotive Slide Background */}
      <div className="relative w-full h-[400px] sm:h-[480px] lg:h-[540px]">
        {currentPoster.imageUrl ? (
          <Image
            src={currentPoster.imageUrl}
            alt={currentPoster.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center transition-all duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A]" />
        )}

        {/* Sophisticated Dual Gradient Mask for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/90 via-[#0F172A]/60 to-transparent sm:w-3/4" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-black/20" />

        {/* Slide Content Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end sm:justify-center p-6 sm:p-12 lg:p-16 max-w-3xl">
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Tag Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-label font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse"></span>
              <span>{currentPoster.tag || 'Bespoke Upgrade'}</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {currentPoster.title}
            </h1>

            {/* Subtitle / Description */}
            <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed font-label font-normal">
              {currentPoster.subtitle}
            </p>

            {/* Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href={currentPoster.linkUrl || '/products'}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-red-500/30 group/btn"
              >
                <span>Explore Upgrades</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/products?fitsGarage=true"
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 font-bold text-xs uppercase tracking-wider transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verify Fitment</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel Arrow Navigation */}
        {count > 1 && (
          <div className="hidden sm:flex absolute right-6 bottom-6 z-20 items-center space-x-2">
            <button
              onClick={prevSlide}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition-all shadow-sm"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition-all shadow-sm"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Slide Dots Indicator */}
        {count > 1 && (
          <div className="absolute bottom-4 left-6 sm:left-12 z-20 flex items-center space-x-2">
            {activePosters.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx
                    ? 'w-8 bg-[#DC2626]'
                    : 'w-2 bg-white/40 hover:bg-white/70'
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
