"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";

interface GuestRegistrationModalProps {
	isOpen: boolean;
	onClose: () => void;
	eventId: string;
	eventTitle: string;
	onSuccess: () => void;
}

export default function GuestRegistrationModal({
	isOpen,
	onClose,
	eventId,
	eventTitle,
	onSuccess,
}: GuestRegistrationModalProps) {
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		setMounted(true);
		if (isOpen) {
			setIsAnimating(true);
		}
	}, [isOpen]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
			toast.error("Please fill in all fields");
			return;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			toast.error("Please enter a valid email address");
			return;
		}

		setIsLoading(true);
		const toastId = toast.loading("Registering for event...");

		try {
			const response = await fetch("/api/events/register-guest", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					event_id: eventId,
					firstName: formData.firstName.trim(),
					lastName: formData.lastName.trim(),
					email: formData.email.trim(),
				}),
			});

			const result = await response.json();

			if (result.success) {
				toast.success("Successfully registered for event!", {
					id: toastId,
				});
				onSuccess();
				onClose();
				setFormData({ firstName: "", lastName: "", email: "" });
			} else {
				if (result.alreadyRegistered) {
					toast.error("This email is already registered for the event!", {
						id: toastId,
					});
				} else {
					toast.error(result.error || "Error registering for event!", {
						id: toastId,
					});
				}
			}
		} catch (error) {
			toast.error("Network error. Please try again.", {
				id: toastId,
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	if (!mounted || !isOpen) return null;

	const modalContent = (
		<div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
					isAnimating ? "opacity-100" : "opacity-0"
				}`}
				onClick={onClose}
			/>

			{/* Modal */}
			<div
				className={`relative bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-500 ease-out ${
					isAnimating
						? "translate-y-0 scale-100 opacity-100"
						: "translate-y-8 scale-95 opacity-0 sm:translate-y-4"
				}`}
				style={{
					animation: isAnimating ? "bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)" : undefined,
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<div>
						<h2 className="text-xl font-semibold text-gray-900">
							Register as Guest
						</h2>
						<p className="text-sm text-gray-600 mt-1">
							{eventTitle}
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
						disabled={isLoading}
					>
						<X className="w-5 h-5 text-gray-500" />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6">
					<div className="space-y-4">
						<div>
							<label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
								First Name
							</label>
							<input
								type="text"
								id="firstName"
								name="firstName"
								value={formData.firstName}
								onChange={handleInputChange}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900"
								placeholder="Enter your first name"
								disabled={isLoading}
								required
							/>
						</div>

						<div>
							<label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
								Last Name
							</label>
							<input
								type="text"
								id="lastName"
								name="lastName"
								value={formData.lastName}
								onChange={handleInputChange}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900"
								placeholder="Enter your last name"
								disabled={isLoading}
								required
							/>
						</div>

						<div>
							<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
								Email Address
							</label>
							<input
								type="email"
								id="email"
								name="email"
								value={formData.email}
								onChange={handleInputChange}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900"
								placeholder="Enter your email address"
								disabled={isLoading}
								required
							/>
						</div>
					</div>

					<div className="flex gap-3 mt-6">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={isLoading}
						>
							{isLoading ? "Registering..." : "Register"}
						</button>
					</div>
				</form>
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