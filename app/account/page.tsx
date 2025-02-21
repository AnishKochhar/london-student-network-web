
import dynamic from 'next/dynamic';
import { Metadata } from 'next';


// Dynamically import AccountContent with SSR disabled. This is so the entire tree isn't treated as a client side page
const AccountContent = dynamic(() => import('./account-content'), { ssr: false });

export const metadata: Metadata = {
	title: 'LSN Account Details',
	description: 'Your LSN account details, past events, and future events',
};


export default async function AccountPage() {
	return (
		<AccountContent />
	)
}

