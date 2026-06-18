"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { cn } from "@/app/lib/utils";

type Props = {
    opportunityId: string;
    initialSaved: boolean;
    isLoggedIn: boolean;
    /** Where to send the user back to after a logged-out save → login flow. */
    returnTo: string;
    variant?: "icon" | "full";
    className?: string;
};

export default function SaveButton({
    opportunityId,
    initialSaved,
    isLoggedIn,
    returnTo,
    variant = "icon",
    className,
}: Props) {
    const router = useRouter();
    const [saved, setSaved] = useState(initialSaved);
    const [pending, setPending] = useState(false);

    async function toggle(e: React.MouseEvent) {
        // Cards use a stretched-link overlay; stop the click bubbling to it.
        e.preventDefault();
        e.stopPropagation();

        if (!isLoggedIn) {
            toast("Sign in to save opportunities");
            router.push(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
            return;
        }

        const next = !saved;
        setSaved(next);
        setPending(true);
        try {
            const res = await fetch(`/api/opportunities/${opportunityId}/save`, {
                method: next ? "POST" : "DELETE",
            });
            if (!res.ok) throw new Error("Request failed");
            toast.success(next ? "Saved" : "Removed from saved");
        } catch {
            setSaved(!next); // rollback optimistic update
            toast.error("Couldn't update your saved opportunities");
        } finally {
            setPending(false);
        }
    }

    const Icon = saved ? HeartSolid : HeartOutline;

    if (variant === "full") {
        return (
            <button
                type="button"
                onClick={toggle}
                disabled={pending}
                aria-pressed={saved}
                className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60",
                    saved
                        ? "border-rose-400/40 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25"
                        : "border-white/20 bg-white/5 text-white hover:bg-white/10",
                    className,
                )}
            >
                <Icon className="h-5 w-5" />
                {saved ? "Saved" : "Save"}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={pending}
            aria-label={saved ? "Remove from saved" : "Save opportunity"}
            aria-pressed={saved}
            className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 backdrop-blur transition-all hover:scale-105 hover:bg-black/50 disabled:opacity-60",
                saved ? "text-rose-400" : "text-white/70 hover:text-white",
                className,
            )}
        >
            <Icon className="h-5 w-5" />
        </button>
    );
}
