"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import CreateApiKeyModal from "./components/create-api-key-modal";
import {
    KeyIcon,
    PlusIcon,
    TrashIcon,
    EyeIcon,
    ClockIcon,
    ShieldCheckIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";

interface ApiKey {
    id: string;
    name: string;
    description: string | null;
    keyPrefix: string;
    createdBy: {
        name: string;
        email: string;
    };
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    isActive: boolean;
    revokedAt: string | null;
    scopes: string[];
    rateLimit: number;
    usage: {
        totalRequests: number;
        requestsLast7Days: number;
    };
}

export default function ApiKeysPage() {
    const router = useRouter();
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        try {
            const response = await fetch("/api/admin/api-keys");
            const data = await response.json();

            if (data.success) {
                setKeys(data.keys);
            } else {
                toast.error("Failed to fetch API keys");
            }
        } catch (error) {
            console.error("Error fetching keys:", error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to revoke the API key "${name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/api-keys/${id}?reason=Revoked by admin`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (data.success) {
                toast.success("API key revoked successfully");
                fetchKeys();
            } else {
                toast.error(data.error || "Failed to revoke API key");
            }
        } catch (error) {
            console.error("Error revoking key:", error);
            toast.error("An error occurred");
        }
    };

    const getStatusBadge = (key: ApiKey) => {
        if (!key.isActive) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                    <XCircleIcon className="w-3 h-3" />
                    Revoked
                </span>
            );
        }

        if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    <ClockIcon className="w-3 h-3" />
                    Expired
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                <ShieldCheckIcon className="w-3 h-3" />
                Active
            </span>
        );
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Never";
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diff / (1000 * 60));
                return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
            }
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }

        if (days === 1) return "Yesterday";
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <AdminPageHeader
                    title="API Keys"
                    description="Manage API keys for integrations like n8n, Zapier, and custom applications"
                    breadcrumbs={[
                        { label: "Dashboard", href: "/admin" },
                        { label: "API Keys" },
                    ]}
                />
                <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <AdminPageHeader
                title="API Keys"
                description="Manage API keys for integrations like n8n, Zapier, and custom applications"
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin" },
                    { label: "API Keys" },
                ]}
                actions={
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Create New Key
                    </button>
                }
            />

            <div className="p-6 sm:p-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/70">Total Keys</p>
                                <p className="mt-2 text-3xl font-bold text-white">{keys.length}</p>
                            </div>
                            <KeyIcon className="w-12 h-12 text-blue-400 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/70">Active Keys</p>
                                <p className="mt-2 text-3xl font-bold text-green-400">
                                    {keys.filter(k => k.isActive && (!k.expiresAt || new Date(k.expiresAt) > new Date())).length}
                                </p>
                            </div>
                            <ShieldCheckIcon className="w-12 h-12 text-green-400 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white/70">Total Requests (7d)</p>
                                <p className="mt-2 text-3xl font-bold text-white">
                                    {keys.reduce((sum, k) => sum + k.usage.requestsLast7Days, 0).toLocaleString()}
                                </p>
                            </div>
                            <ClockIcon className="w-12 h-12 text-purple-400 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Keys Table */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 overflow-hidden">
                    {keys.length === 0 ? (
                        <div className="p-12 text-center">
                            <KeyIcon className="w-16 h-16 text-white/30 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">No API keys yet</h3>
                            <p className="text-white/60 mb-6">Create your first API key to get started with integrations</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <PlusIcon className="w-5 h-5" />
                                Create API Key
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                                            Key
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                                            Last Used
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                                            Requests (7d)
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {keys.map((key) => (
                                        <tr key={key.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <div className="text-sm font-medium text-white">{key.name}</div>
                                                    {key.description && (
                                                        <div className="text-sm text-white/50 truncate max-w-xs">
                                                            {key.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <code className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-blue-300 border border-white/10">
                                                    {key.keyPrefix}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                                                {formatDate(key.lastUsedAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                                {key.usage.requestsLast7Days.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(key)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => router.push(`/admin/api-keys/${key.id}`)}
                                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                                        title="View details"
                                                    >
                                                        <EyeIcon className="w-5 h-5" />
                                                    </button>
                                                    {key.isActive && (
                                                        <button
                                                            onClick={() => handleRevoke(key.id, key.name)}
                                                            className="text-red-400 hover:text-red-300 transition-colors"
                                                            title="Revoke key"
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal - We'll import this component */}
            {showCreateModal && (
                <CreateApiKeyModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        fetchKeys();
                        setShowCreateModal(false);
                    }}
                />
            )}
        </div>
    );
}
