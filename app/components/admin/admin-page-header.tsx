import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

interface Breadcrumb {
    label: string;
    href?: string;
}

interface AdminPageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: Breadcrumb[];
    actions?: React.ReactNode;
}

export default function AdminPageHeader({
    title,
    description,
    breadcrumbs,
    actions,
}: AdminPageHeaderProps) {
    return (
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
            <div className="px-6 py-4 sm:px-8">
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center gap-2 text-sm mb-3">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={index} className="flex items-center gap-2">
                                {crumb.href ? (
                                    <Link
                                        href={crumb.href}
                                        className="text-slate-600 hover:text-slate-900 transition-colors"
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="text-slate-400">{crumb.label}</span>
                                )}
                                {index < breadcrumbs.length - 1 && (
                                    <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                                )}
                            </div>
                        ))}
                    </nav>
                )}

                {/* Title and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm text-slate-600 mt-1">{description}</p>
                        )}
                    </div>
                    {actions && <div className="flex items-center gap-3">{actions}</div>}
                </div>
            </div>
        </div>
    );
}
