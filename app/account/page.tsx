'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/components/button';
import UserEventsList from '../components/account/user-events-list';
import AccountFields from '../components/account/account-fields';
import AccountLogo from '../components/account/account-logo';
import ForgottenPasswordModal from '../components/login/reset-password-modal';
import StripeConnectStatus from '../components/account/stripe-connect/stripe-connect-status';
import Head from 'next/head';

// note for improvement, use suspense or loading states to handle initial loading of tags, as it shows an unpleasent
// unknown(number) value, while the tags are loaded in in the initial render. It only shows for less than a second however. 
// You can also just remove the fetch-predefined-tags component and couple the logic where it is needed.

export default function AccountPage() {
    const [showForgottenPasswordModal, setShowForgottenPasswordModal] = useState(false);
    const { data: session, status } = useSession()

    const router = useRouter()


    useEffect(() => {
        if (status === 'loading') return;
        if (!session) router.push('/login');
    }, [session, status, router]);

    const handleForgottenPasswordPress = () => {
        setShowForgottenPasswordModal(true);
    }


    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Loading your account details...</p>
            </div>
        )
    }

    if (session) {
        const { user } = session;

        return (
			<>
				{/* Metadata - this is a test implementation for learning purposes */}
				<Head>
					<title>Account Page | Your Events & Details</title>
					<meta name="description" content="View and manage your London Student Network account details, events, and Stripe Connect account affiliated with LSN." />
				</Head>
				
				<div className="min-h-screen flex flex-col justify-start p-10 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] overflow-x-hidden">
					<h1 className="text-4xl font-semibold mb-6">Your account</h1>

					<div className="border-b border-gray-300 pb-4 ml-4 mb-10 space-y-6">
						<h2 className="text-2xl italic mb-2 ml-2">Your details</h2>
						<div className='flex flex-col md:flex-row'>
							<div className='w-full'>
								<p className="text-sm">
									<h3 className="text-lg font-semibold mb-2 text-white">Name</h3>
									<hr className="border-t-1 border-gray-300 w-2/3 my-2" />
									<p className="text-gray-100 whitespace-pre-wrap font-bold">{user?.name || 'Test User'}</p>
								</p>
								<p className="text-sm mt-6">
									<h3 className="text-lg font-semibold mb-2 text-white">Email</h3>
									<hr className="border-t-1 border-gray-300 w-2/3 my-2" />
									<p className="text-gray-100 whitespace-pre-wrap font-bold">{user?.email || 'test@lsn.co.uk'}</p>
								</p>
								<p className="text-sm capitalize mt-6">
									<h3 className="text-lg font-semibold mb-2 text-white">Role</h3>
									<hr className="border-t-1 border-gray-300 w-2/3 my-2" />
									<p className="text-gray-100 whitespace-pre-wrap font-bold">{user?.role || 'user'}</p>
								</p>

							</div>
							{user.role === 'organiser' &&
								<div className="w-full order-first md:order-none md:ml-auto flex justify-center items-center">
									<AccountLogo id={user.id} role={user.role} />
								</div>
							}
						</div>
						{user.role === 'organiser' && < AccountFields id={user.id} role={user.role} />}
						{user.role === 'organiser' && 
							<StripeConnectStatus id={user.id} />
						}
						<div className="pb-4 mb-10 space-y-6">				
							{/* <Button
								variant="filled"
								className="bg-blue-600 text-white my-4 py-2 px-4 rounded-full"
								onClick={() => router.push('account/edit-details')}
							>
								Edit Details
							</Button> */}
							{/* Edit Account Details Button */}
							<button
								onClick={() => router.push('/account/edit-details')}
								className="btn btn-primary mt-4"
								>
								Edit Account Details
							</button>
						</div>
					</div>

					<div className="border-b border-gray-300 pb-4 ml-4 mb-10 space-y-6">
						<h2 className="text-2xl italic mb-2 ml-2">Your events</h2>
						<UserEventsList user_id={user.id} editEvent={true}/>
					</div>

					<div className="flex justify-end self-end space-x-2">
						<Button
							variant='filled'
							className="bg-sky-600 hover:bg-sky-800 text-white py-2 px-4 rounded-full"
							onClick={handleForgottenPasswordPress}
						>
							Reset Your Password
						</Button>
						<Button
							variant='filled'
							className="bg-red-600 hover:bg-red-900 text-white py-2 px-4 rounded-full"
							onClick={() => router.push('/logout')}
						>
							Sign Out
						</Button>
					</div>
					{showForgottenPasswordModal && (
						<ForgottenPasswordModal
							onClose={() => setShowForgottenPasswordModal(false)}
						/>
					)}
				</div>
			</>
        );
    }

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="text-center">
                <ExclamationCircleIcon className="h-10 w-10 text-red-500 mx-auto" />
                <p className="mt-2 text-lg">Something went wrong. Please try again later.</p>
            </div>
        </div>
    );
}


