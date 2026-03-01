"use client";

import { Event } from "@/app/lib/types";
import { Ticket as TicketIcon, Clock, Users, Shield, Globe, Lock } from "lucide-react";

interface RegistrationTabProps {
	event: Event;
	eventId: string;
}

interface TicketType {
	ticket_name: string;
	ticket_price?: string;
	tickets_available?: number | null;
}

export default function RegistrationTab({ event }: RegistrationTabProps) {

	const getVisibilityLabel = (level: string | undefined) => {
		switch (level) {
			case "public":
				return { label: "Public", icon: Globe, color: "text-green-600", bgColor: "bg-green-100" };
			case "students_only":
				return { label: "Logged In Users", icon: Users, color: "text-blue-600", bgColor: "bg-blue-100" };
			case "verified_students":
				return { label: "Verified Students", icon: Shield, color: "text-purple-600", bgColor: "bg-purple-100" };
			case "university_exclusive":
				return { label: "University Exclusive", icon: Lock, color: "text-red-600", bgColor: "bg-red-100" };
			case "private":
				return { label: "Private", icon: Lock, color: "text-purple-600", bgColor: "bg-purple-100" };
			default:
				return { label: "Public", icon: Globe, color: "text-green-600", bgColor: "bg-green-100" };
		}
	};

	const visibilityInfo = getVisibilityLabel(event.visibility_level);
	const registrationInfo = getVisibilityLabel(event.registration_level);
	const VisibilityIcon = visibilityInfo.icon;
	const RegistrationIcon = registrationInfo.icon;

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Access Control Settings */}
			<div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
				<h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Access Control</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
					{/* Visibility Level */}
					<div>
						<label className="block text-xs sm:text-sm font-medium text-white/80 mb-2">
							Who can see this event?
						</label>
						<div className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 ${visibilityInfo.bgColor} rounded-lg`}>
							<VisibilityIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${visibilityInfo.color} shrink-0`} />
							<div className="min-w-0">
								<p className={`text-sm sm:text-base font-semibold ${visibilityInfo.color}`}>
									{visibilityInfo.label}
								</p>
								<p className="text-xs text-black/80 mt-0.5">
									{event.visibility_level === "private" && "Hidden from listings - accessible via direct link only"}
									{event.visibility_level === "public" && "Anyone can view this event"}
									{event.visibility_level === "students_only" && "Only logged-in users"}
									{event.visibility_level === "verified_students" && "Only verified students"}
									{event.visibility_level === "university_exclusive" && "Specific universities only"}
								</p>
							</div>
						</div>
					</div>

					{/* Registration Level */}
					<div>
						<label className="block text-xs sm:text-sm font-medium text-white/80 mb-2">
							Who can register?
						</label>
						<div className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 ${registrationInfo.bgColor} rounded-lg`}>
							<RegistrationIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${registrationInfo.color} shrink-0`} />
							<div className="min-w-0">
								<p className={`text-sm sm:text-base font-semibold ${registrationInfo.color}`}>
									{registrationInfo.label}
								</p>
								<p className="text-xs text-black/80 mt-0.5">
									{event.registration_level === "public" && "Anyone can register (including guests)"}
									{event.registration_level === "students_only" && "Requires account"}
									{event.registration_level === "verified_students" && "Verified students only"}
									{event.registration_level === "university_exclusive" && "Selected universities only"}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* University Exclusive Info */}
				{event.registration_level === "university_exclusive" && event.allowed_universities && event.allowed_universities.length > 0 && (
					<div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
						<p className="text-sm font-medium text-blue-900 mb-2">Allowed Universities:</p>
						<div className="flex flex-wrap gap-2">
							{event.allowed_universities.map((uni) => (
								<span
									key={uni}
									className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
								>
									{uni}
								</span>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Capacity Settings */}
			{event.capacity && (
				<div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
					<h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Capacity</h3>
					<div className="flex items-center gap-3 sm:gap-4">
						<div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
							<Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
						</div>
						<div>
							<p className="text-2xl sm:text-3xl font-bold text-white">{event.capacity}</p>
							<p className="text-xs sm:text-sm text-white/80">Maximum attendees</p>
						</div>
					</div>
				</div>
			)}

			{/* Registration Cutoff */}
			{(event.registration_cutoff_hours || event.external_registration_cutoff_hours) && (
				<div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
					<h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Registration Cutoff</h3>
					<div className="space-y-3 sm:space-y-4">
						{event.registration_cutoff_hours && (
							<div className="flex items-start gap-2 sm:gap-3">
								<Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 shrink-0" />
								<div>
									<p className="text-xs sm:text-sm font-medium text-white">General Cutoff</p>
									<p className="text-xs sm:text-sm text-white/80">
										{event.registration_cutoff_hours} hours before event
									</p>
								</div>
							</div>
						)}
						{event.external_registration_cutoff_hours && (
							<div className="flex items-start gap-2 sm:gap-3">
								<Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mt-0.5 shrink-0" />
								<div>
									<p className="text-xs sm:text-sm font-medium text-white">External Student Cutoff</p>
									<p className="text-xs sm:text-sm text-white/80">
										{event.external_registration_cutoff_hours} hours before event
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Ticket Information */}
			{event.tickets && event.tickets.length > 0 && (
				<div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
					<h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Ticket Types</h3>
					<div className="space-y-2 sm:space-y-3">
						{event.tickets.map((ticket: TicketType, index: number) => {
							const price = parseFloat(ticket.ticket_price || '0');
							const isPaid = price > 0;

							return (
								<div
									key={index}
									className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-lg border border-white/20 gap-3"
								>
									<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
										<TicketIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isPaid ? 'text-purple-600' : 'text-green-600'} shrink-0`} />
										<div className="min-w-0">
											<p className="text-xs sm:text-sm font-semibold text-white truncate">
												{ticket.ticket_name}
											</p>
											{ticket.tickets_available !== null && (
												<p className="text-xs text-white/80">
													{ticket.tickets_available} available
												</p>
											)}
										</div>
									</div>
									<div className="text-right shrink-0">
										<p className="text-base sm:text-lg font-bold text-white">
											{isPaid ? `£${price.toFixed(2)}` : 'Free'}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* External Sign-up Link */}
			{event.sign_up_link && (
				<div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-4 sm:p-6">
					<h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">External Registration</h3>
					<div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
						<p className="text-xs sm:text-sm text-blue-900 mb-2">
							This event uses an external registration link
						</p>
						<a
							href={event.sign_up_link}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 break-all"
						>
							{event.sign_up_link}
						</a>
					</div>
				</div>
			)}
		</div>
	);
}
