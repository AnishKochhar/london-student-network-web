"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import Link from 'next/link'
import Image from 'next/image';
import AuthButton from './auth-button';
import AccountButton from './account-button';
import { Button } from './button';
import { useSession } from 'next-auth/react';


export default function Header() {
	const pathname = usePathname();
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
	const closeMenu = () => setIsMenuOpen(false);

	return (
		<header className="sticky top-0 left-0 w-full backdrop-blur border-b-2 border-gray-300 border-opacity-25 flex justify-between items-center px-8 shadow-md text-white bg-[#041A2E]/80 z-40">
			<Logo closeMenu={closeMenu} />

			<NavLinks pathname={pathname} className="hidden md:flex space-x-8" />

			<div className="flex items-center space-x-4">
				<div className="hidden md:flex">
					<AccountButton />

				</div>
				<Button variant='ghost' onClick={toggleMenu} className='md:hidden'>Menu</Button>
			</div>

			{isMenuOpen && (
				<FullScreenMenu closeMenu={closeMenu} pathname={pathname} />
			)}

		</header>
	);
}

function Logo({ closeMenu }: { closeMenu: () => void }) {
	return (
		<Link href='/' onClick={closeMenu} className="flex items-center space-x-2">
			<Image src='/logo/LSN LOGO 1.png' alt='LSN logo' priority width={96} height={96} className='w-20 md:w-24' />
		</Link>
	)
}

function NavLinks({ pathname, className, onClick }: { pathname: string, className?: string, onClick?: () => void }) {
	return (
		<nav className={clsx(className, "text-white")}>
			<Link href="/events" onClick={onClick} className={clsx(
				pathname === '/events' ? 'underline' : 'no-underline',
				'hover:underline transition-all md:text-xl'
			)}>
				Events
			</Link>
			<Link href="/sponsors" onClick={onClick} className={clsx(
				pathname === '/sponsors' ? 'underline' : 'no-underline',
				'hover:underline transition-all md:text-xl aria-disabled:'
			)}>
				Sponsors
			</Link>
			<Link href="/societies" onClick={onClick} className={clsx(
				pathname === '/societies' ? 'underline' : 'no-underline',
				'hover:underline transition-all md:text-xl aria-disabled:'
			)}>
				Societies
			</Link>
			<Link href="/forum" onClick={onClick} className={clsx(
				pathname === '/forum' ? 'underline' : 'no-underline',
				'hover:underline transition-all md:text-xl'
			)}>
				Forum
			</Link>
			<Link href="/about" onClick={onClick} className={clsx(
				pathname === '/about' ? 'underline' : 'no-underline',
				'hover:underline transition-all md:text-xl'
			)}>
				About
			</Link>
			<Link href="/contact" onClick={onClick} className={clsx(
				pathname === '/contact' ? 'underline' : 'no-underline',
				'hover:underline transition-all md:text-xl aria-disabled:'
			)}>
				Contact Us
			</Link>
		</nav>
	);
}

function FullScreenMenu({ closeMenu, pathname }: { closeMenu: () => void, pathname: string }) {

	const session = useSession()

	return (
		<div className="fixed inset-0 z-50 flex flex-col justify-start bg-[#041A2E] min-h-screen px-8" >
			<div className="flex justify-between items-center mb-8">
				<Logo closeMenu={closeMenu} />
				<Button variant='ghost' onClick={closeMenu} className="text-lg font-semibold">Close</Button>
			</div>
			<NavLinks pathname={pathname} onClick={closeMenu} className="flex flex-col space-y-6 text-lg" />
			<div className="self-center w-full h-0.5 my-10 bg-white mx-20"></div>
			<div className='self-end'>
				<AuthButton onClick={closeMenu} />
			</div>
			
			{session?.data?.user && (
				<Button variant='ghost' className='self-end mt-4' onClick={closeMenu} >
					<Link href='/account' className='py-2 text-xl text-right'>My Account</Link>
				</Button>
			)}
			
		</div>
	);
}

