import Image from "next/image";
import { useEffect, useState } from "react";

async function fetchAccountLogo(id: string): Promise<string> {
    try {
        const res = await fetch("/api/user/get-account-logo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(id),
        });

        const { logo_url } = await res.json();
        return logo_url || "";
    } catch (error) {
        console.error("Error loading logo:", error);
        return "";
    }
}

export default function AccountLogo({
    id,
    role,
    sidebar = false,
}: {
    id: string;
    role: string;
    sidebar?: boolean;
}) {
    const [logo, setLogo] = useState("");

    useEffect(() => {
        if (role === "organiser") {
            fetchAccountLogo(id).then(setLogo);
        }
    }, [role, id]);

    if (sidebar) {
        return logo ? (
            <Image
                src={logo}
                alt="Organisation Logo"
                width={64}
                height={64}
                className="w-12 h-12 lg:w-16 lg:h-16 object-contain rounded-lg"
            />
        ) : (
            <span className="text-xl lg:text-2xl">👤</span>
        );
    }

    return (
        <div className="pb-4 space-y-6">
            <p className="text-sm capitalize flex flex-col">
                <h3 className="text-lg font-semibold mb-2 text-white">Logo</h3>
                {logo ? (
                    <Image
                        src={logo}
                        alt="Account Logo"
                        width={96}
                        height={96}
                        className="w-24 h-24 object-cover border-2 border-gray-300 rounded"
                    />
                ) : (
                    <Image
                        src="/images/no-image-found.png"
                        alt="No logo found"
                        width={96}
                        height={96}
                        className="w-24 h-24 object-cover border-2 border-gray-300 rounded"
                    />
                )}
            </p>
        </div>
    );
}
