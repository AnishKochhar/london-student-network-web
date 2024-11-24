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

	// Disable background scroll and handle outside click detection
	useEffect(() => {
		// Prevent background scrolling
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
				className="relative bg-white w-[90vw] h-[80vh] p-8 border-2 border-black overflow-hidden flex items-center justify-center"
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
					<div className="text-center text-gray-500">There are no registrations for this event yet!</div>
				) : (
						<div className="flex flex-col self-start w-full text-black">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-2xl font-bold">Event Registrations</h2>
							<Button
								variant='outline'
								className="f border border-black"
								onClick={copyEmailsToClipboard}
							>
								Copy Emails to Clipboard
							</Button>
						</div>
						<div className="overflow-x-auto text-black">
							<table className="table-auto w-full border-collapse border border-gray-300">
								<thead className="bg-gray-200">
									<tr>
										<th className="border border-gray-700 p-3 text-left">Name</th>
										<th className="border border-gray-700 p-3 text-left">Email</th>
										<th className="border border-gray-700 p-3 text-left">Date Registered</th>
									</tr>
								</thead>
								<tbody>
									{registrations.map((registration) => (
										<tr key={registration.user_id} className="hover:bg-gray-100">
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
					</div>
				)}
			</div>

		</div>,
		document.body
	);
}