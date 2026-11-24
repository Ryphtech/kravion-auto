import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/context/Providers';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-headline',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-label',
  display: 'swap',
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kravion-auto.vercel.app';

export const viewport: Viewport = {
  themeColor: '#DC2626',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Kravion Auto — Luxury Automotive Accessories & Parts',
    template: '%s | Kravion Auto',
  },
  description:
    'Bespoke ambient lighting, dry carbon fiber aerodynamics, high-fidelity audio, and precision performance accessories with guaranteed vehicle fitment for Audi, BMW, Mercedes-Benz, Porsche.',
  keywords: [
    'luxury automotive parts',
    'car styling accessories',
    'dry carbon fiber aero',
    'valvetronic exhaust',
    'ambient lighting retrofit',
    'Audi upgrades India',
    'BMW M performance parts',
    'Mercedes-Benz interior styling',
    'Porsche performance accessories',
    'vehicle fitment check',
    'Kravion Auto',
  ],
  authors: [
    { name: 'Ryph Tech', url: 'https://ryphtech.in' },
    { name: 'Kravion Auto' },
  ],
  creator: 'Ryph Tech',
  publisher: 'Kravion Auto',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Kravion Auto — Luxury Automotive Accessories & Parts',
    description:
      'Bespoke ambient lighting, dry carbon fiber aerodynamics, high-fidelity audio, and precision performance accessories with guaranteed vehicle fitment.',
    url: baseUrl,
    siteName: 'Kravion Auto',
    images: [
      {
        url: '/logo.svg',
        width: 800,
        height: 600,
        alt: 'Kravion Auto — Luxury Automotive Upgrades',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kravion Auto — Luxury Automotive Accessories & Parts',
    description:
      'Bespoke ambient lighting, dry carbon fiber aerodynamics, high-fidelity audio, and precision performance accessories.',
    images: ['/logo.svg'],
    creator: '@kravionauto',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'Automotive',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AutoPartsStore',
  name: 'Kravion Auto',
  url: baseUrl,
  logo: `${baseUrl}/logo.svg`,
  image: `${baseUrl}/logo.svg`,
  description:
    'Bespoke ambient lighting, dry carbon fiber aerodynamics, high-fidelity audio, and precision performance accessories with guaranteed vehicle fitment.',
  priceRange: '₹₹₹₹',
  currenciesAccepted: 'INR, USD',
  paymentAccepted: 'Direct WhatsApp Concierge Enquiry, In-Store Consultation',
  openingHours: 'Mo-Sa 09:00-20:00',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'IN',
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Kravion Auto',
  url: baseUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${baseUrl}/products?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable} light`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="bg-[#F8FAFC] text-[#0F172A] min-h-screen flex flex-col font-sans antialiased selection:bg-red-600 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
