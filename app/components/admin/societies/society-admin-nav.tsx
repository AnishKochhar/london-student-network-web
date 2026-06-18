"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Section sub-navigation for the Society Intelligence admin area. Kept inside
 * the society pages (rather than editing the shared admin sidebar) so this
 * feature stays self-contained. Links are added as each phase ships them.
 */
const LINKS: { href: string; label: string }[] = [
    { href: "/admin/societies", label: "Overview" },
    { href: "/admin/societies/sources", label: "Sources" },
    { href: "/admin/societies/imports", label: "Imports" },
    { href: "/admin/societies/review", label: "Review queue" },
];

export default function SocietyAdminNav() {
    const pathname = usePathname();
    return (
        <nav className="flex flex-wrap gap-2">
            {LINKS.map((link) => {
                const active =
                    link.href === "/admin/societies"
                        ? pathname === link.href
                        : pathname.startsWith(link.href);
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`rounded-xl border px-3 py-1.5 text-sm transition-colors ${
                            active
                                ? "border-sky-400/40 bg-sky-400/15 text-white"
                                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                        }`}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}
