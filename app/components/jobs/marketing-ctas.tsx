import Link from "next/link";
import {
    EnvelopeIcon,
    BuildingOffice2Icon,
    ArrowRightIcon,
} from "@heroicons/react/24/outline";

/**
 * Presentational marketing bands for the bottom of /jobs.
 * Both link to /contact for now — a real newsletter signup (which needs a
 * Turnstile captcha) and an employer flow are deliberately deferred.
 */
export function MarketingCtas() {
    return (
        <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Newsletter */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-transparent p-8">
                    <EnvelopeIcon className="h-8 w-8 text-sky-300" />
                    <h3 className="mt-4 text-xl font-semibold text-white">
                        Never miss an opportunity
                    </h3>
                    <p className="mt-2 text-sm text-white/60">
                        Get the best new internships and graduate roles for London
                        students delivered to your inbox.
                    </p>
                    <Link
                        href="/contact"
                        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300 hover:text-sky-200"
                    >
                        Join the newsletter
                        <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                </div>

                {/* Employer */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent p-8">
                    <BuildingOffice2Icon className="h-8 w-8 text-emerald-300" />
                    <h3 className="mt-4 text-xl font-semibold text-white">
                        Hiring London students?
                    </h3>
                    <p className="mt-2 text-sm text-white/60">
                        Reach thousands of students and graduates across London&apos;s
                        universities. Tell us about the roles you&apos;re hiring for.
                    </p>
                    <Link
                        href="/contact"
                        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
                    >
                        Partner with LSN
                        <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
