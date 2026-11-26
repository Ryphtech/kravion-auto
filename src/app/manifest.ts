import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kravion Auto — Luxury Automotive Accessories & Parts',
    short_name: 'Kravion Auto',
    description:
      'Bespoke ambient lighting, dry carbon fiber aerodynamics, high-fidelity audio, and precision performance accessories with guaranteed vehicle fitment.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#DC2626',
    icons: [
      {
        src: '/icon-48x48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/favicon.ico',
        sizes: '48x48 32x32 16x16',
        type: 'image/x-icon',
      },
    ],
  };
}
