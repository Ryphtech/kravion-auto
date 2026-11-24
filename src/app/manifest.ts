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
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon',
      },
    ],
  };
}
