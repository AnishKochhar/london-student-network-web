"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
    XMarkIcon,
    ClipboardDocumentIcon,
    CheckIcon,
    ExclamationTriangleIcon,
    KeyIcon
} from "@heroicons/react/24/outline";

interface CreateApiKeyModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateApiKeyModal({ onClose, onSuccess }: CreateApiKeyModalProps) {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        environment: 'prod' as 'prod' | 'test',
        expiresIn: 0,
        rateLimit: 1000,
        scopes: ['events:read']
    });
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [creating, setCreating] = useState(false);

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [step]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.length < 3) {
            toast.error('Name must be at least 3 characters');
            return;
        }
        setCreating(true);
        try {
            const response = await fetch('/api/admin/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
                setGeneratedKey(data.key.apiKey);
                setStep('success');
                toast.success('API key created!');
            } else {
                toast.error(data.error || 'Failed to create API key');
            }
        } catch (error) {
            console.error('Error creating API key:', error);
            toast.error('An error occurred');
        } finally {
            setCreating(false);
        }
    };

    const handleCopy = async () => {
        if (generatedKey) {
            await navigator.clipboard.writeText(generatedKey);
            setCopied(true);
            toast.success('Copied!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        if (step === 'success') {
            onSuccess();
        } else {
            onClose();
        }
    };

    const toggleScope = (scope: string) => {
        if (formData.scopes.includes(scope)) {
            setFormData({ ...formData, scopes: formData.scopes.filter(s => s !== scope) });
        } else {
            setFormData({ ...formData, scopes: [...formData.scopes, scope] });
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
            <div
                className="bg-[#0c1929] rounded-2xl shadow-2xl w-full max-w-md border border-white/10 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {step === 'form' ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <KeyIcon className="w-5 h-5 text-blue-400" />
                                </div>
                                <h2 className="text-lg font-semibold text-white">New API Key</h2>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-medium text-white/60 mb-1.5">
                                    Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                    placeholder="e.g., n8n Production"
                                    required
                                    autoFocus
                                />
                            </div>

                            {/* Two column layout */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-white/60 mb-1.5">
                                        Environment
                                    </label>
                                    <select
                                        value={formData.environment}
                                        onChange={(e) => setFormData({ ...formData, environment: e.target.value as 'prod' | 'test' })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    >
                                        <option value="prod" className="bg-slate-900">Production</option>
                                        <option value="test" className="bg-slate-900">Test</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/60 mb-1.5">
                                        Expires
                                    </label>
                                    <select
                                        value={formData.expiresIn}
                                        onChange={(e) => setFormData({ ...formData, expiresIn: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    >
                                        <option value="0" className="bg-slate-900">Never</option>
                                        <option value="30" className="bg-slate-900">30 days</option>
                                        <option value="90" className="bg-slate-900">90 days</option>
                                        <option value="365" className="bg-slate-900">1 year</option>
                                    </select>
                                </div>
                            </div>

                            {/* Permissions - compact */}
                            <div>
                                <label className="block text-xs font-medium text-white/60 mb-2">
                                    Permissions
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleScope('events:read')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            formData.scopes.includes('events:read')
                                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                                : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        events:read
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toggleScope('registrations:read')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            formData.scopes.includes('registrations:read')
                                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                                : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        registrations:read
                                    </button>
                                </div>
                            </div>

                            {/* Rate Limit - inline */}
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-medium text-white/60 whitespace-nowrap">
                                    Rate limit
                                </label>
                                <input
                                    type="number"
                                    value={formData.rateLimit}
                                    onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) || 1000 })}
                                    min="1"
                                    max="10000"
                                    className="w-24 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <span className="text-xs text-white/40">req/hour</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !formData.name}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {creating ? 'Creating...' : 'Create Key'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        {/* Success Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center">
                                    <CheckIcon className="w-5 h-5 text-green-400" />
                                </div>
                                <h2 className="text-lg font-semibold text-white">Key Created</h2>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Warning */}
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2.5">
                                <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-200/90">
                                    Copy this key now. You won&apos;t be able to see it again.
                                </p>
                            </div>

                            {/* API Key */}
                            <div>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 px-3 py-2.5 bg-black/30 text-green-400 rounded-lg font-mono text-xs break-all border border-white/10">
                                        {generatedKey}
                                    </code>
                                    <button
                                        onClick={handleCopy}
                                        className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                                            copied
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        {copied ? (
                                            <CheckIcon className="w-4 h-4" />
                                        ) : (
                                            <ClipboardDocumentIcon className="w-4 h-4" />
                                        )}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            {/* Done button */}
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
