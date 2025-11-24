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
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircleIcon className="w-3 h-3" />
                    Revoked
                </span>
            );
        }

        if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <ClockIcon className="w-3 h-3" />
                    Expired
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Create New Key
                    </button>
                }
            />

            <div className="p-6 sm:p-8">
                {/* Stats Cards */}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Total Keys</p>
                                <p className="mt-2 text-3xl font-bold text-slate-900">{keys.length}</p>
                            </div>
                            <KeyIcon className="w-12 h-12 text-blue-600 opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Active Keys</p>
                                <p className="mt-2 text-3xl font-bold text-green-600">
                                    {keys.filter(k => k.isActive && (!k.expiresAt || new Date(k.expiresAt) > new Date())).length}
                                </p>
                            </div>
                            <ShieldCheckIcon className="w-12 h-12 text-green-600 opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Total Requests (7d)</p>
                                <p className="mt-2 text-3xl font-bold text-slate-900">
                                    {keys.reduce((sum, k) => sum + k.usage.requestsLast7Days, 0).toLocaleString()}
                                </p>
                            </div>
                            <ClockIcon className="w-12 h-12 text-blue-600 opacity-20" />
                        </div>
                    </div>
                </div>

                {/* Keys Table */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    {keys.length === 0 ? (
                        <div className="p-12 text-center">
                            <KeyIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">No API keys yet</h3>
                            <p className="text-slate-600 mb-6">Create your first API key to get started with integrations</p>
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
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Key
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Last Used
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Requests (7d)
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {keys.map((key) => (
                                        <tr key={key.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <div className="text-sm font-medium text-slate-900">{key.name}</div>
                                                    {key.description && (
                                                        <div className="text-sm text-slate-500 truncate max-w-xs">
                                                            {key.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                                                    {key.keyPrefix}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {formatDate(key.lastUsedAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                {key.usage.requestsLast7Days.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(key)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => router.push(`/admin/api-keys/${key.id}`)}
                                                        className="text-blue-600 hover:text-blue-900 transition-colors"
                                                        title="View details"
                                                    >
                                                        <EyeIcon className="w-5 h-5" />
                                                    </button>
                                                    {key.isActive && (
                                                        <button
                                                            onClick={() => handleRevoke(key.id, key.name)}
                                                            className="text-red-600 hover:text-red-900 transition-colors"
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
