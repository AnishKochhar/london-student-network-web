'use client';

import { useEffect, useState } from 'react';

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const MAX_RETRIES = 20; // 20 * 3s = 60s total
const RETRY_INTERVAL = 3000;

export default function CheckoutReturn({ searchParams }: { searchParams: { [key: string]: string } }) {
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams['session_id'];

  useEffect(() => {
    if (!sessionId) {
      setError('Missing session ID');
      return;
    }

    const controller = new AbortController();
    
    const checkStatus = async (attempt: number): Promise<void> => {
      try {
        const response = await fetch(`/api/payments/checkout-status/${sessionId}`, {
          signal: controller.signal
        });
        
        if (!response.ok) throw new Error('Status check failed');
        
        const result = await response.json();
        
        if (result.status === 'paid') {
          window.location.href = `/registration/thank-you`;
          return;
        }

        if (attempt < MAX_RETRIES) {
          await wait(RETRY_INTERVAL);
          return checkStatus(attempt + 1);
        }

        setError('Payment confirmation timed out');
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Failed to verify payment status');
          console.error('Status check error:', err);
        }
      }
    };

    checkStatus(0);

    return () => controller.abort();
  }, [sessionId]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">
            Payment Verification Failed
          </h2>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/support'}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center max-w-2xl px-4">
        <h2 className="text-3xl font-semibold text-blue-600 mb-4">
          Securing Your Registration
        </h2>
        <div className="space-y-2 mb-6">
          <p className="text-gray-600 text-lg">
            We're confirming your payment details with our secure gateway
          </p>
          <p className="text-gray-500 text-sm">
            Session ID: {sessionId?.slice(0, 10)}...
          </p>
        </div>
        <div className="mt-6 flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-6 text-sm text-gray-500">
          This typically takes 1-60 seconds. Please do not close or refresh this tab.
        </p>
      </div>
    </div>
  );
}
