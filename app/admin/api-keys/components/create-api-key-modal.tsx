"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
    XMarkIcon,
    ClipboardDocumentIcon,
    CheckIcon,
    ExclamationTriangleIcon
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
        expiresIn: 0, // 0 = never
        rateLimit: 1000,
        scopes: ['events:read']
    });
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [creating, setCreating] = useState(false);

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
                toast.success('API key created successfully!');
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
            toast.success('Copied to clipboard!');
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

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-gradient-to-br from-[#0f1a2e] to-[#0a1628] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white">
                        {step === 'form' ? 'Create New API Key' : 'API Key Created'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-white/50 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {step === 'form' ? (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/40"
                                placeholder="e.g., n8n Production, Zapier Integration"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/40"
                                placeholder="Optional: Describe what this key is used for"
                                rows={3}
                            />
                        </div>

                        {/* Environment */}
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                Environment
                            </label>
                            <select
                                value={formData.environment}
                                onChange={(e) => setFormData({ ...formData, environment: e.target.value as 'prod' | 'test' })}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                            >
                                <option value="prod" className="bg-slate-800">Production</option>
                                <option value="test" className="bg-slate-800">Test</option>
                            </select>
                        </div>

                        {/* Scopes */}
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                Permissions
                            </label>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.scopes.includes('events:read')}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFormData({ ...formData, scopes: [...formData.scopes, 'events:read'] });
                                            } else {
                                                setFormData({ ...formData, scopes: formData.scopes.filter(s => s !== 'events:read') });
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/30 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-white/80">Read Events (events:read)</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.scopes.includes('registrations:read')}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFormData({ ...formData, scopes: [...formData.scopes, 'registrations:read'] });
                                            } else {
                                                setFormData({ ...formData, scopes: formData.scopes.filter(s => s !== 'registrations:read') });
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/30 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-white/80">Read Registrations (registrations:read)</span>
                                </label>
                            </div>
                        </div>

                        {/* Rate Limit */}
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                Rate Limit (requests per hour)
                            </label>
                            <input
                                type="number"
                                value={formData.rateLimit}
                                onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
                                min="1"
                                max="10000"
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                            />
                            <p className="mt-1.5 text-sm text-white/50">Maximum: 10,000 requests/hour</p>
                        </div>

                        {/* Expiration */}
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                Expires In
                            </label>
                            <select
                                value={formData.expiresIn}
                                onChange={(e) => setFormData({ ...formData, expiresIn: parseInt(e.target.value) })}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                            >
                                <option value="0" className="bg-slate-800">Never</option>
                                <option value="30" className="bg-slate-800">30 days</option>
                                <option value="90" className="bg-slate-800">90 days</option>
                                <option value="180" className="bg-slate-800">180 days</option>
                                <option value="365" className="bg-slate-800">1 year</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={creating}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {creating ? 'Creating...' : 'Create API Key'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Warning */}
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
                            <ExclamationTriangleIcon className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-300">Save this key now!</p>
                                <p className="text-sm text-amber-200/80 mt-1">
                                    You won&apos;t be able to see it again. Make sure to copy it to a safe place.
                                </p>
                            </div>
                        </div>

                        {/* API Key Display */}
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                Your API Key
                            </label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 px-4 py-3 bg-black/40 text-green-400 rounded-lg font-mono text-sm break-all border border-white/10">
                                    {generatedKey}
                                </code>
                                <button
                                    onClick={handleCopy}
                                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                                >
                                    {copied ? (
                                        <>
                                            <CheckIcon className="w-5 h-5" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <ClipboardDocumentIcon className="w-5 h-5" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Usage Instructions */}
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-white mb-2">Usage Example</h3>
                            <code className="block text-xs font-mono bg-black/30 p-3 rounded border border-white/10 text-blue-300 overflow-x-auto">
                                curl -H &quot;Authorization: Bearer {generatedKey?.substring(0, 20)}...&quot; \<br />
                                &nbsp;&nbsp;https://londonstudentnetwork.com/api/events
                            </code>
                        </div>

                        {/* Close Button */}
                        <div className="flex items-center justify-end pt-6 border-t border-white/10">
                            <button
                                onClick={handleClose}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
