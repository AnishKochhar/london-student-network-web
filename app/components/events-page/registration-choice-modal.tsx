"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

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
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		setMounted(true);
		if (isOpen) {
			setIsAnimating(true);
		}
	}, [isOpen]);

	const handleLoginRedirect = () => {
		router.push("/sign");
	};

	if (!mounted || !isOpen) return null;

	const modalContent = (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
					isAnimating ? "opacity-100" : "opacity-0"
				}`}
				onClick={onClose}
			/>

			{/* Modal */}
			<div
				className={`relative bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-500 ease-out ${
					isAnimating
						? "translate-y-0 scale-100 opacity-100"
						: "translate-y-8 scale-95 opacity-0 sm:translate-y-4"
				}`}
				style={{
					animation: isAnimating ? "bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)" : undefined,
				}}
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
							onClick={onGuestRegister}
							className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
						>
							Register as Guest
						</button>
					</div>

					<p className="text-xs text-gray-500 mt-4 text-center">
						Logged-in users get additional benefits and can manage their registrations.
					</p>
				</div>
			</div>
		</div>
	);

	return createPortal(
		<>
			<style jsx>{`
				@keyframes bounceIn {
					0% {
						transform: scale(0.3) translateY(100px);
						opacity: 0;
					}
					50% {
						transform: scale(1.05) translateY(-10px);
					}
					70% {
						transform: scale(0.9) translateY(0px);
					}
					100% {
						transform: scale(1) translateY(0px);
						opacity: 1;
					}
				}
			`}</style>
			{modalContent}
		</>,
		document.body
	);
}