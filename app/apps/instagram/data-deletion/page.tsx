// app/status/page.tsx

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface DeletionStatus {
  caseOpenedDate: string; // ISO 8601 date string
  disconnectionStatus: "Completed" | "In Progress" | "Failed";
  dataDeletionStatus: "Completed" | "In Progress" | "Failed" | "Not Requested";
}

// A small utility function to calculate remaining days
const getRemainingDays = (isoDate: string): number => {
  const openedDate = new Date(isoDate);
  const expiryDate = new Date(openedDate.setMonth(openedDate.getMonth() + 1));
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays); // Ensure it doesn't go negative
};

// Main component wrapped in Suspense for useSearchParams
export default function StatusPageWrapper() {
  return (
    <Suspense fallback={<div className="bg-gray-900 min-h-screen"></div>}>
      <StatusPage />
    </Suspense>
  );
}

function StatusPage() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<DeletionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch status from our API
  const fetchStatus = async (confirmationCode: string) => {
    if (!confirmationCode) return;
    setIsLoading(true);
    setStatus(null);
    setError(null);
    try {
      const response = await fetch(`/api/integrations/instagram/data-deletion-status?code=${confirmationCode}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch status.');
      }
      const data: DeletionStatus = await response.json();
      setStatus(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // On page load, check for a code in the URL params
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setCode(codeFromUrl);
      fetchStatus(codeFromUrl);
    }
  }, [searchParams]);

  const handleTrackClick = () => {
    fetchStatus(code);
  };

  return (
    <main className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-gray-800">
        <h1 className="text-2xl font-bold text-center mb-2">Request Status</h1>
        <p className="text-gray-500 text-center mb-6">
          Enter your confirmation code to track your data request.
        </p>

        {/* --- Input Form --- */}
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g., abc123xyz"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
          <button
            onClick={handleTrackClick}
            disabled={isLoading || !code}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isLoading ? '...' : 'Track'}
          </button>
        </div>
        
        {/* --- Dynamic Content Area --- */}
        <div className="mt-6 min-h-[150px]">
          {isLoading && <p className="text-center text-gray-500">Loading status...</p>}
          {error && <p className="text-center text-red-500 font-medium">{error}</p>}
          
          {status && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-gray-500">Case Opened</span>
                <span className="font-semibold">{new Date(status.caseOpenedDate).toLocaleDateString()}</span>
              </div>

              {/* --- The two status items --- */}
              <StatusItem label="Account Disconnection" status={status.disconnectionStatus} />
              <StatusItem label="Data Deletion" status={status.dataDeletionStatus} />

              <div className="flex justify-between items-center border-t pt-4 mt-4">
                <span className="text-sm text-gray-500">Tracking Available For</span>
                <span className="font-semibold text-blue-600">{getRemainingDays(status.caseOpenedDate)} more days</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center mt-8 text-gray-500">
        <p>Having trouble? Contact support at</p>
        <a href="mailto:londonstudentnetwork@gmail.com" className="text-gray-400 hover:text-white transition">
          londonstudentnetwork@gmail.com
        </a>
      </footer>
    </main>
  );
}

// A reusable component for displaying a status line item
function StatusItem({ label, status }: { label: string; status: DeletionStatus['disconnectionStatus' | 'dataDeletionStatus'] }) {
  const isNotRequested = status === 'Not Requested';
  
  const statusColors: Record<typeof status, string> = {
    'Completed': 'text-green-600 bg-green-100',
    'In Progress': 'text-yellow-600 bg-yellow-100',
    'Failed': 'text-red-600 bg-red-100',
    'Not Requested': 'text-gray-500 bg-gray-100',
  };

  return (
    <div className={`flex justify-between items-center p-3 rounded-lg ${isNotRequested ? 'opacity-70' : ''}`}>
      <span className="font-medium">{label}</span>
      <span className={`px-3 py-1 text-sm font-bold rounded-full ${statusColors[status]}`}>
        {status}
      </span>
    </div>
  );
}