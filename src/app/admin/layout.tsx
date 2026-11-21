'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Car,
  Image as ImageIcon,
  ClipboardList,
  Settings,
  ExternalLink,
  Menu,
  X,
  Shield,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: Package,
  },
  {
    name: 'Categories',
    href: '/admin/categories',
    icon: Layers,
  },
  {
    name: 'Vehicles',
    href: '/admin/vehicles',
    icon: Car,
  },
  {
    name: 'Carousel Banners',
    href: '/admin/banners',
    icon: ImageIcon,
  },
  {
    name: 'Order Enquiries',
    href: '/admin/orders',
    icon: ClipboardList,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isActive = (itemHref: string, exact?: boolean) => {
    if (exact) {
      return pathname === itemHref;
    }
    return pathname.startsWith(itemHref);
  };

  const getPageTitle = () => {
    const active = navItems.find((item) => isActive(item.href, item.exact));
    return active ? active.name : 'Administration';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col md:flex-row font-sans antialiased">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Navigation in Luxury Deep Slate Theme */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0F172A] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 border-b border-slate-800 flex items-center justify-between">
          <Link
            href="/admin"
            className="flex items-center space-x-3 group"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <div className="relative h-10 w-auto px-2 py-1 rounded-xl overflow-hidden shadow-sm border border-slate-700 bg-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/logo.svg"
                alt="Kravion Auto"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-widest text-white text-sm uppercase">
                Kravion
              </span>
              <span className="text-[10px] text-red-400 font-bold font-label tracking-wider uppercase">
                Admin Console
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Badges */}
        <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-400 font-label">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-300">Live Operation</span>
          </div>
          <span className="font-mono text-slate-500">v1.0-prod</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto font-label">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  active
                    ? 'bg-[#DC2626] text-white shadow-md shadow-red-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 ${
                      active ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {active && <ChevronRight className="w-4 h-4 text-white/80" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Storefront & User Section */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-[#0F172A] font-label">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all shadow-sm"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-red-400" />
              View Storefront
            </span>
            <span className="text-[10px] text-slate-400 lowercase font-mono">/</span>
          </Link>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[#DC2626] text-xs font-bold shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  {profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Administrator'}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-red-950/60 text-red-400 px-1.5 py-0.2 rounded border border-red-800/60 font-mono">
                    Admin
                  </span>
                </div>
              </div>
            </div>

            {user && (
              <button
                type="button"
                onClick={() => logout()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar in Light Styling */}
        <header className="h-16 sm:h-20 px-3 sm:px-6 lg:px-8 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm sm:text-lg font-black text-[#0F172A] flex items-center gap-2 uppercase tracking-wide">
                <span>{getPageTitle()}</span>
              </h1>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
