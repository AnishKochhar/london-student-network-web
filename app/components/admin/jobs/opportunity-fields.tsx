"use client";

/**
 * Shared opportunity form field set + converters.
 * Reused by the admin create/edit modal and the import review page so the two
 * stay in sync. Lists are edited as text (commas for tags, new lines for the
 * bullet lists) and converted to/from arrays at the edges.
 */

import {
    OPPORTUNITY_TYPE_LABELS,
    type Opportunity,
    type OpportunityDraft,
    type OpportunityLocationType,
    type OpportunityStatus,
    type OpportunityType,
} from "@/app/lib/opportunities/types";

export type OppFormValues = {
    title: string;
    organisation: string;
    type: OpportunityType;
    location: string;
    locationType: "" | OpportunityLocationType;
    salaryText: string;
    summary: string;
    descriptionMd: string;
    tags: string;
    goodFor: string;
    requirements: string;
    benefits: string;
    applyUrl: string;
    deadline: string; // datetime-local value (YYYY-MM-DDTHH:mm)
    featured: boolean;
    status: OpportunityStatus;
};

export function emptyForm(): OppFormValues {
    return {
        title: "",
        organisation: "",
        type: "internship",
        location: "",
        locationType: "",
        salaryText: "",
        summary: "",
        descriptionMd: "",
        tags: "",
        goodFor: "",
        requirements: "",
        benefits: "",
        applyUrl: "",
        deadline: "",
        featured: false,
        status: "draft",
    };
}

export function draftToForm(
    d: Partial<Opportunity> | OpportunityDraft | null | undefined,
): OppFormValues {
    const base = emptyForm();
    if (!d) return base;
    return {
        ...base,
        title: d.title ?? "",
        organisation: d.organisation ?? "",
        type: (d.type as OpportunityType) ?? "internship",
        location: d.location ?? "",
        locationType: (d.locationType as OpportunityLocationType) ?? "",
        salaryText: d.salaryText ?? "",
        summary: d.summary ?? "",
        descriptionMd: d.descriptionMd ?? "",
        tags: (d.tags ?? []).join(", "),
        goodFor: (d.goodFor ?? []).join("\n"),
        requirements: (d.requirements ?? []).join("\n"),
        benefits: (d.benefits ?? []).join("\n"),
        applyUrl: d.applyUrl ?? "",
        deadline: d.deadline ? toLocalInput(d.deadline) : "",
        featured: d.featured ?? false,
        status: (d.status as OpportunityStatus) ?? "draft",
    };
}

export function formToDraft(f: OppFormValues): OpportunityDraft {
    return {
        title: f.title.trim(),
        organisation: f.organisation.trim(),
        type: f.type,
        location: f.location.trim() || null,
        locationType: f.locationType || null,
        salaryText: f.salaryText.trim() || null,
        summary: f.summary.trim() || null,
        descriptionMd: f.descriptionMd.trim() || null,
        tags: splitList(f.tags, ","),
        goodFor: splitList(f.goodFor, "\n"),
        requirements: splitList(f.requirements, "\n"),
        benefits: splitList(f.benefits, "\n"),
        applyUrl: f.applyUrl.trim() || null,
        deadline: f.deadline ? new Date(f.deadline).toISOString() : null,
        featured: f.featured,
        status: f.status,
    };
}

function splitList(value: string, sep: string): string[] {
    return value
        .split(sep)
        .map((s) => s.trim())
        .filter(Boolean);
}

function toLocalInput(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    // Render as a local datetime-local value.
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// --- Field set ------------------------------------------------------------

const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-sky-400/50";
const labelClass = "block text-xs font-medium text-blue-200 mb-1";

export default function OpportunityFields({
    value,
    onChange,
    showStatus = true,
}: {
    value: OppFormValues;
    onChange: (patch: Partial<OppFormValues>) => void;
    showStatus?: boolean;
}) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className={labelClass}>Title *</label>
                    <input
                        className={inputClass}
                        value={value.title}
                        onChange={(e) => onChange({ title: e.target.value })}
                        placeholder="Summer Software Engineering Internship"
                    />
                </div>
                <div>
                    <label className={labelClass}>Organisation *</label>
                    <input
                        className={inputClass}
                        value={value.organisation}
                        onChange={(e) =>
                            onChange({ organisation: e.target.value })
                        }
                        placeholder="Monzo"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                    <label className={labelClass}>Type</label>
                    <select
                        className={inputClass}
                        value={value.type}
                        onChange={(e) =>
                            onChange({ type: e.target.value as OpportunityType })
                        }
                    >
                        {Object.entries(OPPORTUNITY_TYPE_LABELS).map(([v, l]) => (
                            <option key={v} value={v} className="bg-[#083157]">
                                {l}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Location type</label>
                    <select
                        className={inputClass}
                        value={value.locationType}
                        onChange={(e) =>
                            onChange({
                                locationType: e.target
                                    .value as OppFormValues["locationType"],
                            })
                        }
                    >
                        <option value="" className="bg-[#083157]">
                            Not set
                        </option>
                        <option value="on_site" className="bg-[#083157]">
                            On-site
                        </option>
                        <option value="hybrid" className="bg-[#083157]">
                            Hybrid
                        </option>
                        <option value="remote" className="bg-[#083157]">
                            Remote
                        </option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Location</label>
                    <input
                        className={inputClass}
                        value={value.location}
                        onChange={(e) => onChange({ location: e.target.value })}
                        placeholder="London (Hybrid)"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className={labelClass}>Pay / salary</label>
                    <input
                        className={inputClass}
                        value={value.salaryText}
                        onChange={(e) => onChange({ salaryText: e.target.value })}
                        placeholder="£4,500 / month"
                    />
                </div>
                <div>
                    <label className={labelClass}>Deadline</label>
                    <input
                        type="datetime-local"
                        className={inputClass}
                        value={value.deadline}
                        onChange={(e) => onChange({ deadline: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className={labelClass}>Apply URL</label>
                <input
                    className={inputClass}
                    value={value.applyUrl}
                    onChange={(e) => onChange({ applyUrl: e.target.value })}
                    placeholder="https://…"
                />
            </div>

            <div>
                <label className={labelClass}>Summary (1–2 lines for cards)</label>
                <textarea
                    className={inputClass}
                    rows={2}
                    value={value.summary}
                    onChange={(e) => onChange({ summary: e.target.value })}
                />
            </div>

            <div>
                <label className={labelClass}>Description (markdown)</label>
                <textarea
                    className={inputClass}
                    rows={6}
                    value={value.descriptionMd}
                    onChange={(e) => onChange({ descriptionMd: e.target.value })}
                />
            </div>

            <div>
                <label className={labelClass}>Tags (comma separated)</label>
                <input
                    className={inputClass}
                    value={value.tags}
                    onChange={(e) => onChange({ tags: e.target.value })}
                    placeholder="Software, Fintech, Backend"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                    <label className={labelClass}>Good for (one per line)</label>
                    <textarea
                        className={inputClass}
                        rows={4}
                        value={value.goodFor}
                        onChange={(e) => onChange({ goodFor: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClass}>Requirements (one per line)</label>
                    <textarea
                        className={inputClass}
                        rows={4}
                        value={value.requirements}
                        onChange={(e) =>
                            onChange({ requirements: e.target.value })
                        }
                    />
                </div>
                <div>
                    <label className={labelClass}>Benefits (one per line)</label>
                    <textarea
                        className={inputClass}
                        rows={4}
                        value={value.benefits}
                        onChange={(e) => onChange({ benefits: e.target.value })}
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-white">
                    <input
                        type="checkbox"
                        checked={value.featured}
                        onChange={(e) => onChange({ featured: e.target.checked })}
                        className="h-4 w-4 rounded border-white/20 bg-white/10"
                    />
                    Featured
                </label>

                {showStatus && (
                    <div className="inline-flex items-center gap-2">
                        <span className="text-sm text-blue-200">Status</span>
                        <select
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none"
                            value={value.status}
                            onChange={(e) =>
                                onChange({
                                    status: e.target
                                        .value as OpportunityStatus,
                                })
                            }
                        >
                            <option value="draft" className="bg-[#083157]">
                                Draft
                            </option>
                            <option value="published" className="bg-[#083157]">
                                Published
                            </option>
                            <option value="closed" className="bg-[#083157]">
                                Closed
                            </option>
                            <option value="archived" className="bg-[#083157]">
                                Archived
                            </option>
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
}
