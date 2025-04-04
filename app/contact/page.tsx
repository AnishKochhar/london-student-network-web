"use client";

import { useForm } from "react-hook-form";
import { Input } from "../components/input";
import { Button } from "../components/button";
import { useState, useEffect } from "react";



interface ContactFormData {
	name: string;
	email: string;
	message: string;
}

export default function ContactForm() {
	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<ContactFormData>();

	const [status, setStatus] = useState<string | null>(null)

	
	const onSubmit = async (data: ContactFormData) => {
		setStatus('Sending...');
		try {
			const response = await fetch('/api/send-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (response.ok) {
				setStatus('Form submitted successfully!');
				reset()
			} else {
				setStatus('Failed to submit the form.');
			}
		} catch (error) {
			console.error('Error submitting the form:', error);
			setStatus('An error occurred. Please try again.');
		}
	};

	return (
		<main className="min-h-screen w-screen bg-gradient-to-b from-[#083157]  to-[#064580]">
			<div className="flex flex-col lg:flex-row lg:justify-between p-8 lg:py-16">
				<div className="lg:w-1/2 lg:pr-8 mb-8 lg:mb-0">
					<h1 className="text-5xl md:text-7xl font-semibold mb-4 lg:mb-20">Get in touch with us</h1>
					<p className="text-lg mb-4">
						Whether you have questions about how we operate, enquiries about the team, or are interested in sponsoring an events, we&#39;d love to hear from you.
					</p>
					<p className="text-lg">
						Please reach us by filling out the form, and one of the team will get back to you as soon as possible.
					</p>
				</div>

				<div className="lg:w-1/2  p-6">
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex flex-col">
						<div>
							{/* <label htmlFor="name" className="block text-sm font-medium mb-2">
								Your Name
							</label> */}
							<Input
								id="name"
								type="text"
								placeholder="Your Name"
								{...register("name", { required: "Name is required" })}
								className="bg-transparent"
							/>
							{errors.name && (
								<p className="text-red-500 text-xs mt-1">
									{errors.name.message}
								</p>
							)}
						</div>

						<div>
							{/* <label htmlFor="email" className="block text-sm font-medium">
								Email
							</label> */}
							<Input
								id="email"
								type="email"
								placeholder="Email"
								{...register("email", {
									required: "Email is required",
									pattern: {
										value: /^\S+@\S+$/i,
										message: "Invalid email address",
									},
								})}
								className="bg-transparent"
							/>
							{errors.email && (
								<p className="text-red-500 text-xs mt-1">
									{errors.email.message}
								</p>
							)}
						</div>

						<div>
							{/* <label htmlFor="message" className="block text-sm font-medium">
								Your Message
							</label> */}
							<textarea
								id="message"
								className="w-full h-32 rounded-md border px-3 py-2 text-sm bg-transparent"
								placeholder="Your Message"
								{...register("message", { required: "Message is required" })}
							/>
							{errors.message && (
								<p className="text-red-500 text-xs mt-1">
									{errors.message.message}
								</p>
							)}
						</div>

						<Button variant="outline" size="md" type="submit" className="text-white px-12 self-end hover:bg-blue-900">
							Submit
						</Button>
						{status && <p className="mt-4 text-lg self-end text-white/80">{status}</p>}
					</form>
				</div>
			</div>
		</main>
	)
}
