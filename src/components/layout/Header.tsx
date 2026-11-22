'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useGarage } from '@/context/GarageContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useTypewriterPlaceholder } from '@/hooks/useTypewriterPlaceholder';
import {
  Car,
  ShoppingBag,
  Heart,
  Search,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  User as UserIcon,
  LogOut,
  Shield,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';

  const { selectedVehicle, openGarageModal, isHydrated } = useGarage();
  const { totalCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user, profile, logout } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Animated typewriter placeholder cycling through luxury car upgrades
  const placeholderText = useTypewriterPlaceholder();

  // Monitor window scroll position to toggle transparent vs white navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // When on homepage and at top of the page, navbar is transparent over the hero image
  const isTransparent = isHome && !isScrolled;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim() || placeholderText;
    if (query) {
      router.push(`/products?search=${encodeURIComponent(query)}`);
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    router.push('/');
  };

  const userDisplayName =
    profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Customer';
  const userInitials = userDisplayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full font-sans transition-all duration-300">
        {/* Main Navigation Bar */}
        <div
          className={`transition-all duration-300 ${
            isTransparent
              ? 'bg-transparent border-b border-transparent shadow-none'
              : 'bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm'
          }`}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
            {/* Kravion Logo */}
            <div className="flex items-center shrink-0">
              <Link href="/" className="flex items-center group py-1" aria-label="Kravion Auto Home">
                <div className="relative h-9 w-auto sm:h-12 flex items-center justify-center">
                  <img
                    src={isTransparent ? '/logo-white.svg' : '/logo.svg'}
                    alt="Kravion Auto"
                    className="h-9 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              </Link>
            </div>

            {/* Mobile Inline Search Bar with Animated Typewriter Suggestions */}
            <form
              onSubmit={handleSearchSubmit}
              className="sm:hidden flex-1 mx-2 relative min-w-0 group"
            >
              <div
                className={`relative flex items-center w-full h-9 rounded-full transition-all duration-300 shadow-sm ${
                  isTransparent
                    ? 'bg-white/10 hover:bg-white/15 focus-within:bg-white/20 border border-white/25 focus-within:border-red-500/80 focus-within:ring-2 focus-within:ring-red-500/30 backdrop-blur-md'
                    : 'bg-slate-100 hover:bg-slate-50 focus-within:bg-white border border-[#E2E8F0] focus-within:border-[#DC2626] focus-within:ring-2 focus-within:ring-red-500/20'
                }`}
              >
                <Search
                  className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                    isTransparent
                      ? 'text-white/70 group-focus-within:text-red-400'
                      : 'text-slate-400 group-focus-within:text-[#DC2626]'
                  }`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={placeholderText ? `Search "${placeholderText}"...` : 'Search products...'}
                  className={`w-full h-full bg-transparent pl-9 pr-8 text-xs font-medium focus:outline-none transition-colors placeholder:truncate ${
                    isTransparent
                      ? 'text-white placeholder:text-white/60'
                      : 'text-[#0F172A] placeholder:text-slate-400'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all active:scale-90 ${
                      isTransparent
                        ? 'text-white/70 hover:text-white hover:bg-white/20'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                    }`}
                    aria-label="Clear search query"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </form>

            {/* Desktop Navigation Links */}
            <nav
              className={`hidden lg:flex items-center space-x-7 text-xs font-semibold uppercase tracking-wider font-label transition-colors duration-200 ${
                isTransparent ? 'text-white' : 'text-slate-700'
              }`}
            >
              <Link
                href="/"
                className="hover:text-[#DC2626] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-out py-2"
              >
                Home
              </Link>
              <Link
                href="/products"
                className="hover:text-[#DC2626] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-out py-2"
              >
                All Products
              </Link>

              {/* Quick Makes Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-1 hover:text-[#DC2626] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-out py-2">
                  <span>Makes</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all duration-200" />
                </button>
                <div className="absolute top-full left-0 w-48 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 ease-out space-y-1 transform translate-y-2 group-hover:translate-y-0">
                  {['Audi', 'Mercedes-Benz', 'BMW', 'Porsche'].map((make) => (
                    <Link
                      key={make}
                      href={`/products?make=${encodeURIComponent(make)}`}
                      className="block px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#DC2626] hover:bg-slate-50 hover:translate-x-1 rounded-xl transition-all duration-150 ease-out"
                    >
                      {make}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick Categories Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-1 hover:text-[#DC2626] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-out py-2">
                  <span>Categories</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all duration-200" />
                </button>
                <div className="absolute top-full left-0 w-60 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 ease-out space-y-1 transform translate-y-2 group-hover:translate-y-0">
                  {[
                    { name: 'Ambient Lighting', slug: 'ambient-lighting' },
                    { name: 'Audio & Speakers', slug: 'audio-speakers' },
                    { name: 'Interior Accessories', slug: 'interior-accessories' },
                    { name: 'Carbon Fiber Styling', slug: 'carbon-fiber-styling' },
                    { name: 'Performance Exhausts', slug: 'performance-exhausts' },
                  ].map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/products?category=${cat.slug}`}
                      className="block px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#DC2626] hover:bg-slate-50 hover:translate-x-1 rounded-xl transition-all duration-150 ease-out"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/products?fitsGarage=true"
                className={`hover:-translate-y-0.5 active:scale-95 font-bold transition-all duration-200 ease-out py-2 flex items-center space-x-1 ${
                  isTransparent ? 'text-red-400 hover:text-red-300' : 'text-[#DC2626] hover:text-red-700'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#DC2626]" />
                <span>Fitment Guide</span>
              </Link>
            </nav>

            {/* Right Header Actions */}
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              {/* My Garage Button / Active Vehicle Indicator (Desktop only - mobile accesses garage via bottom bar & menu) */}
              <button
                onClick={openGarageModal}
                className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95 ${
                  selectedVehicle && isHydrated
                    ? isTransparent
                      ? 'bg-emerald-500/25 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/35 backdrop-blur-md shadow-sm'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-sm'
                    : isTransparent
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md shadow-sm'
                    : 'bg-slate-50 border-[#E2E8F0] text-slate-700 hover:border-red-400 hover:text-[#DC2626] hover:bg-white'
                }`}
                title={
                  selectedVehicle && isHydrated
                    ? `Active Vehicle: ${selectedVehicle.make} ${selectedVehicle.model}. Click to change.`
                    : 'Select your vehicle to guarantee fitment'
                }
              >
                {selectedVehicle && isHydrated ? (
                  <>
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <Car className={`w-3.5 h-3.5 shrink-0 sm:hidden ${isTransparent ? 'text-emerald-300' : 'text-emerald-700'}`} />
                    <div className="text-left hidden sm:flex flex-col max-w-[120px] sm:max-w-[150px] truncate">
                      <span className={`text-[10px] uppercase font-label font-bold leading-tight ${isTransparent ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        My Garage
                      </span>
                      <span className={`truncate font-bold text-xs ${isTransparent ? 'text-white' : 'text-[#0F172A]'}`}>
                        {selectedVehicle.make} {selectedVehicle.model}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <Car className="w-4 h-4 text-[#DC2626] shrink-0" />
                    <span className="hidden sm:inline font-bold">Select Vehicle</span>
                    <span className="sm:hidden font-bold text-[11px]">Garage</span>
                  </>
                )}
              </button>

              {/* Search Toggle Shortcut (Desktop only) */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`hidden sm:inline-flex p-2 sm:p-2.5 rounded-xl border hover:scale-105 active:scale-95 transition-all duration-200 ease-out shadow-sm ${
                  isTransparent
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md'
                    : 'bg-white border-[#E2E8F0] text-slate-700 hover:text-[#DC2626] hover:border-red-300 hover:bg-slate-50'
                }`}
                aria-label="Search Catalog"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Wishlist Link (Desktop/Tablet) */}
              <Link
                href="/wishlist"
                className={`hidden sm:inline-flex relative p-2.5 rounded-xl border hover:scale-105 active:scale-95 transition-all duration-200 ease-out shadow-sm group/wish ${
                  isTransparent
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md'
                    : 'bg-white border-[#E2E8F0] text-slate-700 hover:text-[#DC2626] hover:border-red-300 hover:bg-slate-50'
                }`}
                aria-label="Wishlist"
                title="Saved Wishlist"
              >
                <Heart className="w-4 h-4 group-hover/wish:scale-110 transition-transform duration-200" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#DC2626] text-white font-label text-[9px] font-bold flex items-center justify-center shadow-sm animate-scale-in">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Shopping Cart Link (Desktop/Tablet - mobile accesses cart via bottom bar & drawer) */}
              <Link
                href="/cart"
                className={`hidden sm:inline-flex relative p-2 sm:p-2.5 rounded-xl border hover:scale-105 active:scale-95 transition-all duration-200 ease-out shadow-sm group/cart ${
                  isTransparent
                    ? 'bg-[#DC2626] border-red-500 text-white hover:bg-red-700 shadow-red-600/30'
                    : 'bg-red-50 border-red-200 text-[#DC2626] hover:bg-red-100'
                }`}
                aria-label="Shopping Cart"
                title="View Cart"
              >
                <ShoppingBag className="w-4 h-4 group-hover/cart:scale-110 transition-transform duration-200" />
                {totalCount > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full font-label text-[9px] font-extrabold flex items-center justify-center shadow-sm animate-scale-in ${
                    isTransparent ? 'bg-white text-[#DC2626]' : 'bg-[#DC2626] text-white'
                  }`}>
                    {totalCount}
                  </span>
                )}
              </Link>

              {/* Customer Authentication Dropdown / Sign In Button */}
              {user ? (
                <div className="relative hidden sm:block" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className={`flex items-center space-x-2 p-1.5 sm:px-3 sm:py-2 rounded-xl border hover:scale-105 active:scale-95 transition-all duration-200 ease-out shadow-sm ${
                      isTransparent
                        ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md'
                        : 'bg-white border-[#E2E8F0] hover:border-red-400 text-slate-800'
                    }`}
                    aria-label="User Account Menu"
                  >
                    <div className="w-6 h-6 rounded-lg bg-[#DC2626] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                      {userInitials}
                    </div>
                    <span className={`hidden md:inline text-xs font-bold max-w-[100px] truncate ${isTransparent ? 'text-white' : 'text-slate-800'}`}>
                      {userDisplayName}
                    </span>
                    <ChevronDown className={`w-3 h-3 hidden sm:inline ${isTransparent ? 'text-white/70' : 'text-slate-500'}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-[#E2E8F0] shadow-xl p-2 z-50 space-y-1 animate-scale-in">
                      <div className="px-3 py-2 border-b border-[#E2E8F0] mb-1">
                        <p className="text-xs font-bold text-[#0F172A] truncate">
                          {userDisplayName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate font-label">
                          {user.email}
                        </p>
                        {profile?.role === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="inline-flex items-center space-x-1 mt-1.5 text-[10px] font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded-md border border-red-200 hover:bg-red-100 transition-colors"
                          >
                            <Shield className="w-3 h-3" />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                      </div>

                      <Link
                        href="/wishlist"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 hover:text-[#DC2626] hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <Heart className="w-3.5 h-3.5 text-red-500" />
                          <span className="font-medium">Saved Wishlist</span>
                        </div>
                        {wishlistCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                            {wishlistCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        href="/cart"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 hover:text-[#DC2626] hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-700" />
                          <span className="font-medium">Shopping Cart</span>
                        </div>
                        {totalCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold">
                            {totalCount}
                          </span>
                        )}
                      </Link>

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-colors pt-2 border-t border-[#E2E8F0] font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className={`hidden sm:inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isTransparent
                      ? 'bg-white/15 hover:bg-white/25 border border-white/25 text-white backdrop-blur-md'
                      : 'bg-[#0F172A] hover:bg-slate-800 text-white'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 rounded-xl border shadow-sm transition-colors ${
                  isTransparent
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md'
                    : 'bg-white border-[#E2E8F0] text-slate-700 hover:text-slate-900'
                }`}
                aria-label="Toggle Mobile Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Quick Search Dropdown Bar (Desktop) */}
          {searchOpen && (
            <div
              className={`hidden sm:block px-4 py-3.5 animate-in slide-in-from-top-2 duration-150 transition-all ${
                isTransparent
                  ? 'bg-black/40 backdrop-blur-md border-t border-white/10 shadow-xl'
                  : 'border-t border-[#E2E8F0] bg-[#F8FAFC] shadow-inner'
              }`}
            >
              <form
                onSubmit={handleSearchSubmit}
                className="max-w-2xl mx-auto flex items-center gap-2.5 group"
              >
                <div
                  className={`relative flex-1 flex items-center h-11 rounded-2xl transition-all duration-200 shadow-sm ${
                    isTransparent
                      ? 'bg-white/10 hover:bg-white/15 focus-within:bg-white/20 border border-white/25 focus-within:border-red-500/80 focus-within:ring-2 focus-within:ring-red-500/30 backdrop-blur-md'
                      : 'bg-white border border-[#E2E8F0] focus-within:border-[#DC2626] focus-within:ring-2 focus-within:ring-red-500/20'
                  }`}
                >
                  <Search
                    className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${
                      isTransparent
                        ? 'text-white/70 group-focus-within:text-red-400'
                        : 'text-slate-400 group-focus-within:text-[#DC2626]'
                    }`}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      placeholderText
                        ? `Search "${placeholderText}"...`
                        : 'Search carbon splitters, ambient cockpits, matrix lights, audio...'
                    }
                    className={`w-full h-full bg-transparent pl-10 pr-9 text-sm transition-all focus:outline-none placeholder:truncate ${
                      isTransparent
                        ? 'text-white placeholder:text-white/60'
                        : 'text-[#0F172A] placeholder:text-slate-400 font-medium'
                    }`}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                        isTransparent
                          ? 'text-white/70 hover:text-white hover:bg-white/20'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#DC2626] hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-2xl uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-red-600/30 shrink-0"
                >
                  Search
                </button>
              </form>
            </div>
          )}

          {/* Mobile Slide-Over Drawer */}
          {mobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 top-16 sm:top-20 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-200"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="relative z-40 lg:hidden border-t border-[#E2E8F0] bg-white px-5 sm:px-6 py-5 sm:py-6 space-y-5 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto animate-in slide-in-from-top duration-200 text-[#0F172A]">
                {/* User Profile / Sign In Section for Mobile */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E2E8F0]">
                  {user ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0F172A] text-white font-bold text-sm flex items-center justify-center">
                          {userInitials}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-[#0F172A] truncate">
                            {userDisplayName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate font-label">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="p-2 text-red-600 hover:text-red-700"
                        title="Sign Out"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-sm transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Sign In / Register</span>
                    </Link>
                  )}
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-wider font-label font-bold text-slate-400">
                    Navigation
                  </span>
                  <div className="flex flex-col space-y-2 text-sm font-semibold text-slate-800">
                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1.5 hover:text-[#DC2626] transition-colors"
                    >
                      Home
                    </Link>
                    <Link
                      href="/products"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1.5 hover:text-[#DC2626] transition-colors"
                    >
                      All Products
                    </Link>
                    <Link
                      href="/products?featured=true"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1.5 hover:text-[#DC2626] transition-colors"
                    >
                      Featured & Trending
                    </Link>
                    <Link
                      href="/cart"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1.5 hover:text-[#DC2626] transition-colors flex items-center justify-between"
                    >
                      <span>Shopping Cart</span>
                      {totalCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#DC2626] text-white font-label text-[10px] font-bold">
                          {totalCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-1.5 hover:text-[#DC2626] transition-colors flex items-center justify-between"
                    >
                      <span>Saved Wishlist</span>
                      {wishlistCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-label text-[10px] font-bold">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>
                  </div>
                </div>

                {/* Mobile Vehicle Makes */}
                <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
                  <span className="text-[10px] uppercase tracking-wider font-label font-bold text-slate-400">
                    Browse by Make
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {['Audi', 'Mercedes-Benz', 'BMW', 'Porsche'].map((make) => (
                      <Link
                        key={make}
                        href={`/products?make=${encodeURIComponent(make)}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2.5 rounded-xl bg-slate-50 border border-[#E2E8F0] text-xs font-semibold text-slate-700 hover:text-[#DC2626] hover:border-red-300 transition-colors"
                      >
                        {make}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Mobile Categories */}
                <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
                  <span className="text-[10px] uppercase tracking-wider font-label font-bold text-slate-400">
                    Categories
                  </span>
                  <div className="flex flex-col space-y-2 text-xs font-medium text-slate-600">
                    {[
                      { name: 'Ambient Lighting', slug: 'ambient-lighting' },
                      { name: 'Audio & Speakers', slug: 'audio-speakers' },
                      { name: 'Interior Accessories', slug: 'interior-accessories' },
                      { name: 'Carbon Fiber Styling', slug: 'carbon-fiber-styling' },
                      { name: 'Performance Exhausts', slug: 'performance-exhausts' },
                    ].map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/products?category=${cat.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="py-1 hover:text-[#DC2626] transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Mobile Garage Action */}
                <div className="pt-3 border-t border-[#E2E8F0]">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openGarageModal();
                    }}
                    className="w-full py-3 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <Car className="w-4 h-4" />
                    <span>
                      {selectedVehicle
                        ? `Change Vehicle (${selectedVehicle.make} ${selectedVehicle.model})`
                        : 'Select Your Vehicle'}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Spacer for non-homepage routes so inner page content is never hidden under the fixed header */}
      {!isHome && <div className="h-16 sm:h-20" aria-hidden="true" />}
    </>
  );
}
