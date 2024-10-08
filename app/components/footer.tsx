'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from './button';
import { useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { Input } from './input';

export default function Footer() {
	const [email, setEmail] = useState('');

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		
		try {
			const data = {
				name: 'Newsletter Subscription',
				email: email,
				message: `Newsletter subscription request for email: ${email}`,
			};

			const response = await fetch('/api/send-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (response.ok) {
				setEmail(''); 
			} 
		} catch (error) {
			console.error('Error submitting the form:', error);
		}
		
	};

	return (
		<footer className="bg-blue-600/25 text-white px-8 py-4 border-t-2 border-gray-300 border-opacity-25">
			<div className="mx-auto my-auto flex flex-col md:flex-row justify-between items-center h-full space-y-3">

				{/* Social Links and Terms & Conditions (mobile layout) */}
				<div className="flex flex-row md:flex-col items-center justify-between w-full md:w-auto md:space-x-8">
					{/* Social Media Icons */}
					<div className="flex flex-row space-x-4 mb-2">
						<Link href="https://www.instagram.com/lsn.uk/" target="_blank" rel="noreferrer" aria-label="Instagram">
							<Image
								src="/icons/instagram.svg"
								alt="Instagram"
								width={24}
								height={24}
								className="w-6 h-6"
							/>
						</Link>
						<Link href="https://www.linkedin.com/company/london-student-network/mycompany" target="_blank" rel="noreferrer" aria-label="LinkedIn">
							<Image
								src="/icons/linkedin.svg"
								alt="LinkedIn"
								width={24}
								height={24}
								className="w-6 h-6"
							/>
						</Link>
						<Link href="mailto:londonstudentnetwork@gmail.com" aria-label="Email">
							<Image
								src="/icons/mail.svg"
								alt="Email"
								width={24}
								height={24}
								className="w-6 h-6 mt-1"
							/>
						</Link>
					</div>

					{/* Terms and Conditions - visible on all screens */}
					<Link
						href="/terms-conditions"
						className="text-xs md:text-sm text-center text-white underline hover:text-blue-400 mt-2"
					>
						Terms and Conditions
					</Link>
				</div>

				{/* Copyright - visible only on desktop */}
				<h2 className="hidden md:flex text-sm text-white/70 text-center font-semibold">Copyright © 2024 London Student Network</h2>

				{/* Newsletter Subscription */}
				<div className="flex flex-col items-center justify-end">
					<h2 className="w-full text-start text-sm lg:text-md text-white font-semibold mb-2 mt-2">SUBSCRIBE TO OUR NEWSLETTER</h2>
					<form onSubmit={handleSubmit} className="flex items-center h-auto">
						<Input
							type="email"
							placeholder="Enter your email"
							className="h-full px-4 py-3 bg-transparent text-white outline-none ring-2 ring-white/20"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
						<Button
							variant='outline'
							type="submit"
							className="h-full py-3 rounded-none border-none"
						>
							<ArrowRightIcon className='w-4 h-4 text-white' />
						</Button>
					</form>
				</div>
			</div>
		</footer>
	);
}

