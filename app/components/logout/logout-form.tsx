"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from '@/app/components/button';


export default function LogoutForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const router = useRouter()

	const handleLogout = async () => {
		setIsLoading(true);
		setErrorMessage(null);

		try {
			signOut({ callbackUrl: '/login' });
			// await signOut({ redirect: false })
			// router.push('/')
		} catch (error) {
			console.error("Logout failed:", error);
			setErrorMessage("Failed to log out. Please try again.");
			setIsLoading(false);
		}
	};

	// const handleLogout = async () => {
	// 	setIsLoading(true);
	// 	setErrorMessage(null);

	// 	signOut({ redirect: false })

	// };

	const returnHome = () => {
		router.push('/')
	}

	return (
		<div className="flex flex-col items-center justify-center h-full p-10 space-y-20">
			<div>
				<h2 className="text-2xl font-bold mb-4 text-center">Are you sure you would like to<br />log out of this account</h2>
				<span className="block w-full h-px bg-gray-500 mt-1"></span>
			</div>

			{errorMessage && (
				<p className="text-red-500 text-sm mb-4">{errorMessage}</p>
			)}

			<div className="flex space-x-4">
								<Button
					variant="filled"
					onClick={handleLogout}
					disabled={isLoading}
				>
					{isLoading ? (
						<span className="flex items-center space-x-2">
							<svg
								className="animate-spin h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8V12H4z"
								></path>
							</svg>
							<span>Logging Out...</span>
						</span>
					) : (
						"Log Out"
					)}
				</Button>
								<Button
					variant="filled"
					onClick={returnHome}
					disabled={isLoading}
					className="bg-gray-300 text-gray-700 hover:bg-gray-400"
				>
					Cancel
				</Button>
			</div>
		</div>
	);
}
