"use client";

/**
 * Client Layout for Account Page
 * Handles UI chrome and client-side concerns only
 * Receives user data as props from parent server component
 */

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useReferralTracking } from '@/app/hooks/useReferralTracking';
import { saveAccount } from '@/app/lib/account-storage';

interface Props {
	children: ReactNode;
	userName: string;
	userEmail: string;
}

export default function AccountLayout({ children, userName, userEmail }: Props) {
	const router = useRouter();

	// 1. Referral tracking (runs once per session)
	useReferralTracking();

	// 2. Save to localStorage for account switching
	useEffect(() => {
		if (userEmail && userName) {
			saveAccount(userEmail, userName);
		}
	}, [userEmail, userName]);

	// 3. Scroll spy state
	const [activeSection, setActiveSection] = useState("personal");

	useEffect(() => {
		const sections = ['personal', 'events', 'registrations', 'referrals', 'forum', 'account'];

		const handleScroll = () => {
			const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			const offset = 150;

			let current = sections[0];
			for (const sectionId of sections) {
				const element = document.getElementById(sectionId);
				if (element && element.offsetTop <= scrollTop + offset) {
					current = sectionId;
				}
			}
			setActiveSection(current);
		};

		window.addEventListener('scroll', handleScroll);
		setTimeout(handleScroll, 100);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	// 4. Scroll to section helper
	const scrollToSection = (sectionId: string) => {
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
				inline: 'nearest'
			});
		}
	};

	// Navigation sections
	const sections = [
		{ id: "personal", label: "Personal information", icon: "👤" },
		{ id: "events", label: "Your events", icon: "📅" },
		{ id: "registrations", label: "Your registrations", icon: "🎫" },
		{ id: "referrals", label: "Your referrals", icon: "🤝" },
		{ id: "forum", label: "Forum activity", icon: "💬" },
		{ id: "account", label: "Account settings", icon: "⚙️" },
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
			<div className="flex max-w-7xl mx-auto min-h-screen">
				{/* Left Sidebar - Table of Contents */}
				<div className="hidden md:flex md:w-64 lg:w-80 xl:w-96 bg-white/5 backdrop-blur-sm border-r border-white/10 flex-shrink-0">
					<div className="sticky top-0 p-4 lg:p-8 w-full flex flex-col h-screen">
						{/* Header */}
						<div className="mb-8 flex-shrink-0">
							<div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
								<span className="text-xl lg:text-2xl">👤</span>
							</div>
							<h1 className="text-lg lg:text-2xl font-semibold text-white mb-2 truncate">
								{userName || "Your Account"}
							</h1>
							<p className="text-gray-300 text-xs lg:text-sm truncate">{userEmail}</p>
						</div>

						{/* Navigation */}
						<nav className="space-y-2 flex-grow">
							{sections.map((section) => (
								<button
									key={section.id}
									onClick={() => scrollToSection(section.id)}
									className={`w-full text-left px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-all duration-200 flex items-center gap-2 lg:gap-3 ${activeSection === section.id
											? "bg-white/20 text-white border border-white/20"
											: "text-gray-300 hover:bg-white/10 hover:text-white"
										}`}
								>
									<span className="text-base lg:text-lg flex-shrink-0">{section.icon}</span>
									<span className="font-medium text-sm lg:text-base truncate">{section.label}</span>
								</button>
							))}
						</nav>

						{/* Sign Out Button */}
						<div className="mt-auto pt-4 lg:pt-8 border-t border-white/10 flex-shrink-0">
							<button
								onClick={() => router.push("/logout")}
								className="w-full text-left text-red-300 hover:text-red-200 hover:bg-red-500/10 px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors text-sm lg:text-base"
							>
								Sign out
							</button>
						</div>
					</div>
				</div>

				{/* Right Content Area */}
				<div className="flex-1 min-h-screen">
					{children}
				</div>
			</div>
		</div>
	);
}
