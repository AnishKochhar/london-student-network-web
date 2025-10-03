"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import UserEventsList from "@/app/components/account/user-events-list";
import NextImage from "next/image";
import { FetchAccountDetailsPromiseInterface } from "@/app/lib/types";
import { getAllTags, getCategoryByTagValue } from "@/app/utils/tag-categories";
import { formattedWebsite } from "@/app/lib/utils";
import * as skeletons from "@/app/components/skeletons/unique-society";
import MarkdownRenderer from "@/app/components/markdown/markdown-renderer";
import { ExternalLink, MessageSquare, Calendar, Info, Mail } from "lucide-react";
import { motion } from "framer-motion";
import ContactForm from "@/app/components/societies/contact-form";
import { ShimmerButton } from "@/app/components/ui/shimmer-button";

export default function SocietySlugPage() {
    const [loadingDetails, setLoadingDetails] = useState<boolean>(true);
    const [name, setName] = useState<string>("");
    const [societyId, setSocietyId] = useState<string>("");
    const [logo, setLogo] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [website, setWebsite] = useState<string>("");
    const [tags, setTags] = useState<string[]>([]);
    const [mainColor] = useState<string>("");
    const [bannerBackground, setBannerBackground] = useState<string>("transparent");
    const { slug } = useParams();
    const router = useRouter();
    const stringSlug = slug instanceof Array ? slug[0] : slug;

    // Fetch society details by slug
    useEffect(() => {
        const fetchSocietyBySlug = async (slug: string) => {
            try {
                setLoadingDetails(true);
                const response = await fetch("/api/societies/get-by-slug", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ slug }),
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        // Society not found, redirect to 404
                        router.push("/404");
                        return;
                    }
                    throw new Error("Failed to fetch society details");
                }

                const data = await response.json();
                if (data.success && data.society) {
                    const society = data.society;

                    setSocietyId(society.id);
                    setName(society.name);
                    setLogo(society.logo_url);
                    setDescription(society.description);
                    setWebsite(society.website);

                    if (society.tags && society.tags.length > 0) {
                        const allTags = getAllTags();
                        const mappedTags = society.tags.map((tagValue: number) => {
                            const tag = allTags.find(t => t.value === tagValue);
                            return tag ? tag.label : "Unknown Tag";
                        });
                        setTags(mappedTags);
                    } else {
                        setTags([]);
                    }
                }

                setLoadingDetails(false);
            } catch (error) {
                setLoadingDetails(false);
                console.error("Error fetching society details:", error);
                router.push("/404");
            }
        };

        if (stringSlug) {
            fetchSocietyBySlug(stringSlug);
        }
    }, [stringSlug, router]);

    // Set background colour for banner
    useEffect(() => {
        const background = mainColor ? "transparent" : "transparent";
        setBannerBackground(background);
    }, [mainColor]);

    const handleWebsiteClick = (website: string) => {
        window.open(formattedWebsite(website), "_blank");
    };

    // Get tag information with categories for styling
    const tagInfo = tags.map(tagLabel => {
        const allTags = getAllTags();
        const tagData = allTags.find(t => t.label === tagLabel);
        if (tagData) {
            const categoryFromUtils = getCategoryByTagValue(tagData.value);
            if (categoryFromUtils) {
                return {
                    label: tagLabel,
                    color: categoryFromUtils.color,
                    icon: categoryFromUtils.icon
                };
            }
        }
        return { label: tagLabel, color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', icon: '🏷️' };
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
            <div className="container mx-auto px-4 py-8">
                {/* Header Section */}
                <header className="relative flex flex-col items-center pb-[100px]">
                    {/* Banner Background */}
                    <div
                        className="absolute inset-0 -mx-4 mb-16 h-full z-0"
                        style={{
                            background: bannerBackground,
                            opacity: 1,
                        }}
                    ></div>

                    {/* Logo */}
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-[265px] h-[265px] bg-transparent rounded-full flex items-center justify-center mt-[50px]">
                            <div className="relative flex items-center justify-center rounded-full">
                                {loadingDetails ? (
                                    <skeletons.UniqueSocietyLogoSkeleton />
                                ) : logo ? (
                                    <NextImage
                                        src={logo}
                                        alt={`${name} logo`}
                                        width={280}
                                        height={280}
                                        quality={95}
                                        priority={true}
                                        className="w-[280px] h-[280px] object-contain rounded"
                                    />
                                ) : null}
                            </div>
                        </div>

                        {/* Society Name */}
                        <div className="relative mt-6 flex flex-col items-center">
                            {loadingDetails ? (
                                <skeletons.UniqueSocietyNameSkeleton />
                            ) : (
                                <h1
                                    className="text-5xl font-bold text-white text-center overflow-hidden text-ellipsis pb-4"
                                    style={{
                                        textShadow: "0 0 0px white",
                                    }}
                                >
                                    {name}
                                </h1>
                            )}
                            {loadingDetails ? (
                                <skeletons.UniqueSocietyTagsSkeleton />
                            ) : (
                                <div className="flex flex-wrap gap-2 justify-center mt-4">
                                    {tagInfo.map((tag, index) => (
                                        <span
                                            key={`${index}-${tag.label}`}
                                            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${tag.color} border-current/30`}
                                            title={tag.label}
                                        >
                                            {tag.label}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Table of Contents */}
                <nav className="mb-12">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5" />
                            Quick Navigation
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button
                                onClick={() => {
                                    document.getElementById('about')?.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'start'
                                    });
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all text-sm"
                            >
                                <Info className="w-4 h-4" />
                                About
                            </button>
                            <button
                                onClick={() => {
                                    document.getElementById('events')?.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'start'
                                    });
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all text-sm"
                            >
                                <Calendar className="w-4 h-4" />
                                Events
                            </button>
                            <button
                                onClick={() => {
                                    document.getElementById('contact')?.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'start'
                                    });
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all text-sm"
                            >
                                <Mail className="w-4 h-4" />
                                Contact
                            </button>
                            {website && website !== "No website available" && (
                                <button
                                    onClick={() => handleWebsiteClick(website)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all text-sm"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Website
                                </button>
                            )}
                        </div>
                    </div>
                </nav>

                {/* About Section */}
                <section id="about" className="mb-16">
                    <motion.div
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-3xl font-bold text-white mb-6">
                            About
                        </h2>

                        <div className="max-w-4xl">
                            <div className="text-lg text-gray-300 leading-relaxed mb-6">
                                <MarkdownRenderer content={description || `Welcome to ${name}! We're excited to have you learn more about our society.`} />
                            </div>

                            {/* Website Button */}
                            {website && website !== "No website available" && (
                                <div className="flex justify-between items-center">
                                    <span className="text-white font-medium">Visit our website:</span>
                                    <div className="ml-auto">
                                        <ShimmerButton
                                            variant="register"
                                            size="md"
                                            icon="arrow"
                                            onClick={() => handleWebsiteClick(website)}
                                            className="bg-blue-600/70 hover:bg-blue-600"
                                        >
                                            Visit Website
                                        </ShimmerButton>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </section>

                {/* Events Section */}
                <section id="events" className="mb-16">
                    <motion.div
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-green-400" />
                            {name ? `${name}${name.endsWith("s") ? "'" : "'s"} Events` : "Society Events"}
                        </h2>

                        <div className="bg-white/5 rounded-lg p-6">
                            {societyId && <UserEventsList user_id={societyId} editEvent={false} />}
                        </div>
                    </motion.div>
                </section>

                {/* Contact Section */}
                <section id="contact" className="mb-16">
                    <motion.div
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 flex flex-col"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-purple-400" />
                            Contact {name}
                        </h2>

                        <div className="max-w-2xl self-end">
                            <p className="text-gray-300 mb-6">
                                Have questions or want to get involved? Send us a message and we&apos;ll get back to you soon!
                            </p>
                            {societyId && <ContactForm societyName={name} societyId={societyId} />}
                        </div>
                    </motion.div>
                </section>
            </div>
        </div>
    );
}
