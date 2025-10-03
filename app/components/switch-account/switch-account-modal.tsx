"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, EyeIcon, EyeSlashIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { getSavedAccounts, getInitials, removeAccount, saveAccount, type SavedAccount } from "@/app/lib/account-storage";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface SwitchAccountModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentUserEmail?: string;
}

export default function SwitchAccountModal({ isOpen, onClose, currentUserEmail }: SwitchAccountModalProps) {
	const [accounts, setAccounts] = useState<SavedAccount[]>([]);
	const [selectedAccount, setSelectedAccount] = useState<SavedAccount | null>(null);
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

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

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]"
						onClick={onClose}
					/>

					{/* Modal */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
						className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[10001]"
					>
						<div className="bg-white rounded-2xl shadow-2xl overflow-hidden mx-4">
							{/* Header */}
							<div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
								<div>
									<h2 className="text-2xl font-bold text-white">Switch Account</h2>
									<p className="text-blue-100 text-sm mt-1">Select an account to continue</p>
								</div>
								<button
									onClick={onClose}
									className="text-white/80 hover:text-white transition-colors"
								>
									<XMarkIcon className="w-6 h-6" />
								</button>
							</div>

							<div className="p-6">
								{accounts.length === 0 ? (
									<div className="text-center py-8">
										<p className="text-gray-500 mb-4">No other accounts saved</p>
										<button
											onClick={handleAddNew}
											className="text-blue-600 hover:text-blue-700 font-medium"
										>
											Add another account
										</button>
									</div>
								) : (
									<form onSubmit={handleSwitch} className="space-y-4">
										{/* Account List */}
										<div className="space-y-2">
											{accounts.map((account) => (
												<motion.div
													key={account.email}
													whileHover={{ scale: 1.02 }}
													whileTap={{ scale: 0.98 }}
													onClick={() => handleAccountSelect(account)}
													className={`relative flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${selectedAccount?.email === account.email
															? "bg-blue-50 border-2 border-blue-500"
															: "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
														}`}
												>
													{/* Avatar */}
													<div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${selectedAccount?.email === account.email
															? "bg-blue-600"
															: "bg-gray-400"
														}`}>
														{getInitials(account.name)}
													</div>

													{/* Account Info */}
													<div className="flex-1 min-w-0">
														<p className="font-semibold text-gray-900 truncate">
															{account.name}
														</p>
														<p className="text-sm text-gray-500 truncate">
															{account.email}
														</p>
													</div>

													{/* Radio Indicator */}
													<div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedAccount?.email === account.email
															? "border-blue-600"
															: "border-gray-300"
														}`}>
														{selectedAccount?.email === account.email && (
															<motion.div
																layoutId="selected-dot"
																className="w-3 h-3 rounded-full bg-blue-600"
																transition={{ type: "spring", stiffness: 300, damping: 30 }}
															/>
														)}
													</div>

													{/* Remove Button */}
													<button
														type="button"
														onClick={(e) => handleRemoveAccount(account.email, e)}
														className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
														aria-label="Remove account"
													>
														<XMarkIcon className="w-4 h-4" />
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
													transition={{ duration: 0.2 }}
													className="overflow-hidden"
												>
													<div className="pt-2">
														<label className="block text-sm font-medium text-gray-700 mb-2">
															Enter password for {selectedAccount.name}
														</label>
														<div className="relative">
															<input
																type={showPassword ? "text" : "password"}
																value={password}
																onChange={(e) => setPassword(e.target.value)}
																className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
																placeholder="Password"
																autoFocus
																disabled={isLoading}
															/>
															<button
																type="button"
																onClick={() => setShowPassword(!showPassword)}
																className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
										<div className="flex gap-3 pt-4">
											<button
												type="button"
												onClick={handleAddNew}
												className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
											>
												Add Account
											</button>
											<button
												type="submit"
												disabled={!selectedAccount || !password || isLoading}
												className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
}
