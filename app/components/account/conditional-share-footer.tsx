"use client";

import { usePathname } from "next/navigation";
import ShareFooter from "./share-footer";

export default function ConditionalShareFooter() {
    const pathname = usePathname();

    // Only show on account page
    if (pathname !== "/account") {
        return null;
    }

    return <ShareFooter />;
}