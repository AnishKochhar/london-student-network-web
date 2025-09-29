import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export function useReferralTracking() {
    const { data: session, status } = useSession();

    useEffect(() => {
        // Only track when user is authenticated and session is loaded
        if (status !== 'authenticated' || !session?.user?.id) return;

        const trackReferral = async () => {
            try {
                // Check for referral data in sessionStorage
                const referralData = sessionStorage.getItem('referralData');
                if (!referralData) return;

                const { code, referrer } = JSON.parse(referralData);

                // Track the referral
                const response = await fetch('/api/referral/track', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ referralCode: code }),
                });

                const result = await response.json();

                if (result.success) {
                    // Show success message
                    toast.success(`Welcome! You were referred by ${referrer.name}`, {
                        duration: 5000,
                        icon: '🎉'
                    });

                    // Clear the referral data after successful tracking
                    sessionStorage.removeItem('referralData');
                } else {
                    console.error('Failed to track referral:', result.error);
                }
            } catch (error) {
                console.error('Error tracking referral:', error);
            }
        };

        // Small delay to ensure the session is fully loaded
        const timeout = setTimeout(trackReferral, 1000);

        return () => clearTimeout(timeout);
    }, [session?.user?.id, status]);
}

export default useReferralTracking;