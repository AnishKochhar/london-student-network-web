"use client";

// Plan for this page, add notificatoin button between the two cards below the banner, which will send emails to you when the
// society creates an event on LSN.
// Also add custom styles to tailwind config, so that style prop no longer needed

// also complete all the skeletons

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/app/components/button";
import UserEventsList from "@/app/components/account/user-events-list";
import NextImage from "next/image"; // using NextImage instead of Image to avoid Namespace clashs with javascript Image method in extractAndSetMainColor
import { FetchAccountDetailsPromiseInterface, Tag } from "@/app/lib/types";
import { getAllTags } from "@/app/utils/tag-categories";
import { formattedWebsite } from "@/app/lib/utils";
import * as skeletons from "@/app/components/skeletons/unique-society";
import SendEmailPage from "../../message/[id]/page";
import MarkdownRenderer from "@/app/components/markdown/markdown-renderer";

export default function SocietyPage() {
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
                    // Get all tags from the new TAG_CATEGORIES system
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

    return (
        <div className="flex flex-col min-h-screen p-8 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
            {/* Header Section */}
            <header className="relative flex flex-col items-center pb-[100px]">
                {/* Banner Background */}
                <div
                    className="absolute inset-0 -m-8 mb-16 h-full z-0"
                    style={{
                        background: bannerBackground,
                        opacity: 1, // Adjust this value to control the transparency (lower = more transparent)
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
                                    alt="Account Logo"
                                    width={280}
                                    height={280}
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
                                    textShadow: "0 0 0px white", // modify if glow wanted
                                }}
                            >
                                {name}
                            </h1>
                        )}
                        {loadingDetails ? (
                            <skeletons.UniqueSocietyTagsSkeleton />
                        ) : (
                            <div className="mt-2">
                                {tags.length > 0 && <span>|</span>}
                                {tags.map((tag, index) => (
                                    <>
                                        <span
                                            key={`${index}-${tag}`}
                                            className="text-white px-2 py-1 rounded-full text-sm hover:cursor-default"
                                        >
                                            {tag}
                                        </span>
                                        {index < tags.length - 1 && (
                                            <span>|</span>
                                        )}
                                    </>
                                ))}
                                {tags.length > 0 && <span>|</span>}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Divider */}
            <div className="flex justify-center -mx-8">
                <div className="w-full h-[2px] bg-blue-50 rounded-full mb-6"></div>
            </div>

            {/* Middle Content Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Left Section (SendEmailPage Component) */}
                <div className="bg-transparent shadow-lg p-4 rounded-lg order-2 md:order-1 w-full min-w-[350px] text-center">
                    <SendEmailPage className="min-w-[350px] flex flex-col justify-start p-10 bg-transparent" />
                </div>

                {/* Right Section ("Who are we?" with Description and Website Button) */}
                <div className="bg-transparent shadow-lg p-6 rounded-xl mx-auto w-full order-1 md:order-2 flex flex-col h-full items-center justify-center">
                    {/* Section Title */}
                    <h3 className="text-2xl font-bold text-white mb-4 text-center">
                        Who Are We?
                    </h3>

                    {/* Description */}
                    <div className="flex justify-center">
                        <div className="text-lg text-white mb-6 leading-relaxed">
                            <MarkdownRenderer content={description || `Welcome to ${name}`} />
                        </div>
                    </div>

                    {/* Website Button */}
                    {website && website !== "No website available" && (
                        <>
                            {/* Subheading */}
                            <h4 className="text-xl font-semibold text-white mb-4 text-center">
                                Check out our website
                            </h4>

                            <div className="flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => handleWebsiteClick(website)}
                                    className="bg-transparent text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition text-lg"
                                >
                                    <span className="flex items-center">
                                        <span className="mr-3">Website</span>
                                        <NextImage
                                            src="/icons/web.png"
                                            alt="website icon"
                                            width={24}
                                            height={24}
                                            className="object-cover"
                                        />
                                    </span>
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Divider */}
            <div className="flex justify-center -mx-8">
                <div className="w-full h-[2px] bg-blue-50 rounded-full mb-6"></div>
            </div>

            {/* Events Section */}
            <section className="border-b border-gray-300 pb-4 mb-10 space-y-6">
                <h2 className="text-2xl italic mb-2 ml-2 text-center uppercase">
                    {name
                        ? `${name}${name.endsWith("s") ? "'" : "'s"} events`
                        : "Societies' events"}
                </h2>
                <UserEventsList user_id={stringid} editEvent={false} />
            </section>
        </div>
    );
}
