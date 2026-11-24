import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getProductById, getProducts } from '@/lib/data-service';
import { ProductDetailClient } from './ProductDetailClient';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await getProductById(params.id);
  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kravionauto.com';
  const imageUrl = product.featuredImage || product.images?.[0] || `${baseUrl}/logo.svg`;
  const cleanDescription = (product.description || '').replace(/\s+/g, ' ').slice(0, 160);

  return {
    title: product.title,
    description: cleanDescription,
    alternates: {
      canonical: `/products/${product.id}`,
    },
    openGraph: {
      title: `${product.title} | Kravion Auto`,
      description: cleanDescription,
      url: `/products/${product.id}`,
      type: 'article',
      images: [
        {
          url: imageUrl,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} | Kravion Auto`,
      description: cleanDescription,
      images: [imageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  // Load related products from same category
  const allCategoryProducts = await getProducts({ category: product.category });
  const relatedProducts = allCategoryProducts.filter((p) => p.id !== product.id);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kravionauto.com';
  const productImageUrl = product.featuredImage || product.images?.[0] || `${baseUrl}/logo.svg`;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images && product.images.length > 0 ? product.images : [productImageUrl],
    description: product.description,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Kravion Auto',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${product.id}`,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.inStock !== false
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Kravion Auto',
      },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: `${baseUrl}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title,
        item: `${baseUrl}/products/${product.id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
      />
    </>
  );
}
