"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from "framer-motion";

interface AccountDropdownProps {
	userName: string | null;
	userEmail: string | null;
}

export default function AccountDropdown({ userName, userEmail }: AccountDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

	useEffect(() => {
		setMounted(true);
	}, []);

	const updatePosition = () => {
		if (triggerRef.current) {
			const rect = triggerRef.current.getBoundingClientRect();
			setPosition({
				top: rect.bottom + 8,
				left: rect.right - 224, // 224px = w-56
				width: rect.width,
			});
		}
	};

	const handleToggle = () => {
		if (!isOpen) {
			updatePosition();
		}
		setIsOpen(!isOpen);
	};

	const handleClose = () => {
		setIsOpen(false);
	};

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				triggerRef.current &&
				!triggerRef.current.contains(event.target as Node)
			) {
				handleClose();
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				handleClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('keydown', handleEscape);
			window.addEventListener('resize', updatePosition);
			window.addEventListener('scroll', updatePosition);
			
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
				document.removeEventListener('keydown', handleEscape);
				window.removeEventListener('resize', updatePosition);
				window.removeEventListener('scroll', updatePosition);
			};
		}
	}, [isOpen]);

	const dropdownContent = (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					ref={dropdownRef}
					initial={{ opacity: 0, scale: 0.95, y: -10 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95, y: -10 }}
					transition={{ duration: 0.15, ease: "easeOut" }}
					className="fixed z-[9999] w-56 bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl overflow-hidden"
					style={{
						top: position.top,
						left: position.left,
					}}
				>
					<div className="p-2">
						<Link 
							href="/account" 
							className="flex items-center space-x-3 py-3 px-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors group w-full"
							onClick={handleClose}
						>
							<UserCircleIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
							<span className="font-medium">My Account</span>
						</Link>
						
						<div className="h-px bg-gray-200 my-1" />
						
						<Link 
							href="/logout" 
							className="flex items-center space-x-3 py-3 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors group w-full"
							onClick={handleClose}
						>
							<svg className="h-5 w-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
							</svg>
							<span className="font-medium">Sign Out</span>
						</Link>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);

	return (
		<>
			<motion.button
				ref={triggerRef}
				className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-200"
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={handleToggle}
				aria-expanded={isOpen}
				aria-haspopup="true"
			>
				<UserCircleIcon className="h-6 w-6 text-white" />
				<span className="text-white text-sm font-medium hidden sm:block">
					{userName || userEmail}
				</span>
				<motion.div
					animate={{ rotate: isOpen ? 180 : 0 }}
					transition={{ duration: 0.2 }}
				>
					<ChevronDownIcon className="h-4 w-4 text-white/70" />
				</motion.div>
			</motion.button>

			{mounted && createPortal(dropdownContent, document.body)}
		</>
	);
}