import React from 'react';
import { useCart } from '../context/CartContext';
import PaymentButton from '../components/PaymentButton';

export default function CheckoutPage() {
  const { items } = useCart();

  if (items.length === 0) {
    return <p className="p-6">Your cart is empty.</p>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <ul className="divide-y">
        {items.map(i => (
          <li key={i.courseId} className="py-2 flex justify-between">
            <span>{i.title}</span>
            <span>{i.priceLabel}</span>
          </li>
        ))}
      </ul>

      {/* If you eventually support multiple items, pass the whole array to your backend */}
      <PaymentButton
        courseId={items[0].courseId}
        priceId={items[0].priceId}
      />
    </div>
  );
}
