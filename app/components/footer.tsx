"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import instagramIcon from "@/public/icons/instagram.svg";
import linkedinIcon from "@/public/icons/linkedin.svg";
import mailIcon from "@/public/icons/mail.svg";
import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";

import { Send } from "lucide-react";
import { motion, useInView } from "framer-motion";

// Turnstile site key
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function Footer() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [turnstileLoaded, setTurnstileLoaded] = useState(false);
    const turnstileWidgetId = useRef<string | null>(null);
    const turnstileContainerRef = useRef<HTMLDivElement>(null);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, amount: 0.1 });

    const handleTurnstileCallback = useCallback((token: string) => {
        setTurnstileToken(token);
    }, []);

    const renderTurnstile = useCallback(() => {
        if (!TURNSTILE_SITE_KEY) return;
        if (window.turnstile && turnstileContainerRef.current && !turnstileWidgetId.current) {
            turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
                sitekey: TURNSTILE_SITE_KEY,
                callback: handleTurnstileCallback,
                "error-callback": () => setTurnstileToken(null),
                "expired-callback": () => setTurnstileToken(null),
                theme: "dark",
                size: "compact",
            });
        }
    }, [handleTurnstileCallback]);

    useEffect(() => {
        if (turnstileLoaded) {
            renderTurnstile();
        }
    }, [turnstileLoaded, renderTurnstile]);

    const resetTurnstile = useCallback(() => {
        if (window.turnstile && turnstileWidgetId.current) {
            window.turnstile.reset(turnstileWidgetId.current);
            setTurnstileToken(null);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("loading");

        try {
            const response = await fetch("/api/newsletter", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                    turnstileToken: turnstileToken,
                }),
            });

            if (response.ok) {
                setEmail("");
                setStatus("success");
                resetTurnstile();
                // Reset status after 3 seconds
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                setStatus("error");
                resetTurnstile();
                setTimeout(() => setStatus("idle"), 3000);
            }
        } catch (error) {
            console.error("Error submitting the form:", error);
            setStatus("error");
            resetTurnstile();
            setTimeout(() => setStatus("idle"), 3000);
        }
    };

    return (
        <>
        <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            async
            defer
            onLoad={() => setTurnstileLoaded(true)}
        />
        <footer className="relative border-t border-gray-300 border-opacity-25 bg-[#041A2E] text-white transition-colors duration-300 z-10">
            <motion.div
                ref={ref}
                variants={{
                    hidden: { y: 20, opacity: 0 },
                    visible: { y: 0, opacity: 1 },
                }}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{ duration: 1.0, ease: "easeOut" }}
                className="container mx-auto px-4 py-12 md:px-6 lg:px-8"
            >
                <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative">
                        <h2 className="mb-4 text-3xl font-bold tracking-tight">
                            Stay Connected
                        </h2>
                        <p className="mb-6 text-muted-foreground">
                            Join our newsletter for the latest updates and
                            exclusive offers.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="relative">
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="pr-12 bg-white/10 border-white/20 text-white placeholder:text-white/70"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={status === "loading"}
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    variant="filled"
                                    className="absolute right-1 top-1 px-2 rounded-md hover:bg-blue-700 transition-all flex items-center"
                                    disabled={status === "loading"}
                                >
                                    <Send className="h-3 w-3" />
                                </Button>
                            </div>
                            <div ref={turnstileContainerRef} className="cf-turnstile" />
                            {status === "success" && (
                                <p className="text-green-400 text-sm">Subscribed successfully!</p>
                            )}
                            {status === "error" && (
                                <p className="text-red-400 text-sm">Failed to subscribe. Try again.</p>
                            )}
                        </form>
                        <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                    </div>
                    <div>
                        <h3 className="mb-4 text-lg font-semibold">
                            Quick Links
                        </h3>
                        <nav className="space-y-2 text-sm">
                            <Link
                                href="/"
                                className="block transition-colors hover:text-primary hover:underline"
                            >
                                Home
                            </Link>
                            <Link
                                href="/about"
                                className="block transition-colors hover:text-primary hover:underline"
                            >
                                About Us
                            </Link>
                            <Link
                                href="/events"
                                className="block transition-colors hover:text-primary hover:underline"
                            >
                                Events
                            </Link>
                            <Link
                                href="/societies"
                                className="block transition-colors hover:text-primary hover:underline"
                            >
                                Societies
                            </Link>
                            <Link
                                href="/contact"
                                className="block transition-colors hover:text-primary hover:underline"
                            >
                                Contact
                            </Link>
                        </nav>
                    </div>
                    <div>
                        <h3 className="mb-4 text-lg font-semibold">
                            Contact Us
                        </h3>
                        <address className="space-y-2 text-sm not-italic">
                            <p>Entrepreneurship Institute</p>
                            <p>
                                {" "}
                                Bush House North Wing, Strand Campus, 30
                                Aldwych, WC2B 4BG
                            </p>
                            <p>London, United Kingdom</p>
                            <br />
                            <p>
                                Email:{" "}
                                <Link
                                    href="mailto:hello@londonstudentnetwork.com"
                                    className="hover:underline font-bold"
                                >
                                    hello@londonstudentnetwork.com
                                </Link>
                            </p>
                        </address>
                    </div>
                    <div className="relative">
                        <h3 className="mb-4 text-lg font-semibold">
                            Follow Us
                        </h3>
                        <div className="mb-6 flex space-x-4">
                            <Link
                                href="https://www.instagram.com/lsn.uk/"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Instagram"
                                className="group relative"
                            >
                                <div className="w-12 h-12 flex items-center justify-center hover:opacity-80 transition-opacity">
                                    <Image
                                        src={instagramIcon}
                                        alt="Instagram"
                                        className="w-6 h-6"
                                    />
                                </div>
                                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Instagram
                                </span>
                            </Link>
                            <Link
                                href="https://www.linkedin.com/company/london-student-network/mycompany"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="LinkedIn"
                                className="group relative"
                            >
                                <div className="w-12 h-12 flex items-center justify-center hover:opacity-80 transition-opacity">
                                    <Image
                                        src={linkedinIcon}
                                        alt="LinkedIn"
                                        className="w-6 h-6"
                                    />
                                </div>
                                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    LinkedIn
                                </span>
                            </Link>
                            <Link
                                href="mailto:londonstudentnetwork@gmail.com"
                                aria-label="Email"
                                className="group relative"
                            >
                                <div className="w-12 h-12 flex items-center justify-center hover:opacity-80 transition-opacity">
                                    <Image
                                        src={mailIcon}
                                        alt="Email"
                                        className="w-6 h-6"
                                    />
                                </div>
                                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Email
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-center md:flex-row">
                    <p className="text-sm text-muted-foreground">
                        © 2025 London Student Network. All rights reserved.
                    </p>
                    <nav className="flex gap-4 text-sm">
                        <Link
                            href="/terms-conditions"
                            className="relative transition-colors hover:text-primary group inline-block"
                        >
                            <span className="relative inline-block pb-1">
                                Terms and Conditions
                                <span className="absolute left-0 -bottom-0.5 w-0 h-[2px] bg-primary transition-all duration-700 ease-out group-hover:w-full"></span>
                            </span>
                        </Link>
                        <Link
                            href="/privacy-policy"
                            className="relative transition-colors hover:text-primary group inline-block"
                        >
                            <span className="relative inline-block pb-1">
                                Privacy Policy
                                <span className="absolute left-0 -bottom-0.5 w-0 h-[2px] bg-primary transition-all duration-700 ease-out group-hover:w-full"></span>
                            </span>
                        </Link>
                    </nav>
                </div>
            </motion.div>
        </footer>
        </>
    );
}
