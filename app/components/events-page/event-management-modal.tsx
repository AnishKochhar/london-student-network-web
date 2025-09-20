"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { Event, Registrations } from "@/app/lib/types";
import { formatEventDateTime } from "@/app/lib/utils";
import { base16ToBase62 } from "@/app/lib/uuid-utils";
import {
	XMarkIcon,
	PencilSquareIcon,
	EnvelopeIcon,
	EyeIcon,
	EyeSlashIcon,
	TrashIcon,
	UsersIcon,
	UserIcon,
	GlobeAltIcon,
	ClipboardDocumentIcon,
	CheckIcon
} from "@heroicons/react/24/outline";
import EmailSendingModal from "./email-sending-modal";

interface EventManagementModalProps {
	event: Event;
	onClose: () => void;
	onUpdate?: () => void;
}

export default function EventManagementModal({ event, onClose, onUpdate }: EventManagementModalProps) {
	const [registrations, setRegistrations] = useState<Registrations[]>([]);
	const [loading, setLoading] = useState(true);
	const [isHidden, setIsHidden] = useState(event.is_hidden || false);
	const [showEmailModal, setShowEmailModal] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showHideConfirm, setShowHideConfirm] = useState(false);
	const [showRegistrationDetails, setShowRegistrationDetails] = useState<'all' | 'internal' | 'external' | null>(null);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const modalRef = useRef<HTMLDivElement>(null);
	const registrationModalRef = useRef<HTMLDivElement>(null);
	const router = useRouter();

	// Prevent background scroll when modal is open
	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
		};
	}, []);

	// Handle click outside to close modal
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			// Don't close if any child modal is open
			if (showRegistrationDetails || showDeleteConfirm || showHideConfirm || showEmailModal) {
				return;
			}

			if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [onClose, showRegistrationDetails, showDeleteConfirm, showHideConfirm, showEmailModal]);

	useEffect(() => {
		const loadRegistrations = async () => {
			try {
				const response = await fetch("/api/events/registrations", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ event_id: event.id }),
				});

				if (response.ok) {
					const data = await response.json();
					setRegistrations(data.registrations || []);
				}
			} catch (error) {
				console.error("Error fetching registrations:", error);
			} finally {
				setLoading(false);
			}
		};

		loadRegistrations();
	}, [event.id]);


	const handleEditEvent = () => {
		// Open edit modal - we'll pass this up to parent
		onClose();
		// Navigate to edit page or open edit modal based on your preference
		router.push(`/events/edit?id=${event.id}`);
	};

	const handleGoToEventPage = () => {
		// Navigate to public event page
		onClose();
		const base62Id = base16ToBase62(event.id);
		router.push(`/events/${base62Id}`);
	};

	const handleToggleVisibility = () => {
		const newHiddenState = !isHidden;

		// If hiding the event, show confirmation modal
		if (newHiddenState) {
			setShowHideConfirm(true);
		} else {
			// If showing the event, do it directly
			performToggleVisibility();
		}
	};

	const performToggleVisibility = async () => {
		const newHiddenState = !isHidden;
		const toastId = toast.loading(
			newHiddenState ? "Hiding event..." : "Showing event..."
		);

		try {
			const response = await fetch("/api/events/toggle-visibility", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					event_id: event.id,
					is_hidden: newHiddenState
				}),
			});

			if (response.ok) {
				setIsHidden(newHiddenState);
				if (onUpdate) onUpdate();
				toast.success(
					newHiddenState ? "Event hidden successfully!" : "Event shown successfully!",
					{ id: toastId }
				);
			} else {
				toast.error("Failed to update event visibility", { id: toastId });
			}
		} catch (error) {
			console.error("Error toggling visibility:", error);
			toast.error("Error updating event visibility", { id: toastId });
		}
	};

	const handleDeleteEvent = async () => {
		const toastId = toast.loading("Deleting event...");

		try {
			const response = await fetch("/api/events/delete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ event_id: event.id }),
			});

			if (response.ok) {
				if (onUpdate) onUpdate();
				toast.success("Event deleted successfully!", { id: toastId });
				onClose();
			} else {
				toast.error("Failed to delete event", { id: toastId });
			}
		} catch (error) {
			console.error("Error deleting event:", error);
			toast.error("Error deleting event", { id: toastId });
		}
	};

	// Calculate registration stats
	const totalRegistrations = registrations.length;
	const internalRegistrations = registrations.filter(r => !r.external).length;
	const externalRegistrations = registrations.filter(r => r.external).length;

	// Copy emails to clipboard
	const copyEmailsToClipboard = (type: 'all' | 'internal' | 'external') => {
		let emails: string[] = [];

		if (type === 'all') {
			emails = registrations.map(r => r.user_email);
		} else if (type === 'internal') {
			emails = registrations.filter(r => !r.external).map(r => r.user_email);
		} else if (type === 'external') {
			emails = registrations.filter(r => r.external).map(r => r.user_email);
		}

		if (emails.length > 0) {
			navigator.clipboard.writeText(emails.join(', '));
			setCopiedField(type);
			setTimeout(() => setCopiedField(null), 2000);
		}
	};

	// Only render portal if we're in the browser
	if (typeof window === "undefined") return null;

	return createPortal(
		<>
			<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />

			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div ref={modalRef} className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
					{/* Header */}
					<div className="relative h-48 bg-gradient-to-br from-blue-600 to-blue-800">
						<Image
							src={event.image_url}
							alt={event.title}
							fill
							className="object-cover opacity-30"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

						<button
							onClick={onClose}
							className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur rounded-full hover:bg-white/30 transition-colors"
						>
							<XMarkIcon className="h-6 w-6 text-white" />
						</button>

						<div className="absolute bottom-4 left-6 right-6">
							<h2 className="text-3xl font-bold text-white mb-2">{event.title}</h2>
							<p className="text-white/90">{formatEventDateTime(event)}</p>
						</div>
					</div>

					{/* Content */}
					<div className="p-6 space-y-6 max-h-[calc(90vh-12rem)] overflow-y-auto">
						{/* Registration Stats */}
						<div className="bg-gray-50 rounded-xl p-6">
							<h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
								<UsersIcon className="h-5 w-5" />
								Registration Statistics
							</h3>

							{loading ? (
								<div className="animate-pulse space-y-2">
									<div className="h-4 bg-gray-200 rounded w-1/3"></div>
									<div className="h-4 bg-gray-200 rounded w-1/4"></div>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div
										onClick={() => setShowRegistrationDetails('all')}
										className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group relative"
									>
										<div className="text-2xl font-bold text-blue-600">{totalRegistrations}</div>
										<div className="text-sm text-gray-600">Total Registrations</div>
										{event.capacity && (
											<div className="text-xs text-gray-500 mt-1">
												{Math.round((totalRegistrations / event.capacity) * 100)}% of capacity
											</div>
										)}
										<button
											onClick={(e) => {
												e.stopPropagation();
												copyEmailsToClipboard('all');
											}}
											className="absolute top-2 right-2 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
											title="Copy all emails to clipboard"
										>
											{copiedField === 'all' ? (
												<CheckIcon className="h-4 w-4 text-green-600" />
											) : (
												<ClipboardDocumentIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
											)}
										</button>
									</div>

									<div
										onClick={() => setShowRegistrationDetails('internal')}
										className="bg-white rounded-lg p-4 border border-gray-200 hover:border-green-400 hover:shadow-md transition-all cursor-pointer group relative"
									>
										<div className="flex items-center gap-2">
											<UserIcon className="h-5 w-5 text-green-600" />
											<span className="text-2xl font-bold text-green-600">{internalRegistrations}</span>
										</div>
										<div className="text-sm text-gray-600">Internal</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
												copyEmailsToClipboard('internal');
											}}
											className="absolute top-2 right-2 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
											title="Copy internal emails to clipboard"
										>
											{copiedField === 'internal' ? (
												<CheckIcon className="h-4 w-4 text-green-600" />
											) : (
												<ClipboardDocumentIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
											)}
										</button>
									</div>

									<div
										onClick={() => setShowRegistrationDetails('external')}
										className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group relative"
									>
										<div className="flex items-center gap-2">
											<GlobeAltIcon className="h-5 w-5 text-purple-600" />
											<span className="text-2xl font-bold text-purple-600">{externalRegistrations}</span>
										</div>
										<div className="text-sm text-gray-600">External</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
												copyEmailsToClipboard('external');
											}}
											className="absolute top-2 right-2 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
											title="Copy external emails to clipboard"
										>
											{copiedField === 'external' ? (
												<CheckIcon className="h-4 w-4 text-green-600" />
											) : (
												<ClipboardDocumentIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
											)}
										</button>
									</div>
								</div>
							)}
						</div>

						{/* Action Buttons */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold text-gray-800">Event Actions</h3>

							<div className="flex flex-wrap gap-3">
								<button
									onClick={handleEditEvent}
									className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all hover:shadow-lg"
								>
									<PencilSquareIcon className="h-4 w-4" />
									<span className="font-medium">Edit Details</span>
								</button>

								<button
									onClick={handleGoToEventPage}
									className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg"
								>
									<GlobeAltIcon className="h-4 w-4" />
									<span className="font-medium">Go to Event Page</span>
								</button>

								<button
									onClick={() => setShowEmailModal(true)}
									className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 border-2 border-gray-900 rounded-xl hover:bg-gray-50 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
									disabled={totalRegistrations === 0}
								>
									<EnvelopeIcon className="h-4 w-4" />
									<span className="font-medium">Email {totalRegistrations} Attendees</span>
								</button>

								<button
									onClick={handleToggleVisibility}
									className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all hover:shadow-lg ${
										isHidden
											? "bg-gray-100 text-gray-700 hover:bg-gray-200"
											: "bg-amber-100 text-amber-700 hover:bg-amber-200"
									}`}
								>
									{isHidden ? (
										<>
											<EyeIcon className="h-4 w-4" />
											<span className="font-medium">Show Event</span>
										</>
									) : (
										<>
											<EyeSlashIcon className="h-4 w-4" />
											<span className="font-medium">Hide Event</span>
										</>
									)}
								</button>

								<button
									onClick={() => setShowDeleteConfirm(true)}
									className="flex items-center gap-2 px-5 py-2.5 text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all hover:shadow-lg ml-auto"
								>
									<TrashIcon className="h-4 w-4" />
									<span className="font-medium">Delete</span>
								</button>
							</div>
						</div>

						{/* Event Details */}
						<div className="bg-gray-50 rounded-xl p-6">
							<h3 className="text-lg font-semibold text-gray-800 mb-3">Event Information</h3>
							<div className="space-y-2 text-sm">
								<div>
									<span className="font-medium text-gray-600">Location:</span>
									<span className="ml-2 text-gray-800">{event.location_building}</span>
								</div>
								<div>
									<span className="font-medium text-gray-600">Area:</span>
									<span className="ml-2 text-gray-800">{event.location_area}</span>
								</div>
								{event.capacity && (
									<div>
										<span className="font-medium text-gray-600">Capacity:</span>
										<span className="ml-2 text-gray-800">{event.capacity} attendees</span>
									</div>
								)}
								{event.sign_up_link && (
									<div>
										<span className="font-medium text-gray-600">External Link:</span>
										<a href={event.sign_up_link} target="_blank" rel="noopener noreferrer"
											className="ml-2 text-blue-600 hover:underline">
											View Registration Page
										</a>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<>
					<div
						className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
						onClick={() => setShowDeleteConfirm(false)}
					/>
					<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
						<div
							className="bg-white rounded-xl p-6 max-w-md w-full"
							onClick={(e) => e.stopPropagation()}
						>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Event?</h3>
							<p className="text-gray-600 mb-6">
								This action cannot be undone. The event will be permanently deleted.
							</p>
							<div className="flex gap-3">
								<button
									onClick={() => setShowDeleteConfirm(false)}
									className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									onClick={handleDeleteEvent}
									className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
								>
									Delete Event
								</button>
							</div>
						</div>
					</div>
				</>
			)}

			{/* Registration Details Modal */}
			{showRegistrationDetails && (
				<>
					<div
						className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
						onClick={() => setShowRegistrationDetails(null)}
					/>
					<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
						<div
							ref={registrationModalRef}
							className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="p-6 border-b border-gray-200">
								<div className="flex items-center justify-between">
									<h3 className="text-xl font-semibold text-gray-900">
										{showRegistrationDetails === 'all' && 'All Registrations'}
										{showRegistrationDetails === 'internal' && 'Internal Registrations'}
										{showRegistrationDetails === 'external' && 'External Registrations'}
									</h3>
									<button
										onClick={() => setShowRegistrationDetails(null)}
										className="p-2 hover:bg-gray-100 rounded-full transition-colors"
									>
										<XMarkIcon className="h-5 w-5 text-gray-500" />
									</button>
								</div>
							</div>

							<div className="p-6 max-h-[60vh] overflow-y-auto">
								{(() => {
									let filteredRegistrations = registrations;
									if (showRegistrationDetails === 'internal') {
										filteredRegistrations = registrations.filter(r => !r.external);
									} else if (showRegistrationDetails === 'external') {
										filteredRegistrations = registrations.filter(r => r.external);
									}

									if (filteredRegistrations.length === 0) {
										return (
											<div className="text-center py-8 text-gray-500">
												No registrations found for this category
											</div>
										);
									}

									return (
										<div className="space-y-3">
											{filteredRegistrations.map((registration, index) => (
												<div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
													<div className="flex items-center gap-3">
														<div className={`w-3 h-3 rounded-full ${registration.external ? 'bg-purple-500' : 'bg-green-500'}`} />
														<div>
															<p className="font-medium text-gray-900">{registration.user_name}</p>
															<p className="text-sm text-gray-600">{registration.user_email}</p>
														</div>
													</div>
													<button
														onClick={() => {
															navigator.clipboard.writeText(registration.user_email);
															setCopiedField(`email-${index}`);
															setTimeout(() => setCopiedField(null), 2000);
														}}
														className="p-2 hover:bg-white rounded-md transition-colors"
														title="Copy email"
													>
														{copiedField === `email-${index}` ? (
															<CheckIcon className="h-4 w-4 text-green-600" />
														) : (
															<ClipboardDocumentIcon className="h-4 w-4 text-gray-400" />
														)}
													</button>
												</div>
											))}
										</div>
									);
								})()}
							</div>

							<div className="p-6 border-t border-gray-200 bg-gray-50">
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600">
										{(() => {
											let count = 0;
											if (showRegistrationDetails === 'all') count = totalRegistrations;
											else if (showRegistrationDetails === 'internal') count = internalRegistrations;
											else if (showRegistrationDetails === 'external') count = externalRegistrations;
											return `${count} registration${count !== 1 ? 's' : ''}`;
										})()}
									</span>
									<button
										onClick={() => {
											let emails: string[] = [];
											if (showRegistrationDetails === 'all') {
												emails = registrations.map(r => r.user_email);
											} else if (showRegistrationDetails === 'internal') {
												emails = registrations.filter(r => !r.external).map(r => r.user_email);
											} else if (showRegistrationDetails === 'external') {
												emails = registrations.filter(r => r.external).map(r => r.user_email);
											}
											navigator.clipboard.writeText(emails.join(', '));
											setCopiedField('all-emails');
											setTimeout(() => setCopiedField(null), 2000);
										}}
										className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
									>
										{copiedField === 'all-emails' ? (
											<>
												<CheckIcon className="h-4 w-4" />
												<span>Copied!</span>
											</>
										) : (
											<>
												<ClipboardDocumentIcon className="h-4 w-4" />
												<span>Copy All Emails</span>
											</>
										)}
									</button>
								</div>
							</div>
						</div>
					</div>
				</>
			)}

			{/* Hide Confirmation Modal */}
			{showHideConfirm && (
				<>
					<div
						className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
						onClick={() => setShowHideConfirm(false)}
					/>
					<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
						<div
							className="bg-white rounded-xl p-6 max-w-md w-full"
							onClick={(e) => e.stopPropagation()}
						>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">Hide Event?</h3>
							<p className="text-gray-600 mb-6">
								Are you sure you want to hide &quot;{event.title}&quot;? This will make the event invisible to the public, but it will remain in your dashboard and can be shown again later.
							</p>
							<div className="flex gap-3">
								<button
									onClick={() => setShowHideConfirm(false)}
									className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									onClick={() => {
										setShowHideConfirm(false);
										performToggleVisibility();
									}}
									className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
								>
									Hide Event
								</button>
							</div>
						</div>
					</div>
				</>
			)}

			{/* Email Modal */}
			{showEmailModal && (
				<EmailSendingModal
					event={event}
					onClose={() => setShowEmailModal(false)}
				/>
			)}
		</>,
		document.body
	);
}