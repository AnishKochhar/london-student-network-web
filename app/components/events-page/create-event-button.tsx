"use client";

import { PlusIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { LiquidButton } from "../ui/liquid-button";
import { useState } from "react";

export default function CreateEventButton() {
    const router = useRouter();
    const session = useSession();
    const [isHovered, setIsHovered] = useState(false);

    const handleCreateEvent = async () => {
        if (session) {
            router.push("/events/create");
        } else {
            router.push("/login");
        }
    };

    return (
        <motion.div
            className="self-center mb-8 md:mb-4 md:self-end"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.5,
                delay: 0.3,
                type: "spring",
                stiffness: 200,
                damping: 15
            }}
        >
            <LiquidButton
                size="lg"
                onClick={handleCreateEvent}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group font-semibold text-white hover:text-blue-200 transition-colors duration-300"
            >
                <motion.div
                    className="flex items-center justify-center"
                    animate={{
                        rotate: isHovered ? 90 : 0,
                    }}
                    transition={{
                        duration: 0.3,
                        ease: "easeInOut"
                    }}
                >
                    <PlusIcon className="w-6 h-6" />
                </motion.div>
                <span className="text-base">Create An Event</span>
            </LiquidButton>
        </motion.div>
    );
}
