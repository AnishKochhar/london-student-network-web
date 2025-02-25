'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutReturn({ searchParams }: { searchParams: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { session_id, email, user_id, name, event_id } = searchParams;

  useEffect(() => {
    const processPayment = async () => {
      try {
        // 1. Check session status
        const sessionRes = await fetch(`/api/payments/check-session?session_id=${session_id}`);
        const session = await sessionRes.json();

        if (!sessionRes.ok) {
          router.push(`/registration/payment-complete/server-error`);
          return;
        }

        // 2. Process registration
        // const { event_id, user_information } = await req.json();
        // const user: { email: string, id: string, name: string } = user_information
        let registrationSuccess = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const regRes = await fetch('/api/events/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event_id,
                user_information: {
                  email,
                  id: user_id,
                  name
                }
              })
            });

            if (regRes.ok) {
              registrationSuccess = true;
              break;
            }
          } catch (err) {
            if (attempt === 3) throw err;
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          }
        }

        if (!registrationSuccess) {
          router.push(`/registration/payment-complete/server-error`);
          return;
        }

        // 3. Get event information
        const eventInfoRes = await fetch(`/api/event-info?event_id=${event_id}`);
        const eventInfo = await eventInfoRes.json();
        
        if (!eventInfoRes.ok) {
          router.push(`/registration/payment-complete/server-error`);
          return;
        }

        // 4. Send user email
        let emailSuccess = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const emailRes = await fetch('/api/send-user-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                event: eventInfo.event
              })
            });

            if (emailRes.ok) {
              emailSuccess = true;
              break;
            }
          } catch (err) {
            if (attempt === 3) throw err;
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          }
        }

        if (!emailSuccess) {
          router.push(`/registration/payment-complete/email-error`);
          return;
        }

        // 5. Send organizer email (fire-and-forget)
        fetch('/api/send-organizer-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: email,
            userName: name,
            eventId: event_id
          })
        }).catch(console.error);

        // Final success
        router.push(`/registration/payment-complete/success/thank-you`);

      } catch (err) {
        console.error('Payment processing failed:', err);
        router.push(`/registration/payment-complete/server-error`);
      } finally {
        setLoading(false);
      }
    };

    processPayment();
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
