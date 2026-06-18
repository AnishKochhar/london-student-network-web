"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import type { Opportunity } from "@/app/lib/opportunities/types";
import OpportunityFields, {
    draftToForm,
    emptyForm,
    formToDraft,
    type OppFormValues,
} from "./opportunity-fields";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    initial?: Opportunity | null;
    onSaved: () => void;
};

export default function OpportunityFormModal({
    isOpen,
    onClose,
    initial,
    onSaved,
}: Props) {
    const [form, setForm] = useState<OppFormValues>(emptyForm());
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) setForm(initial ? draftToForm(initial) : emptyForm());
    }, [isOpen, initial]);

    async function save() {
        if (!form.title.trim() || !form.organisation.trim()) {
            toast.error("Title and organisation are required.");
            return;
        }
        setSaving(true);
        try {
            const draft = formToDraft(form);
            const res = initial
                ? await fetch(`/api/admin/opportunities/${initial.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ kind: "edit", data: draft }),
                  })
                : await fetch(`/api/admin/opportunities`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(draft),
                  });
            if (!res.ok) throw new Error("Save failed");
            toast.success(initial ? "Opportunity updated" : "Opportunity created");
            onSaved();
            onClose();
        } catch {
            toast.error("Couldn't save the opportunity");
        } finally {
            setSaving(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        className="my-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0a2540] shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                            <h2 className="text-lg font-semibold text-white">
                                {initial ? "Edit opportunity" : "New opportunity"}
                            </h2>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                            <OpportunityFields
                                value={form}
                                onChange={(patch) =>
                                    setForm((f) => ({ ...f, ...patch }))
                                }
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
                            <button
                                onClick={onClose}
                                className="rounded-xl px-4 py-2 text-sm text-white/70 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={save}
                                disabled={saving}
                                className="rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 px-5 py-2 text-sm font-semibold text-[#04243f] transition-all hover:from-sky-300 hover:to-emerald-300 disabled:opacity-60"
                            >
                                {saving ? "Saving…" : initial ? "Save changes" : "Create"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
