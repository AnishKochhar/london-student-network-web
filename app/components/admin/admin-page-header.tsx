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
        <div className="bg-black/20 border-b border-blue-800/30 sticky top-0 z-10 backdrop-blur-sm">
            <div className="px-6 py-5 sm:px-8">
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center gap-2 text-sm mb-4">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={index} className="flex items-center gap-2">
                                {crumb.href ? (
                                    <Link
                                        href={crumb.href}
                                        className="text-blue-300 hover:text-white transition-colors font-medium"
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="text-white font-medium">{crumb.label}</span>
                                )}
                                {index < breadcrumbs.length - 1 && (
                                    <ChevronRightIcon className="w-4 h-4 text-blue-400" />
                                )}
                            </div>
                        ))}
                    </nav>
                )}

                {/* Title and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm text-blue-200 mt-1.5 max-w-2xl">{description}</p>
                        )}
                    </div>
                    {actions && <div className="flex items-center gap-3">{actions}</div>}
                </div>
            </div>
        </div>
    );
}
