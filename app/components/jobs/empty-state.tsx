import Link from "next/link";
import { InboxIcon } from "@heroicons/react/24/outline";

type Props = {
    title: string;
    description: string;
    icon?: React.ReactNode;
    action?: { label: string; href: string };
};

export default function EmptyState({ title, description, icon, action }: Props) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/50">
                {icon ?? <InboxIcon className="h-7 w-7" />}
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1.5 max-w-md text-sm text-white/60">{description}</p>
            {action && (
                <Link
                    href={action.href}
                    className="mt-6 inline-flex items-center rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 px-5 py-2.5 text-sm font-semibold text-[#04243f] transition-all hover:from-sky-300 hover:to-emerald-300"
                >
                    {action.label}
                </Link>
            )}
        </div>
    );
}
