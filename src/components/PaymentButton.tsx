import React from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key from .env.local
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PK!);

interface PaymentButtonProps {
  courseId: string;
  priceId: string; // Stripe Price ID representing the course price
}

export default function PaymentButton({ courseId, priceId }: PaymentButtonProps) {
  const handlePurchase = async () => {
    const stripe = await stripePromise;
    // Create a Checkout Session on your backend
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, priceId }),
    });

    if (!response.ok) {
      console.error('Failed to create checkout session');
      return;
    }

    const { sessionId } = await response.json();
    // Redirect to Stripe Checkout
    await stripe?.redirectToCheckout({ sessionId });
  };

  return (
    <button
      onClick={handlePurchase}
      className="mt-4 bg-bjj-blue text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      Buy Course
    </button>
  );
}
