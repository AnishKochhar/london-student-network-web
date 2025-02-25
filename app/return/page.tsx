'use client'


import { useEffect, useState } from 'react';
import paymentProcessingAndServiceFulfilment from '../api/actions/paid-events/payment-processing-and-service-fulfilment';

export default function CheckoutReturn({ searchParams }: { searchParams: any }) {

  useEffect(() => {
    paymentProcessingAndServiceFulfilment(searchParams);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-blue-600">
          Processing your payment...
        </h2>
        <h3 className="text-2xl font-semibold text-blue-600">
          Please do not reload or close the page
        </h3>
        <div className="mt-4 flex justify-center">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}
