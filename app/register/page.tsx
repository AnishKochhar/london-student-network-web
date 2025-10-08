"use client";

import {
    UserGroupIcon,
    UserIcon,
    BriefcaseIcon,
    UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";

export default function Register() {
    return (
        <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10">
            <h1 className="text-2xl p-10 text-center y-8 sm:my-12 tracking-wide">
                Choose your account type to get started
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
                <OptionButton
                    name="student"
                    tooltip="Current university students with a .ac.uk email address"
                />
                <OptionButton
                    name="society"
                    tooltip="Student societies and university organizations"
                />
                <OptionButton
                    name="company"
                    tooltip="Companies and sponsors looking to connect with students"
                />
                <OptionButton
                    name="other"
                    tooltip="Alumni, staff, or anyone without a university email"
                />
            </div>
        </main>
    );
}

function OptionButton({ name, tooltip }: { name: "student" | "society" | "company" | "other"; tooltip: string }) {
    const [showTooltip, setShowTooltip] = useState(false);

    const icons = {
        student: <UserIcon width={120} height={120} className="[&>path]:stroke-[0.4] sm:w-[150px] sm:h-[150px]" />,
        society: <UserGroupIcon width={120} height={120} className="[&>path]:stroke-[0.4] sm:w-[150px] sm:h-[150px]" />,
        company: <BriefcaseIcon width={120} height={120} className="[&>path]:stroke-[0.4] sm:w-[150px] sm:h-[150px]" />,
        other: <UsersIcon width={120} height={120} className="[&>path]:stroke-[0.4] sm:w-[150px] sm:h-[150px]" />,
    };

    const labels = {
        student: "Student",
        society: "Society",
        company: "Company",
        other: "Other",
    };

    return (
        <Link
            href={`/register/${name}`}
            className="relative flex flex-col border border-white/50 p-8 rounded-lg shadow-xl items-center justify-center transition-all duration-300 ease-in-out hover:scale-105 hover:bg-white/20 bg-white/10 group"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className="flex flex-col items-center justify-center">
                {icons[name]}
                <h2 className="text-2xl font-semibold w-full text-center mt-6 text-white">
                    {labels[name]}
                </h2>
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 max-w-[250px] text-center">
                    {tooltip}
                </div>
            )}
        </Link>
    );
}
