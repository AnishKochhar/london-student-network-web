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
}: {
    id: string;
    role: string;
}) {
    const [logo, setLogo] = useState("");

    useEffect(() => {
        if (role === "organiser") {
            fetchAccountLogo(id).then(setLogo);
        }
    }, [role, id]);

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
