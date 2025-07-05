"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Registrations } from "@/app/lib/types";
import { createPortal } from 'react-dom';
import toast from "react-hot-toast";
import { Button } from "../button";

interface RegistrationsModalProps {
	registrations: Registrations[]
	onClose: () => void;
}

export default function RegistrationsModal({ registrations, onClose }: RegistrationsModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	
	// Separate registrations
	const internalRegistrations = registrations.filter(reg => !reg.external);
	const externalRegistrations = registrations.filter(reg => reg.external);

	// Disable background scroll and handle outside click detection
	useEffect(() => {
		document.body.style.overflow = 'hidden';

		const handleClickOutside = (event: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.body.style.overflow = '';
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [onClose]);

	const copyEmailsToClipboard = () => {
		const emails = registrations.map((reg) => reg.user_email).join(", ");
		navigator.clipboard.writeText(emails).then(() => {
			toast.success("Emails copied to clipboard!");
		}).catch((error) => {
			console.error("Failed to copy emails:", error);
			toast.error("Failed to copy emails.");
		});
	};

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div
				ref={modalRef}
				className="relative bg-white w-[90vw] h-[80vh] p-8 border-2 border-black overflow-y-auto flex flex-col items-center"
			>
				<button onClick={onClose} className="absolute top-4 right-4 transition" >
					<Image
						src="/icons/close.svg"
						alt="Close"
						width={12}
						height={12}
						className="hover:brightness-75"
					/>
				</button>
				
				{registrations.length === 0 ? (
					<div className="text-center text-gray-500 my-auto">There are no registrations for this event yet!</div>
				) : (
					<div className="w-full text-black">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-2xl font-bold">Event Registrations</h2>
							<Button
								variant='outline'
								className="border border-black"
								onClick={copyEmailsToClipboard}
							>
								Copy All Emails
							</Button>
						</div>

						{/* Internal Registrations Table */}
						{internalRegistrations.length > 0 && (
							<>
								<h3 className="text-xl font-semibold mt-6 mb-3">Internal Registrations</h3>
								<div className="overflow-x-auto mb-6">
									<table className="table-auto w-full border-collapse border border-gray-300">
										<thead className="bg-gray-200">
											<tr>
												<th className="border border-gray-700 p-3 text-left">Name</th>
												<th className="border border-gray-700 p-3 text-left">Email</th>
												<th className="border border-gray-700 p-3 text-left">Date Registered</th>
											</tr>
										</thead>
										<tbody>
											{internalRegistrations.map((registration) => (
												<tr key={`internal-${registration.user_id}`} className="hover:bg-gray-100">
													<td className="border border-gray-700 p-3">{registration.user_name}</td>
													<td className="border border-gray-700 p-3">{registration.user_email}</td>
													<td className="border border-gray-700 p-3">
														{new Date(registration.date_registered).toLocaleString()}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</>
						)}

						{/* External Registrations Table */}
						{externalRegistrations.length > 0 && (
							<>
								<h3 className="text-xl font-semibold mt-6 mb-3">External Registrations</h3>
								<div className="overflow-x-auto">
									<table className="table-auto w-full border-collapse border border-gray-300">
										<thead className="bg-gray-200">
											<tr>
												<th className="border border-gray-700 p-3 text-left">Name</th>
												<th className="border border-gray-700 p-3 text-left">Email</th>
												<th className="border border-gray-700 p-3 text-left">Date Registered</th>
											</tr>
										</thead>
										<tbody>
											{externalRegistrations.map((registration) => (
												<tr key={`external-${registration.user_id}`} className="hover:bg-gray-100">
													<td className="border border-gray-700 p-3">{registration.user_name}</td>
													<td className="border border-gray-700 p-3">{registration.user_email}</td>
													<td className="border border-gray-700 p-3">
														{new Date(registration.date_registered).toLocaleString()}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</>
						)}
					</div>
				)}
			</div>
		</div>,
		document.body
	);
}