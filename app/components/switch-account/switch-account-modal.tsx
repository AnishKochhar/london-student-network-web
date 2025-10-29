"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo, useMotionValue } from "framer-motion";
import { XMarkIcon, EyeIcon, EyeSlashIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { getSavedAccounts, getInitials, removeAccount, saveAccount, type SavedAccount } from "@/app/lib/account-storage";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

interface SwitchAccountModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentUserEmail?: string;
	triggerRef?: React.RefObject<HTMLButtonElement>;
}

export default function SwitchAccountModal({ isOpen, onClose, currentUserEmail, triggerRef }: SwitchAccountModalProps) {
	const [accounts, setAccounts] = useState<SavedAccount[]>([]);
	const [selectedAccount, setSelectedAccount] = useState<SavedAccount | null>(null);
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const router = useRouter();
	const y = useMotionValue(0);
	const sheetRef = useRef<HTMLDivElement>(null);

	// Mount check for portal
	useEffect(() => {
		setMounted(true);
	}, []);

	// Calculate position based on trigger button
	const updatePosition = () => {
		if (triggerRef?.current) {
			const rect = triggerRef.current.getBoundingClientRect();
			setPosition({
				top: rect.bottom + 8,
				left: rect.right - 384, // 384px = max-w-sm (24rem)
			});
		}
	};

	// Update position when modal opens
	useEffect(() => {
		if (isOpen && triggerRef) {
			updatePosition();
			window.addEventListener('resize', updatePosition);
			window.addEventListener('scroll', updatePosition);
			return () => {
				window.removeEventListener('resize', updatePosition);
				window.removeEventListener('scroll', updatePosition);
			};
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, triggerRef]);

	// Body scroll lock (only on mobile)
	useEffect(() => {
		if (isOpen && !triggerRef) {
			// Only lock scroll on mobile (when no triggerRef, modal is centered)
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = '';
			};
		}
	}, [isOpen, triggerRef]);

	useEffect(() => {
		if (isOpen) {
			const saved = getSavedAccounts();
			// Filter out current user
			const filtered = saved.filter(acc => acc.email !== currentUserEmail);
			setAccounts(filtered);
			setSelectedAccount(null);
			setPassword("");
			setShowPassword(false);
		}
	}, [isOpen, currentUserEmail]);

	const handleAccountSelect = (account: SavedAccount) => {
		setSelectedAccount(account);
		setPassword("");
	};

	const handleRemoveAccount = (email: string, e: React.MouseEvent) => {
		e.stopPropagation();
		removeAccount(email);
		const updated = accounts.filter(acc => acc.email !== email);
		setAccounts(updated);
		if (selectedAccount?.email === email) {
			setSelectedAccount(null);
			setPassword("");
		}
		toast.success("Account removed");
	};

	const handleSwitch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedAccount || !password) return;

		setIsLoading(true);
		const toastId = toast.loading("Switching account...");

		try {
			const result = await signIn("credentials", {
				email: selectedAccount.email,
				password: password,
				redirect: false,
			});

			if (result?.error) {
				toast.error("Incorrect password", { id: toastId });
				setIsLoading(false);
				return;
			}

			// Update the lastUsed timestamp for this account
			saveAccount(selectedAccount.email, selectedAccount.name);

			toast.success(`Switched to ${selectedAccount.name}`, { id: toastId });
			onClose();
			router.push("/account");
			router.refresh();
		} catch (error) {
			console.error("Switch error:", error);
			toast.error("Failed to switch account", { id: toastId });
			setIsLoading(false);
		}
	};

	const handleAddNew = () => {
		onClose();
		router.push("/logout?redirect=/login");
	};

	// Drag to close handlers for mobile
	const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
		const shouldClose = info.velocity.y > 500 || (info.velocity.y >= 0 && info.offset.y > 100);
		if (shouldClose) {
			onClose();
		} else {
			y.set(0);
		}
	};

	if (!isOpen) return null;
	if (!mounted) return null;

	const modalContent = (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]"
						onClick={onClose}
					/>

					{/* Modal - Desktop positioned near button, Mobile bottom sheet */}
					<motion.div
						initial={{ opacity: 0, scale: 0.96, y: triggerRef ? -10 : 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.96, y: triggerRef ? -10 : 10 }}
						transition={{ type: "spring", damping: 30, stiffness: 300 }}
						className="fixed w-full max-w-sm z-[100000] hidden sm:block"
						style={triggerRef ? {
							top: position.top,
							left: position.left,
						} : {
							left: '50%',
							top: '50%',
							transform: 'translate(-50%, -50%)',
						}}
					>
						<div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden mx-4 border border-gray-200/50">
							{/* Header */}
							<div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200/50">
								<div className="flex items-center justify-between">
									<h2 className="text-lg sm:text-xl font-semibold text-gray-900">Switch Account</h2>
									<button
										onClick={onClose}
										className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
										title="Close"
									>
										<XMarkIcon className="w-5 h-5" />
									</button>
								</div>
							</div>

							<div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 sm:pt-4">
								{accounts.length === 0 ? (
									<div className="text-center py-6 sm:py-8">
										<p className="text-gray-500 text-sm mb-4">No saved accounts</p>
										<button
											onClick={handleAddNew}
											className="text-gray-700 hover:text-gray-900 font-medium text-sm underline underline-offset-2"
											title="Sign in with a different account"
										>
											Sign in with another account
										</button>
									</div>
								) : (
									<form onSubmit={handleSwitch} className="space-y-4">
										{/* Account List */}
										<div className="space-y-2.5">
											{accounts.map((account) => (
												<motion.div
													key={account.email}
													whileHover={{ scale: 1.01 }}
													whileTap={{ scale: 0.99 }}
													onClick={() => handleAccountSelect(account)}
													className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${selectedAccount?.email === account.email
															? "bg-gray-100 border border-gray-300"
															: "bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
														}`}
												>
													{/* Avatar */}
													<div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${selectedAccount?.email === account.email
															? "bg-gray-700 text-white"
															: "bg-gray-200 text-gray-600"
														}`}>
														{getInitials(account.name)}
													</div>

													{/* Account Info */}
													<div className="flex-1 min-w-0">
														<p className="font-medium text-gray-900 text-sm truncate">
															{account.name}
														</p>
														<p className="text-xs text-gray-500 truncate">
															{account.email}
														</p>
													</div>

													{/* Radio Indicator */}
													<div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedAccount?.email === account.email
															? "border-gray-700"
															: "border-gray-300"
														}`}>
														{selectedAccount?.email === account.email && (
															<motion.div
																layoutId="selected-dot"
																className="w-2.5 h-2.5 rounded-full bg-gray-700"
																transition={{ type: "spring", stiffness: 400, damping: 30 }}
															/>
														)}
													</div>

													{/* Remove Button */}
													<button
														type="button"
														onClick={(e) => handleRemoveAccount(account.email, e)}
														className="absolute -top-1 -right-1 p-1 bg-white text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 rounded-full shadow-sm border border-gray-200"
														title="Remove this account from quick access"
														aria-label="Remove account"
													>
														<XMarkIcon className="w-3.5 h-3.5" />
													</button>
												</motion.div>
											))}
										</div>

										{/* Password Input - appears when account selected */}
										<AnimatePresence mode="wait">
											{selectedAccount && (
												<motion.div
													initial={{ opacity: 0, height: 0 }}
													animate={{ opacity: 1, height: "auto" }}
													exit={{ opacity: 0, height: 0 }}
													transition={{ duration: 0.15 }}
													className="overflow-hidden"
												>
													<div className="pt-1">
														<label className="block text-xs font-medium text-gray-600 mb-2">
															Password for {selectedAccount.name}
														</label>
														<div className="relative">
															<input
																type={showPassword ? "text" : "password"}
																value={password}
																onChange={(e) => setPassword(e.target.value)}
																className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 pr-10 placeholder:text-gray-400"
																placeholder="Enter password"
																autoFocus
																disabled={isLoading}
															/>
															<button
																type="button"
																onClick={() => setShowPassword(!showPassword)}
																className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
																title={showPassword ? "Hide password" : "Show password"}
															>
																{showPassword ? (
																	<EyeSlashIcon className="w-4 h-4" />
																) : (
																	<EyeIcon className="w-4 h-4" />
																)}
															</button>
														</div>
													</div>
												</motion.div>
											)}
										</AnimatePresence>

										{/* Action Buttons */}
										<div className="flex gap-2.5 pt-3 border-t border-gray-200/50 mt-4">
											<button
												type="button"
												onClick={handleAddNew}
												className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
												title="Sign in with a different account"
											>
												Add Account
											</button>
											<button
												type="submit"
												disabled={!selectedAccount || !password || isLoading}
												className="flex-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
												title={!selectedAccount ? "Select an account first" : !password ? "Enter password to continue" : "Switch to selected account"}
											>
												{isLoading ? (
													<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
												) : (
													<>
														Switch
														<ArrowRightIcon className="w-3.5 h-3.5" />
													</>
												)}
											</button>
										</div>
									</form>
								)}
							</div>
						</div>
					</motion.div>

					{/* Mobile Bottom Sheet */}
					<motion.div
						ref={sheetRef}
						initial={{ y: "100%" }}
						animate={{ y: 0 }}
						exit={{ y: "100%" }}
						transition={{ type: "spring", damping: 30, stiffness: 300 }}
						drag="y"
						dragConstraints={{ top: 0, bottom: 0 }}
						dragElastic={{ top: 0, bottom: 0.5 }}
						onDragEnd={handleDragEnd}
						style={{ y }}
						className="fixed bottom-0 left-0 right-0 z-[100000] sm:hidden pb-safe"
					>
						<div className="bg-white rounded-t-3xl shadow-2xl border-t border-gray-200/50 max-h-[85vh] overflow-y-auto pb-safe">
							{/* Mobile Handle - Now interactive */}
							<div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
								<div className="w-10 h-1 bg-gray-300 rounded-full" />
							</div>

							{/* Header */}
							<div className="px-5 py-3 border-b border-gray-200/50">
								<div className="flex items-center justify-between">
									<h2 className="text-lg font-semibold text-gray-900">Switch Account</h2>
									<button
										onClick={onClose}
										className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
										title="Close"
									>
										<XMarkIcon className="w-5 h-5" />
									</button>
								</div>
							</div>

							<div className="px-5 pb-6 pt-4">
								{accounts.length === 0 ? (
									<div className="text-center py-10">
										<p className="text-gray-500 text-sm mb-4">No saved accounts</p>
										<button
											onClick={handleAddNew}
											className="text-gray-700 hover:text-gray-900 font-medium text-sm underline underline-offset-2 active:scale-95"
											title="Sign in with a different account"
										>
											Sign in with another account
										</button>
									</div>
								) : (
									<form onSubmit={handleSwitch} className="space-y-4">
										{/* Account List */}
										<div className="space-y-3">
											{accounts.map((account) => (
												<motion.div
													key={account.email}
													whileTap={{ scale: 0.98 }}
													onClick={() => handleAccountSelect(account)}
													className={`group relative flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${selectedAccount?.email === account.email
															? "bg-gray-100 border-2 border-gray-300"
															: "bg-white border-2 border-gray-200 active:border-gray-300"
														}`}
												>
													{/* Avatar */}
													<div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${selectedAccount?.email === account.email
															? "bg-gray-700 text-white"
															: "bg-gray-200 text-gray-600"
														}`}>
														{getInitials(account.name)}
													</div>

													{/* Account Info */}
													<div className="flex-1 min-w-0">
														<p className="font-medium text-gray-900 text-base truncate">
															{account.name}
														</p>
														<p className="text-sm text-gray-500 truncate">
															{account.email}
														</p>
													</div>

													{/* Radio Indicator */}
													<div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedAccount?.email === account.email
															? "border-gray-700"
															: "border-gray-300"
														}`}>
														{selectedAccount?.email === account.email && (
															<motion.div
																layoutId="selected-dot-mobile"
																className="w-3 h-3 rounded-full bg-gray-700"
																transition={{ type: "spring", stiffness: 400, damping: 30 }}
															/>
														)}
													</div>

													{/* Remove Button */}
													<button
														type="button"
														onClick={(e) => handleRemoveAccount(account.email, e)}
														className="absolute -top-1.5 -right-1.5 p-1.5 bg-white text-gray-400 hover:text-red-500 transition-colors rounded-full shadow-md border border-gray-200 active:scale-90"
														title="Remove this account from quick access"
														aria-label="Remove account"
													>
														<XMarkIcon className="w-4 h-4" />
													</button>
												</motion.div>
											))}
										</div>

										{/* Password Input */}
										<AnimatePresence mode="wait">
											{selectedAccount && (
												<motion.div
													initial={{ opacity: 0, height: 0 }}
													animate={{ opacity: 1, height: "auto" }}
													exit={{ opacity: 0, height: 0 }}
													transition={{ duration: 0.15 }}
													className="overflow-hidden"
												>
													<div className="pt-1">
														<label className="block text-sm font-medium text-gray-600 mb-2">
															Password for {selectedAccount.name}
														</label>
														<div className="relative">
															<input
																type={showPassword ? "text" : "password"}
																value={password}
																onChange={(e) => setPassword(e.target.value)}
																className="w-full px-4 py-3.5 text-base text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 pr-12 placeholder:text-gray-400"
																placeholder="Enter password"
																autoFocus
																disabled={isLoading}
															/>
															<button
																type="button"
																onClick={() => setShowPassword(!showPassword)}
																className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-2 active:scale-90"
																title={showPassword ? "Hide password" : "Show password"}
															>
																{showPassword ? (
																	<EyeSlashIcon className="w-5 h-5" />
																) : (
																	<EyeIcon className="w-5 h-5" />
																)}
															</button>
														</div>
													</div>
												</motion.div>
											)}
										</AnimatePresence>

										{/* Action Buttons */}
										<div className="flex gap-3 pt-4 border-t border-gray-200/50 mt-5">
											<button
												type="button"
												onClick={handleAddNew}
												className="flex-1 px-4 py-3.5 text-base border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors active:scale-95"
												title="Sign in with a different account"
											>
												Add Account
											</button>
											<button
												type="submit"
												disabled={!selectedAccount || !password || isLoading}
												className="flex-1 px-4 py-3.5 text-base bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-95"
												title={!selectedAccount ? "Select an account first" : !password ? "Enter password to continue" : "Switch to selected account"}
											>
												{isLoading ? (
													<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
												) : (
													<>
														Switch
														<ArrowRightIcon className="w-4 h-4" />
													</>
												)}
											</button>
										</div>
									</form>
								)}
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);

	// Use portal to escape stacking context issues
	return createPortal(modalContent, document.body);
}
