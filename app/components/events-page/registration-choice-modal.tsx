"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RegistrationChoiceModalProps {
	isOpen: boolean;
	onClose: () => void;
	onGuestRegister: () => void;
	eventTitle: string;
}

export default function RegistrationChoiceModal({
	isOpen,
	onClose,
	onGuestRegister,
	eventTitle,
}: RegistrationChoiceModalProps) {
	const router = useRouter();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const handleLoginRedirect = () => {
		onClose();
		router.push("/login");
	};

	const handleGuestRegisterClick = () => {
		onGuestRegister();
	};

	if (!mounted) return null;

	const modalContent = (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="absolute inset-0 bg-black/50 backdrop-blur-sm"
						onClick={onClose}
					/>

					{/* Modal */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
						className="relative bg-white rounded-xl shadow-2xl max-w-md w-full"
						onClick={(e) => e.stopPropagation()}
					>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<div>
						<h2 className="text-xl font-semibold text-gray-900">
							Register for Event
						</h2>
						<p className="text-sm text-gray-600 mt-1">
							{eventTitle}
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<X className="w-5 h-5 text-gray-500" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					<p className="text-gray-600 mb-6">
						To register for this event, you can either log in to your account or register as a guest.
					</p>

					<div className="space-y-3">
						<button
							onClick={handleLoginRedirect}
							className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
						>
							Log In to Account
						</button>

						<button
							onClick={handleGuestRegisterClick}
							className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
						>
							Register as Guest
						</button>
					</div>

					<p className="text-xs text-gray-500 mt-4 text-center">
						Logged-in users get additional benefits and can manage their registrations.
					</p>
				</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);

	return createPortal(modalContent, document.body);
}