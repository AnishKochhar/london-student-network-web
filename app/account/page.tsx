"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ExclamationCircleIcon, CheckIcon, XMarkIcon, AtSymbolIcon } from "@heroicons/react/24/outline";
import { Button } from "@/app/components/button";
import UserEventsList from "../components/account/user-events-list";
import UserForumPosts from "../components/account/user-forum-posts";
import AccountFields from "../components/account/account-fields";
import AccountLogo from "../components/account/account-logo";
import ForgottenPasswordModal from "../components/login/reset-password-modal";
import UsernameCreationModal from "../components/forum/username-creation-modal";
import toast from "react-hot-toast";

export default function AccountPage() {
    const [showForgottenPasswordModal, setShowForgottenPasswordModal] = useState(false);
    const [activeSection, setActiveSection] = useState("personal");
    const { data: session, status } = useSession();
    const contentRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [username, setUsername] = useState<string | null>(null);
    const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
    const [loadingUsername, setLoadingUsername] = useState(true);

    // Navigation sections
    const sections = useMemo(() => [
        { id: "personal", label: "Personal information", icon: "👤" },
        { id: "events", label: "Your events", icon: "📅" },
        { id: "forum", label: "Forum activity", icon: "💬" },
        { id: "account", label: "Account settings", icon: "⚙️" },
    ], []);

    useEffect(() => {
        if (status === "loading") return;
        if (!session) router.push("/login");
    }, [session, status, router]);

    // Fetch username when session loads
    useEffect(() => {
        const fetchUsername = async () => {
            if (!session?.user?.id) return;

            try {
                const response = await fetch("/api/username/get");
                if (response.ok) {
                    const data = await response.json();
                    if (data.hasUsername) {
                        setUsername(data.username);
                    }
                }
            } catch (error) {
                console.error("Error fetching username:", error);
            } finally {
                setLoadingUsername(false);
            }
        };

        fetchUsername();
    }, [session?.user?.id]);

    // Scroll spy functionality using window scroll
    useEffect(() => {
        const handleScroll = () => {
            const sectionElements = sections.map(section =>
                document.getElementById(section.id)
            ).filter(Boolean) as HTMLElement[];

            if (sectionElements.length === 0) return;

            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const offset = 150; // Offset for better UX

            // Find the section that's currently in view
            let currentSection = sections[0].id;

            for (let i = 0; i < sectionElements.length; i++) {
                const element = sectionElements[i];
                if (element) {
                    const elementTop = element.offsetTop;

                    if (elementTop <= scrollTop + offset) {
                        currentSection = sections[i].id;
                    } else {
                        break;
                    }
                }
            }

            setActiveSection(currentSection);
        };

        // Use window scroll events
        window.addEventListener('scroll', handleScroll);
        // Initial call to set active section
        setTimeout(handleScroll, 100); // Delay to ensure DOM is ready

        return () => window.removeEventListener('scroll', handleScroll);
    }, [sections]);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);

        if (element) {
            // Use scrollIntoView with window scroll
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
        }
    };

    const handleForgottenPasswordPress = () => {
        setShowForgottenPasswordModal(true);
    };

    const handleNameDoubleClick = () => {
        if (session?.user?.role === "organiser") {
            setIsEditingName(true);
            setEditedName(session.user.name || "");
        }
    };

    const handleNameCancel = () => {
        setIsEditingName(false);
        setEditedName("");
    };

    const handleUsernameDoubleClick = () => {
        if (!username) {
            setIsUsernameModalOpen(true);
        }
    };

    const handleUsernameCreated = (newUsername: string) => {
        setUsername(newUsername);
        setIsUsernameModalOpen(false);
        toast.success(`Username set: @${newUsername}`);
    };

    const handleNameSave = async () => {
        if (!editedName.trim()) {
            toast.error("Name cannot be empty");
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading("Updating name...");

        try {
            const response = await fetch("/api/account/update-name", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: editedName }),
            });

            const result = await response.json();

            if (result.success) {
                setIsEditingName(false);
                toast.success("Name updated successfully! You'll be signed out to refresh your session.", {
                    id: toastId,
                    duration: 4000
                });

                // Sign out and redirect back to account page
                // This ensures they get a fresh JWT token with the updated name
                setTimeout(async () => {
                    await signOut({
                        callbackUrl: "/login?redirect=/account&message=name-updated"
                    });
                }, 1500);
            } else {
                toast.error(result.error || "Failed to update name", { id: toastId });
            }
        } catch (error) {
            console.error("Error updating name:", error);
            toast.error("Failed to update name", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white">Loading your account details...</p>
                </div>
            </div>
        );
    }

    if (session) {
        const { user } = session;

        return (
            <div className="min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
                <div className="flex max-w-7xl mx-auto min-h-screen">
                    {/* Left Sidebar - Table of Contents */}
                    <div className="hidden md:flex md:w-64 lg:w-80 xl:w-96 bg-white/5 backdrop-blur-sm border-r border-white/10 flex-shrink-0">
                        <div className="sticky top-0 p-4 lg:p-8 w-full flex flex-col h-screen">
                            {/* Header */}
                            <div className="mb-8 flex-shrink-0">
                                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                                    <AccountLogo id={user.id} role={user.role} sidebar={true} />
                                </div>
                                <h1 className="text-lg lg:text-2xl font-semibold text-white mb-2 truncate">{user?.name || "Your Account"}</h1>
                                <p className="text-gray-300 text-xs lg:text-sm truncate">{user?.email}</p>
                            </div>

                            {/* Navigation */}
                            <nav className="space-y-2 flex-grow">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={`w-full text-left px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-all duration-200 flex items-center gap-2 lg:gap-3 ${
                                            activeSection === section.id
                                                ? "bg-white/20 text-white border border-white/20"
                                                : "text-gray-300 hover:bg-white/10 hover:text-white"
                                        }`}
                                    >
                                        <span className="text-base lg:text-lg flex-shrink-0">{section.icon}</span>
                                        <span className="font-medium text-sm lg:text-base truncate">{section.label}</span>
                                    </button>
                                ))}
                            </nav>

                            {/* Sign Out Button - Pinned to bottom */}
                            <div className="mt-auto pt-4 lg:pt-8 border-t border-white/10 flex-shrink-0">
                                <Button
                                    variant="ghost"
                                    className="w-full text-red-300 hover:text-red-200 hover:bg-red-500/10 justify-start px-3 lg:px-4 text-sm lg:text-base"
                                    onClick={() => router.push("/logout")}
                                >
                                    Sign out
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Content Area */}
                    <div className="flex-1 min-h-screen" ref={contentRef}>
                        <div className="p-4 md:p-8 space-y-8 md:space-y-16">
                                {/* Personal Information Section */}
                                <section id="personal" className="scroll-mt-8">
                                    <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-8">Personal information</h2>
                                    <p className="text-gray-300 mb-4 md:mb-8">View your personal information and contact details</p>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                        <div className={`bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 ${user?.role === "organiser" ? "opacity-100" : "opacity-75"} ${isEditingName ? "relative" : ""}`}>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                                Name {user?.role === "organiser" && <span className="text-xs text-blue-300">(double-click to edit)</span>}
                                            </label>
                                            {isEditingName ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editedName}
                                                        onChange={(e) => setEditedName(e.target.value)}
                                                        className="flex-1 bg-white/10 rounded-lg px-4 py-3 text-white font-medium border border-white/20 focus:border-blue-400 focus:outline-none"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") handleNameSave();
                                                            if (e.key === "Escape") handleNameCancel();
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    className={`bg-white/5 rounded-lg px-4 py-3 text-gray-300 font-medium ${
                                                        user?.role === "organiser"
                                                            ? "cursor-pointer hover:bg-white/10 transition-colors"
                                                            : "cursor-not-allowed"
                                                    }`}
                                                    onDoubleClick={handleNameDoubleClick}
                                                    aria-disabled={user?.role !== "organiser"}
                                                >
                                                    {user?.name || "Not provided"}
                                                </div>
                                            )}

                                            {/* Save buttons - positioned inside the name field card on desktop */}
                                            {isEditingName && (
                                                <div className="flex gap-2 justify-end mt-4">
                                                    <button
                                                        onClick={handleNameCancel}
                                                        disabled={isSaving}
                                                        className="flex items-center justify-center px-3 py-1.5 text-sm bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <XMarkIcon className="h-4 w-4 mr-1" />
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleNameSave}
                                                        disabled={isSaving || !editedName.trim()}
                                                        className="flex items-center justify-center px-3 py-1.5 text-sm bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/30"
                                                    >
                                                        {isSaving ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mr-1"></div>
                                                                Saving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckIcon className="h-4 w-4 mr-1" />
                                                                Save
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 opacity-75">
                                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                                Email
                                            </label>
                                            <div className="bg-white/5 rounded-lg px-4 py-3 text-gray-300 font-medium cursor-not-allowed" aria-disabled="true">
                                                {user?.email || "Not provided"}
                                            </div>
                                        </div>

                                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 opacity-75">
                                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                                Role
                                            </label>
                                            <div className="bg-white/5 rounded-lg px-4 py-3 text-gray-300 font-medium capitalize cursor-not-allowed" aria-disabled="true">
                                                {user?.role || "User"}
                                            </div>
                                        </div>

                                        <div className={`bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 ${username ? "opacity-75" : "opacity-100"}`}>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                                Forum Username {!username && <span className="text-xs text-blue-300">(double-click to set)</span>}
                                            </label>
                                            <div
                                                className={`bg-white/5 rounded-lg px-4 py-3 font-medium flex items-center gap-2 ${
                                                    username
                                                        ? "text-gray-300 cursor-not-allowed"
                                                        : "text-gray-400 cursor-pointer hover:bg-white/10 transition-colors"
                                                }`}
                                                onDoubleClick={handleUsernameDoubleClick}
                                                aria-disabled={!!username}
                                            >
                                                {loadingUsername ? (
                                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <AtSymbolIcon className="h-4 w-4 text-gray-400" />
                                                        {username || "Not set - double click to create"}
                                                    </>
                                                )}
                                            </div>
                                            {username && (
                                                <p className="text-xs text-gray-500 mt-2">Username cannot be changed once set</p>
                                            )}
                                        </div>

                                        {user.role === "organiser" && (
                                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 lg:col-span-2">
                                                <label className="block text-sm font-medium text-gray-300 mb-2">Organization Logo</label>
                                                <div className="mt-2">
                                                    <AccountLogo id={user.id} role={user.role} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {user.role === "organiser" && (
                                        <div className="mt-8">
                                            <AccountFields id={user.id} role={user.role} />
                                        </div>
                                    )}
                                </section>

                                {/* Your Events Section */}
                                <section id="events" className="scroll-mt-8">
                                    <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-8">Your events</h2>
                                    <p className="text-gray-300 mb-4 md:mb-8">View and manage events you&apos;ve created or are organising</p>

                                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
                                        <UserEventsList user_id={user.id} editEvent={true} />
                                    </div>
                                </section>

                                {/* Forum Posts Section */}
                                <section id="forum" className="scroll-mt-8">
                                    <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-8">Forum activity</h2>
                                    <p className="text-gray-300 mb-4 md:mb-8">View your forum threads and replies</p>

                                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
                                        <UserForumPosts />
                                    </div>
                                </section>

                                {/* Account Settings Section */}
                                <section id="account" className="scroll-mt-8">
                                    <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-8">Account settings</h2>
                                    <p className="text-gray-300 mb-4 md:mb-8">Manage your account security and preferences</p>

                                    <div className="space-y-4 md:space-y-6">
                                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
                                            <h3 className="text-lg font-semibold text-white mb-4">Security</h3>
                                            <p className="text-gray-300 mb-4">Update your password to keep your account secure</p>
                                            <Button
                                                variant="ghost"
                                                className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 text-sm md:text-base"
                                                onClick={handleForgottenPasswordPress}
                                            >
                                                Reset Your Password
                                            </Button>
                                        </div>
                                    </div>
                                </section>

                                {/* Bottom padding for scroll */}
                                <div className="h-32"></div>
                        </div>
                    </div>
                </div>

                {showForgottenPasswordModal && (
                    <ForgottenPasswordModal
                        onClose={() => setShowForgottenPasswordModal(false)}
                    />
                )}

                {isUsernameModalOpen && (
                    <UsernameCreationModal
                        isOpen={isUsernameModalOpen}
                        onClose={() => setIsUsernameModalOpen(false)}
                        onSuccess={handleUsernameCreated}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="text-center">
                <ExclamationCircleIcon className="h-10 w-10 text-red-500 mx-auto" />
                <p className="mt-2 text-lg">
                    Something went wrong. Please try again later.
                </p>
            </div>
        </div>
    );
}
