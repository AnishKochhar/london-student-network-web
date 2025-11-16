"use client";

import { useState } from 'react';
import { Button } from '@/app/components/button';
import { CreateGroupRequest } from '@/app/lib/newsletter/types';

interface GroupModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

type FilterType = 'all_users' | 'newsletter_only' | 'custom';

export default function GroupModal({ onClose, onSuccess }: GroupModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('newsletter_only');
    const [customUniversity, setCustomUniversity] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const groupData: CreateGroupRequest = {
                name,
                description,
                filter_type: filterType,
                filter_criteria: filterType === 'custom' && customUniversity
                    ? { university: customUniversity }
                    : undefined,
            };

            const response = await fetch('/api/admin/newsletter/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(groupData),
            });

            const data = await response.json();

            if (data.success) {
                onSuccess();
            } else {
                alert('Error creating group: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Error creating group');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Create New Group</h2>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-purple-100 mt-2">
                        Organise your subscribers into targeted groups
                    </p>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Group Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Imperial College Students"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe who this group is for..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Group Type *
                        </label>
                        <div className="space-y-3">
                            <FilterOption
                                value="newsletter_only"
                                label="Newsletter Subscribers Only"
                                description="Users who have opted into the newsletter"
                                selected={filterType === 'newsletter_only'}
                                onSelect={() => setFilterType('newsletter_only')}
                            />
                            <FilterOption
                                value="all_users"
                                label="All Registered Users"
                                description="Everyone registered on the platform (requires approval for one-time send)"
                                selected={filterType === 'all_users'}
                                onSelect={() => setFilterType('all_users')}
                            />
                            <FilterOption
                                value="custom"
                                label="Custom Filter by University"
                                description="Create a custom filter for verified students at a specific university"
                                selected={filterType === 'custom'}
                                onSelect={() => setFilterType('custom')}
                            />
                        </div>
                    </div>

                    {filterType === 'custom' && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                University Name
                            </label>
                            <input
                                type="text"
                                value={customUniversity}
                                onChange={(e) => setCustomUniversity(e.target.value)}
                                placeholder="e.g., Imperial College London"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 placeholder-gray-400"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Only users with verified email addresses from this university will be included
                            </p>
                        </div>
                    )}

                    {filterType === 'all_users' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex gap-2">
                                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-yellow-900">GDPR Notice</p>
                                    <p className="text-sm text-yellow-800 mt-1">
                                        This group ignores newsletter preferences and will send to all users.
                                        Use only for important platform announcements. One-time send requires explicit approval.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 flex items-center justify-between bg-gray-50">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-gray-300"
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="filled"
                        onClick={() => handleSubmit(new Event('submit') as unknown as React.FormEvent)}
                        disabled={loading || !name}
                        className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Creating...
                            </span>
                        ) : (
                            'Create Group'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function FilterOption({
    label,
    description,
    selected,
    onSelect,
}: {
    value: string;
    label: string;
    description: string;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selected
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
            }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{label}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                </div>
                {selected && (
                    <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                )}
            </div>
        </button>
    );
}
