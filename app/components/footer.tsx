"use client";

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/app/components/button"
import { Input } from "@/app/components/input"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip"
import { Send } from "lucide-react"
import { motion, useInView } from 'framer-motion'

export default function Footer() {
	const [email, setEmail] = useState('')
	const ref = useRef(null);
	const isInView = useInView(ref, { once: false, amount: 0.1 });

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		try {
			const data = {
				name: 'Newsletter Subscription',
				email: email,
				message: `Newsletter subscription request for email: ${email}`,
			}

			const response = await fetch('/api/send-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			})

			if (response.ok) {
				setEmail('')
			}
		} catch (error) {
			console.error('Error submitting the form:', error)
		}

	}


	return (
		<footer className="relative border-t border-gray-300 border-opacity-25 bg-blue-600/25 text-white transition-colors duration-300">
			<motion.div
				ref={ref}
				variants={{
					hidden: { y: 20, opacity: 0 },
					visible: { y: 0, opacity: 1 },
				}}
				initial="hidden"
				animate={isInView ? "visible" : "hidden"}
				transition={{ duration: 0.5, ease: "easeOut" }}
				className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
				<div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
					<div className="relative">
						<h2 className="mb-4 text-3xl font-bold tracking-tight">Stay Connected</h2>
						<p className="mb-6 text-muted-foreground">
							Join our newsletter for the latest updates and exclusive offers.
						</p>
						<form onSubmit={handleSubmit} className="relative">
							<Input
								type="email"
								placeholder="Enter your email"
								className="pr-12 bg-white/10 border-white/20 text-white placeholder:text-white/70"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
							<Button
								type="submit"
								size="icon"
								className="absolute right-1 top-1 h-8 w-8 rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
							>
								<Send className="h-4 w-4" />
								<span className="sr-only">Subscribe</span>
							</Button>
						</form>
						<div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
					</div>
					<div>
						<h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
						<nav className="space-y-2 text-sm">
							<Link href="/" className="block transition-colors hover:text-primary hover:underline">
								Home
							</Link>
							<Link href="/about" className="block transition-colors hover:text-primary hover:underline">
								About Us
							</Link>
							<Link href="/events" className="block transition-colors hover:text-primary hover:underline">
								Events
							</Link>
							<Link href="/societies" className="block transition-colors hover:text-primary hover:underline">
								Societies
							</Link>
							<Link href="/contact" className="block transition-colors hover:text-primary hover:underline">
								Contact
							</Link>
						</nav>
					</div>
					<div>
						<h3 className="mb-4 text-lg font-semibold">Contact Us</h3>
						<address className="space-y-2 text-sm not-italic">
							<p>Entrepreneurship Institute</p>
							<p> Bush House North Wing, Strand Campus, 30 Aldwych, WC2B 4BG</p>
							<p>London, United Kingdom</p>
							<br />
							<p>Email: <Link href="mailto:hello@londonstudentnetwork.com" className="hover:underline font-bold">hello@londonstudentnetwork.com</Link></p>
						</address>
					</div>
					<div className="relative">
						<h3 className="mb-4 text-lg font-semibold">Follow Us</h3>
						<div className="mb-6 flex space-x-4">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Link href="https://www.instagram.com/lsn.uk/" target="_blank" rel="noreferrer" aria-label="Instagram">
											<Button variant="outline" size="icon" className="rounded-full w-10 h-10 flex items-center justify-center">
												<Image src="/icons/instagram.svg" alt="Instagram" width={24} height={24} className="w-6 h-6" />
												<span className="sr-only">Instagram</span>
											</Button>
										</Link>
									</TooltipTrigger>
									<TooltipContent>
										<p>Follow us on Instagram</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Link href="https://www.linkedin.com/company/london-student-network/mycompany" target="_blank" rel="noreferrer" aria-label="LinkedIn">
											<Button variant="outline" size="icon" className="rounded-full w-10 h-10 flex items-center justify-center">
												<Image src="/icons/linkedin.svg" alt="LinkedIn" width={24} height={24} className="w-6 h-6" />
												<span className="sr-only">LinkedIn</span>
											</Button>
										</Link>
									</TooltipTrigger>
									<TooltipContent>
										<p>Connect with us on LinkedIn</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Link href="mailto:londonstudentnetwork@gmail.com" aria-label="Email">
											<Button variant="outline" size="icon" className="rounded-full w-10 h-10 flex items-center justify-center">
												<Image src="/icons/mail.svg" alt="Email" width={24} height={24} className="w-6 h-6" />
												<span className="sr-only">Email</span>
											</Button>
										</Link>
									</TooltipTrigger>
									<TooltipContent>
										<p>Email us</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					</div>
				</div>
				<div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-center md:flex-row">
					<p className="text-sm text-muted-foreground">
						© 2024 London Student Network. All rights reserved.
					</p>
					<nav className="flex gap-4 text-sm">
						<Link href="/terms-conditions" className="transition-colors hover:text-primary">
							Terms and Conditions
						</Link>
					</nav>
				</div>
			</motion.div>
		</footer>
	)
}