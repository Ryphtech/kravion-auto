import { OrderEnquiry } from '@/types';

export const DEFAULT_WHATSAPP_PHONE = '919876543210';

/**
 * Strips non-numeric characters from a phone number string
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return String(phone).replace(/[^\d]/g, '');
}

/**
 * Formats a currency value
 */
export function formatCurrency(
  amount?: number | null,
  currency: string = '$'
): string {
  const safeAmount =
    typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `${currency}${safeAmount.toFixed(2)}`;
}

/**
 * Builds the structured WhatsApp markdown message from an OrderEnquiry or order object
 */
export function buildWhatsAppOrderMessage(
  order: any,
  currencySymbol: string = '$'
): string {
  const refId = order.id || order.orderNumber || 'KRAV-PENDING';
  const orderNum = order.orderNumber || (refId.startsWith('KRAV-') ? refId : `KRAV-${refId}`);
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toISOString()
    : new Date().toISOString();

  const lines: string[] = [
    `*KRAVION AUTO — ORDER ENQUIRY*`,
    `*Order Reference:* #${order.id || orderNum}`,
    `Reference: ${orderNum}`,
    `Date: ${orderDate}`,
    ``,
    `*Customer Details:*`,
    `• Name: ${order.customerName || 'Valued Customer'}`,
    `• Phone: ${order.customerPhone || 'N/A'}`,
    `• Email: ${order.customerEmail || 'N/A'}`,
  ];

  if (order.shippingAddress) {
    const addr = order.shippingAddress;
    const parts = [
      addr.street,
      addr.apartment,
      addr.city,
      addr.state ? `${addr.state} ${addr.postalCode || ''}`.trim() : addr.postalCode,
      addr.country,
    ].filter(Boolean);
    if (parts.length > 0) {
      lines.push(`• Shipping: ${parts.join(', ')}`);
    }
  }

  const vehicle = order.vehicleDetails || order.vehicleInfo;
  if (vehicle && vehicle.make) {
    const yearStr = vehicle.year ? ` (${vehicle.year})` : '';
    lines.push(`• Vehicle: ${vehicle.make} ${vehicle.model || ''}${yearStr}`);
  }

  lines.push(``, `*Ordered Items:*`);
  if (Array.isArray(order.items) && order.items.length > 0) {
    order.items.forEach((item: any, idx: number) => {
      const priceVal = Number(item.price ?? item.unitPrice ?? 0);
      const subtotalVal = Number(
        item.subtotal !== undefined
          ? item.subtotal
          : priceVal * (item.quantity || 1)
      );
      lines.push(
        `${idx + 1}. ${item.title || 'Item'} (x${item.quantity || 1}) - $${subtotalVal.toFixed(2)} ($${priceVal.toFixed(2)} ea)`
      );
    });
  }

  lines.push(``);
  if (order.subtotal !== undefined) {
    lines.push(`Subtotal: $${Number(order.subtotal).toFixed(2)}`);
  }
  if (order.shipping !== undefined) {
    lines.push(
      `Shipping: ${Number(order.shipping) === 0 ? 'FREE' : `$${Number(order.shipping).toFixed(2)}`}`
    );
  }
  if (order.tax !== undefined) {
    lines.push(`Estimated Tax: $${Number(order.tax).toFixed(2)}`);
  }
  const totalVal = Number(order.totalAmount ?? order.subtotal ?? 0);
  lines.push(`*Total Amount: $${totalVal.toFixed(2)} ${order.currency || 'USD'}*`);

  const notes = order.notes || order.customerNotes;
  if (notes) {
    lines.push(``, `Customer Notes: "${notes}"`);
  }

  lines.push(
    ``,
    `----------------------------------------`,
    `*IMPORTANT PAYMENT NOTICE:*`,
    `Online payment is not collected on the website. No online payment has been collected. Kravion Auto will review your order enquiry and provide official payment confirmation and dispatch details directly via this chat.`
  );

  return lines.join('\n');
}

/**
 * Builds the complete click-to-chat WhatsApp redirect URL
 */
export function formatWhatsAppOrderUrl(
  order: any,
  recipientPhone?: string | null
): string {
  const effectiveRaw =
    (recipientPhone && String(recipientPhone).trim()) ||
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE ||
    DEFAULT_WHATSAPP_PHONE;

  const cleanPhone = sanitizePhoneNumber(effectiveRaw) || DEFAULT_WHATSAPP_PHONE;
  const message = buildWhatsAppOrderMessage(order);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export const generateWhatsAppOrderUrl = formatWhatsAppOrderUrl;
export const buildWhatsAppUrl = formatWhatsAppOrderUrl;
