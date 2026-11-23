import React from 'react';
import Link from 'next/link';
import { ShieldCheck, MessageCircle, Wrench, ArrowUpRight, Sparkles } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-[#E2E8F0] text-slate-600 text-sm font-sans mt-auto">
      {/* Brand Value Pillars */}
      <div className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-4 p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:border-red-300 transition-colors">
            <div className="p-3.5 rounded-xl bg-red-50 text-[#DC2626] border border-red-100 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#0F172A] tracking-wide">
                100% Precision OEM+ Fitment
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-label">
                Engineered to strict factory CAD tolerances for Audi, BMW, Mercedes-Benz & Porsche.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:border-red-300 transition-colors">
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#0F172A] tracking-wide">
                Direct WhatsApp Concierge
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-label">
                Zero automated online payments. Our engineers verify vehicle fitment before order finalization.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:border-red-300 transition-colors">
            <div className="p-3.5 rounded-xl bg-slate-100 text-[#0F172A] border border-slate-200 shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#0F172A] tracking-wide">
                2-Year Replacement Warranty
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-label">
                Toray T700 dry carbon clear-coat and automotive-grade electronics backed by replacement guarantee.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Col 1: Brand Info */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center">
            <Link href="/" className="inline-block py-1" aria-label="Kravion Auto Home">
              <img
                src="/logo.svg"
                alt="Kravion Auto"
                className="h-10 sm:h-11 w-auto object-contain hover:scale-105 transition-transform"
              />
            </Link>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed pr-6 font-label">
            Kravion Auto is the premier destination for high-end automotive styling and cabin enhancements.
            We specialize in bespoke 64-color ambient cockpits, autoclave dry carbon aerodynamic splitters and
            diffusers, acoustic rotary 3D soundstages, and valvetronic performance exhausts.
          </p>
          <div className="pt-2">
            <a
              href="https://wa.me/1234567890?text=Hello%20Kravion%20Auto,%20I%20have%20an%20enquiry%20regarding%20vehicle%20fitment."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Connect with Automotive Specialist</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </a>
          </div>
        </div>

        {/* Col 2: Vehicle Makes */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider font-label">
            Vehicle Makes
          </h4>
          <ul className="space-y-2 text-xs font-medium text-slate-600 font-label">
            {['Audi', 'Mercedes-Benz', 'BMW', 'Porsche'].map((make) => (
              <li key={make}>
                <Link
                  href={`/products?make=${encodeURIComponent(make)}`}
                  className="hover:text-[#DC2626] transition-colors"
                >
                  {make} Accessories
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Product Types */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider font-label">
            Categories
          </h4>
          <ul className="space-y-2 text-xs font-medium text-slate-600 font-label">
            {[
              { name: 'Ambient Lighting', slug: 'ambient-lighting' },
              { name: 'Audio & Speakers', slug: 'audio-speakers' },
              { name: 'Interior Accessories', slug: 'interior-accessories' },
              { name: 'Carbon Fiber Styling', slug: 'carbon-fiber-styling' },
              { name: 'Performance Exhausts', slug: 'performance-exhausts' },
            ].map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/products?category=${cat.slug}`}
                  className="hover:text-[#DC2626] transition-colors"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4: Platform */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider font-label">
            Customer Care
          </h4>
          <ul className="space-y-2 text-xs font-medium text-slate-600 font-label">
            <li>
              <Link href="/cart" className="hover:text-[#DC2626] transition-colors">
                Shopping Cart
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:text-[#DC2626] transition-colors">
                Saved Wishlist
              </Link>
            </li>
            <li>
              <Link href="/products?fitsGarage=true" className="hover:text-[#DC2626] transition-colors">
                Compatibility Checker
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-[#DC2626] transition-colors font-semibold text-slate-800">
                Admin Portal
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-label gap-3">
          <p>© {currentYear} Kravion Auto Inc. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-right">
            <p className="flex items-center space-x-2">
              <span>Precision engineered for German luxury vehicles.</span>
              <span className="text-[#DC2626] font-bold">•</span>
              <span>WhatsApp Order Hand-Off</span>
            </p>
            <span className="hidden sm:inline text-slate-300">|</span>
            <p>
              Designed and Developed by{' '}
              <a
                href="https://ryphtech.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#0F172A] hover:text-[#DC2626] transition-colors underline decoration-slate-300 underline-offset-4 hover:decoration-[#DC2626]"
              >
                ryphtech (ryphtech.in)
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
