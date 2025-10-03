"use client";

// REDIRECT PAGE: This page redirects UUID-based URLs to slug-based URLs
// Old URL: /societies/society/[uuid]
// New URL: /societies/[slug]
// This maintains backward compatibility for bookmarks and old links

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// import { Button } from "@/app/components/button";
import UserEventsList from "@/app/components/account/user-events-list";
import NextImage from "next/image"; // using NextImage instead of Image to avoid Namespace clashs with javascript Image method in extractAndSetMainColor
import { FetchAccountDetailsPromiseInterface } from "@/app/lib/types";
import { getAllTags, getCategoryByTagValue } from "@/app/utils/tag-categories";
import { formattedWebsite } from "@/app/lib/utils";
import * as skeletons from "@/app/components/skeletons/unique-society";
// import SendEmailPage from "../../message/[id]/page";
import MarkdownRenderer from "@/app/components/markdown/markdown-renderer";
import { ExternalLink, MessageSquare, Calendar, Info, Mail } from "lucide-react";
import { motion } from "framer-motion";
import ContactForm from "@/app/components/societies/contact-form";
import { ShimmerButton } from "@/app/components/ui/shimmer-button";

export default function SocietyRedirectPage() {
    const { id } = useParams();
    const router = useRouter();
    const stringid = id instanceof Array ? id[0] : id;

    // Redirect to slug-based URL
    useEffect(() => {
        const redirectToSlug = async () => {
            try {
                const response = await fetch("/api/societies/get-slug", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ organiser_uid: stringid }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.slug) {
                        // Permanent redirect (301)
                        router.replace(`/societies/${data.slug}`);
                        return;
                    }
                }

                // If slug not found, redirect to societies page
                router.replace("/societies");
            } catch (error) {
                console.error("Error fetching slug for redirect:", error);
                router.replace("/societies");
            }
        };

        if (stringid) {
            redirectToSlug();
        }
    }, [stringid, router]);

    // Show loading state while redirecting
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] flex items-center justify-center">
            <div className="text-white text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg">Redirecting...</p>
            </div>
        </div>
    );
}

// The following is the old society page code - kept for reference but not used
// This page now only handles redirects
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OldSocietyPage_UNUSED() {
    const [loadingDetails, setLoadingDetails] = useState<boolean>(true);
    const [loadingName, setLoadingName] = useState<boolean>(true);
    const [name, setName] = useState<string>("");
    const [logo, setLogo] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [website, setWebsite] = useState<string>("");
    const [tags, setTags] = useState<string[]>([]);
    // const [mainColor, setMainColor] = useState<string>('');
    const mainColor = "";
    const [bannerBackground, setBannerBackground] =
        useState<string>("transparent");
    const { id } = useParams();
    const stringid = id instanceof Array ? id[0] : id;

    // fetch and set logo, website, description, tags, if available
    useEffect(() => {
        const fetchDetails = async (id: string) => {
            try {
                setLoadingDetails(true);
                const result: FetchAccountDetailsPromiseInterface =
                    await fetchAccountDetails(id);

                setLogo(result.logo_url);
                setDescription(result.description);
                setWebsite(result.website);

                if (result.tags.length > 0) {
                    const allTags = getAllTags();

                    // Map tag values to labels using the new system
                    const mappedTags = result.tags.map((tagValue: number) => {
                        const tag = allTags.find(t => t.value === tagValue);
                        return tag ? tag.label : "Unknown Tag";
                    });
                    setTags(mappedTags);
                } else {
                    setTags([]);
                }

                setLoadingDetails(false);
            } catch (error) {
                setLoadingDetails(false);
                console.error("Error fetching account details:", error);
            }
        };

        fetchDetails(stringid);
    }, [stringid]);

    // fetch and set name of society
    useEffect(() => {
        const fetchAndSetName = async (id: string) => {
            try {
                setLoadingName(true);
                const result = await fetchSocietyName(id);
                setName(result?.name || "Unknown Society");

                setLoadingName(false);
            } catch (error) {
                setLoadingName(false);
                console.error("Error fetching society name:", error);
            }
        };

        fetchAndSetName(stringid);
    }, [stringid]);

    // set background colour for banner, for custom or dynamic banners
    useEffect(() => {
        // Set the banner background color to the main color, or fallback to a solid gray
        const background = mainColor
            ? "transparent" // switching to mainColor is also available, but couldn't make it look good
            : "transparent"; // switching to '#CCCCCC' is also available, but couldn't make it look good

        setBannerBackground(background);
    }, [mainColor]);

    // useEffect(() => { // uncomment if dynamic banner wanted
    //     if (logo && typeof logo === 'string') extractAndSetMainColor();
    // }, [logo]);

    async function fetchSocietyName(id: string): Promise<{ name: string }> {
        try {
            const response = await fetch("/api/societies/get-organiser-name", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok)
                throw new Error("Failed to fetch organiser details");

            return await response.json();
        } catch (err) {
            console.error("Error fetching organiser details:", err);
        }
    }

    async function fetchAccountDetails(
        id: string,
    ): Promise<FetchAccountDetailsPromiseInterface> {
        try {
            const res = await fetch("/api/user/get-account-fields", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(id),
            });

            const { logo_url, description, website, tags } = await res.json();

            return { logo_url, description, website, tags };
        } catch (error) {
            console.error("Error loading description:", error);
        }
    }

    // const extractAndSetMainColor = () => { // move to utils in the future
    //     const canvas = document.createElement('canvas');
    //     const context = canvas.getContext('2d');
    //     if (!context || !logo) return;

    //     const img = new window.Image();
    //     img.crossOrigin = 'Anonymous';
    //     img.src = logo;

    //     img.onload = () => {
    //         canvas.width = img.width;
    //         canvas.height = img.height;
    //         context.drawImage(img, 0, 0);

    //         const pixelData = context.getImageData(0, 0, img.width, img.height).data;
    //         let r = 0, g = 0, b = 0, count = 0;

    //         // Averaging pixel colors to find the most prominent color
    //         for (let i = 0; i < pixelData.length; i += 4) {
    //             r += pixelData[i];     // Red
    //             g += pixelData[i + 1]; // Green
    //             b += pixelData[i + 2]; // Blue
    //             count++;
    //         }

    //         // Calculate average color
    //         r = Math.floor(r / count);
    //         g = Math.floor(g / count);
    //         b = Math.floor(b / count);

    //         const mainColor = `rgb(${Math.floor(r*0.7)}, ${Math.floor(g*0.7)}, ${Math.floor(b*0.7)})`;
    //         setMainColor(mainColor);
    //     };
    // };

    const handleWebsiteClick = (website: string) => {
        // turns website button into link
        window.open(formattedWebsite(website), "_blank"); // open in new tab
    };

    // Get tag information with categories for styling
    const tagInfo = tags.map(tagLabel => {
        // Find the tag value from label
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
                {/* Header Section - keeping existing layout */}
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
                            {loadingName ? (
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
                                            {/* <span className="mr-1">{tag.icon}</span> */}
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
                            <UserEventsList user_id={stringid} editEvent={false} />
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
                            <ContactForm societyName={name} societyId={stringid} />
                        </div>
                    </motion.div>
                </section>
            </div>
        </div>
    );
}
