"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import AccountDropdown from "./account-dropdown";

export default function AccountButton() {
    const { data: session } = useSession();

    if (session?.user) {
        return (
            <AccountDropdown
                userName={session.user.name}
                userEmail={session.user.email}
            />
        );
    }

    return (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
                href="/sign"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white font-medium transition-all duration-200"
            >
                <UserCircleIcon className="h-6 w-6" />
                <span className="text-sm">Sign In</span>
            </Link>
        </motion.div>
    );
}
