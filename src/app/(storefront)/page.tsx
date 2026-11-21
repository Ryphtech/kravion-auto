import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  getProducts,
  getCategories,
  getVehicles,
  getPosters,
} from '@/lib/data-service';
import { HeroCarousel } from '@/components/storefront/HeroCarousel';
import { ProductCard } from '@/components/storefront/ProductCard';
import { FeaturedScrollStack } from '@/components/storefront/FeaturedScrollStack';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Layers,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const MAKE_DETAILS: Record<
  string,
  { tagline: string; models: string; bgImage: string; logoText: string }
> = {
  Audi: {
    tagline: 'Vorsprung durch Technik Aero & Dynamic Matrix Upgrades',
    models: 'A4 B9, A6 C8, Q5 FY, Q7 4M',
    bgImage:
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=800&auto=format&fit=crop',
    logoText: 'AUDI',
  },
  'Mercedes-Benz': {
    tagline: 'The Best or Nothing Bespoke Cabin & Rotary Soundstages',
    models: 'C-Class W205, E-Class W213, GLC X253, GLE V167',
    bgImage:
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop',
    logoText: 'MERCEDES',
  },
  BMW: {
    tagline: 'The Ultimate Driving Machine Autoclave Carbon Fiber Aerodynamics',
    models: '3 Series G20, 5 Series G30, X3 G01, X5 G05',
    bgImage:
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=800&auto=format&fit=crop',
    logoText: 'BMW //M',
  },
  Porsche: {
    tagline: 'There is No Substitute Precision Valvetronic Titanium Performance',
    models: '911 992, Panamera 971, Macan 95B, Cayenne 9YA',
    bgImage:
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=800&auto=format&fit=crop',
    logoText: 'PORSCHE',
  },
};

export default async function StorefrontHomePage() {
  const [products, categories, vehicles, posters] = await Promise.all([
    getProducts(),
    getCategories(),
    getVehicles(),
    getPosters(),
  ]);

  const featuredProducts = products.filter((p) => p.featured).slice(0, 8);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8);

  const distinctMakes = ['Audi', 'Mercedes-Benz', 'BMW', 'Porsche'];

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-24 pb-24 md:pb-20 font-sans">
      {/* 1. Hero Carousel */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6">
        <HeroCarousel posters={posters} />
      </div>

      {/* 2. Vehicle Makes Quick Filter Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-label font-bold uppercase tracking-wider text-[#DC2626]">
              <Sparkles className="w-4 h-4" />
              <span>Marque Selection</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-[#0F172A] uppercase">
              Select Your Marque
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-label">
              Filter precision-engineered upgrades specifically verified for your vehicle platform.
            </p>
          </div>

          <Link
            href="/products"
            className="text-xs font-bold text-[#DC2626] hover:text-red-700 flex items-center space-x-1 transition-colors uppercase tracking-wider shrink-0 font-label"
          >
            <span>View All {vehicles.length} Models</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {distinctMakes.map((make) => {
            const meta = MAKE_DETAILS[make] || {
              tagline: 'Precision OEM+ Fitment',
              models: `${vehicles.filter((v) => v.make === make).length} Models`,
              bgImage: vehicles.find((v) => v.make === make)?.imageUrl || '',
              logoText: make.toUpperCase(),
            };
            const modelCount = vehicles.filter((v) => v.make === make).length;

            return (
              <Link
                key={make}
                href={`/products?make=${encodeURIComponent(make)}`}
                className="group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-[#E2E8F0] hover:border-red-500/80 transition-all duration-500 ease-out flex flex-col justify-end p-4 sm:p-6 min-h-[180px] sm:min-h-[240px] shadow-subtle hover:shadow-elevated hover:-translate-y-2"
              >
                {/* Background image with refined clean overlay */}
                {meta.bgImage && (
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <Image
                      src={meta.bgImage}
                      alt={make}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover object-center filter brightness-[0.80] contrast-105 group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/95 via-[#0F172A]/60 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
                  </div>
                )}

                {/* Card Content */}
                <div className="relative z-10 space-y-1 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] sm:text-[10px] font-label uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 font-bold group-hover:bg-red-600/40 group-hover:border-red-400/60 transition-all duration-300 ease-out">
                      {meta.logoText}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-300 font-label font-medium hidden sm:inline">
                      {modelCount} Models
                    </span>
                  </div>

                  <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-tight group-hover:text-red-400 group-hover:translate-x-1 transition-all duration-300 ease-out">
                    {make}
                  </h3>

                  <p className="text-[11px] sm:text-xs text-slate-200 line-clamp-1 leading-snug font-label">
                    {meta.models}
                  </p>

                  <div className="pt-1 sm:pt-2 flex items-center text-[11px] sm:text-xs font-bold text-white group-hover:text-red-400 transition-all duration-300 ease-out">
                    <span>Explore</span>
                    <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 ml-1 group-hover:translate-x-2 transition-transform duration-300 ease-out" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Categories Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-label font-bold uppercase tracking-wider text-[#DC2626]">
              <Layers className="w-4 h-4" />
              <span>Catalog Showcase</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-[#0F172A] uppercase">
              Product Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-label">
              Explore our curated selections of performance, interior, and aerodynamic upgrades.
            </p>
          </div>

          <Link
            href="/products"
            className="text-xs font-bold text-[#DC2626] hover:text-red-700 flex items-center space-x-1 transition-colors uppercase tracking-wider shrink-0 font-label group"
          >
            <span>All Categories</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200 ease-out" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-[#E2E8F0] hover:border-red-500/80 transition-all duration-500 ease-out flex flex-col justify-end p-5 sm:p-7 min-h-[190px] sm:min-h-[230px] shadow-subtle hover:shadow-elevated hover:-translate-y-2"
            >
              {/* Category Background Image */}
              {cat.imageUrl && (
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover object-center filter brightness-[0.75] contrast-105 group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/95 via-[#0F172A]/50 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
                </div>
              )}

              {/* Overlay Content */}
              <div className="relative z-10 space-y-2">
                <span className="text-[10px] font-label uppercase tracking-widest text-red-400 font-bold group-hover:translate-x-1 transition-transform duration-300 ease-out inline-block">
                  0{idx + 1} / Collection
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-red-400 group-hover:translate-x-1 transition-all duration-300 ease-out">
                  {cat.name}
                </h3>
                <div className="pt-2 flex items-center text-xs font-bold text-white group-hover:text-red-400 transition-all duration-300 ease-out">
                  <span className="group-hover:translate-x-1 transition-transform duration-300 ease-out">Browse Category</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-2.5 transition-transform duration-300 ease-out" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Featured & Trending Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-label font-bold uppercase tracking-wider text-[#DC2626]">
              <Zap className="w-4 h-4" />
              <span>Trending Now</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-[#0F172A] uppercase">
              Featured Catalogue
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-label">
              Precision-fit performance parts and luxury accessories ready for express dispatch.
            </p>
          </div>

          <Link
            href="/products"
            className="text-xs font-bold text-[#DC2626] hover:text-red-700 flex items-center space-x-1 transition-colors uppercase tracking-wider shrink-0 font-label"
          >
            <span>View All ({products.length}) Products</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Featured Catalogue ScrollStack Showcase */}
        <FeaturedScrollStack products={displayProducts} />
      </section>

      {/* 5. Brand Trust Banner in Deep Slate Luxury Style */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl sm:rounded-3xl bg-[#0F172A] border border-slate-800 p-6 sm:p-14 relative overflow-hidden shadow-elevated">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-red-600/10 to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
            <div className="inline-flex items-center space-x-2 text-xs font-label font-bold uppercase text-red-400 bg-red-950/50 px-3 py-1.5 rounded-full border border-red-500/30">
              <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
              <span>Zero Risk Automotive Purchasing</span>
            </div>
            <h2 className="text-xl sm:text-4xl font-black tracking-tight text-white uppercase">
              Direct WhatsApp Concierge Hand-Off
            </h2>
            <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-label">
              We never take automated credit card payments on our site. When you checkout, your complete
              vehicle specifications and ordered items are formatted into a direct WhatsApp message. Our master
              automotive engineers manually confirm fitment and shipment logistics directly with you.
            </p>
            <div className="pt-2 sm:pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                href="/products"
                className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-[#DC2626] hover:bg-red-700 hover:-translate-y-0.5 active:scale-95 text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 ease-out shadow-md shadow-red-500/30 hover:shadow-red-500/50 text-center"
              >
                Browse All Upgrades
              </Link>
              <a
                href="https://wa.me/1234567890?text=Hello%20Kravion%20Auto,%20I'd%20like%20to%20learn%20more%20about%20your%20concierge%20service."
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/20 hover:-translate-y-0.5 active:scale-95 text-white text-xs sm:text-sm font-bold tracking-wide border border-white/20 transition-all duration-200 ease-out backdrop-blur-md text-center shadow-sm"
              >
                Chat with Concierge
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
