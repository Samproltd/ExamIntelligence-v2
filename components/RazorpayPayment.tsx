import React, { useEffect } from 'react';
import Script from 'next/script';

interface PaymentOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayPaymentProps {
  isOpen: boolean;
  options: PaymentOptions;
  onSuccess: (response: any) => void;
  onFailure: (error: any) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayPayment: React.FC<RazorpayPaymentProps> = ({
  isOpen,
  options,
  onSuccess,
  onFailure,
}) => {
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.Razorpay) {
      const razorpayOptions = {
        ...options,
        handler: function (response: any) {
          onSuccess(response);
        },
        modal: {
          ondismiss: function () {
            onFailure({ message: 'Payment canceled by user' });
          },
        },
      };

      try {
        const razorpayInstance = new window.Razorpay(razorpayOptions);
        razorpayInstance.open();
      } catch (error) {
        onFailure(error);
      }
    }
  }, [isOpen, options, onSuccess, onFailure]);

  return (
    <Script
      src="https://checkout.razorpay.com/v1/checkout.js"
      strategy="lazyOnload"
      onError={() => onFailure({ message: 'Failed to load Razorpay SDK' })}
    />
  );
};

export default RazorpayPayment;
