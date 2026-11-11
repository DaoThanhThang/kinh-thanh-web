import type { Metadata } from 'next';
import { CheckoutPage } from '@/features/checkout/components/CheckoutPage';
import { getBoxOptions, getChocolates } from '@/lib/services/catalog';
import { checkout } from '@/content/checkout';

export const metadata: Metadata = {
  title: checkout.pageTitle,
};

export default async function OrderPage() {
  const [boxes, chocolates] = await Promise.all([getBoxOptions(), getChocolates()]);
  return (
    <main id="main">
      <CheckoutPage chocolates={chocolates} boxes={boxes} />
    </main>
  );
}
