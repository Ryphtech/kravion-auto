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
      title: 'Product Not Found — Kravion Auto',
    };
  }

  return {
    title: `${product.title} — Kravion Auto`,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: [
        {
          url: product.featuredImage || product.images?.[0] || '',
        },
      ],
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

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
