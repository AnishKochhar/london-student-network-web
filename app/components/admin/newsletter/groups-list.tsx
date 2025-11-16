"use client";

import { useEffect, useState } from 'react';
import { NewsletterGroup } from '@/app/lib/newsletter/types';
import { Button } from '@/app/components/button';
import { CardSkeleton } from './skeleton-loader';

export default function GroupsList() {
    const [groups, setGroups] = useState<NewsletterGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<NewsletterGroup | null>(null);
    const [viewingMembers, setViewingMembers] = useState(false);

    useEffect(() => {
        fetchGroups();
    }, []);

    async function fetchGroups() {
        try {
            const response = await fetch('/api/admin/newsletter/groups');
            const data = await response.json();

            if (data.success) {
                setGroups(data.data);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    }

    async function viewMembers(group: NewsletterGroup) {
        setSelectedGroup(group);
        setViewingMembers(true);
    }

    if (loading) {
        return <CardSkeleton />;
    }

    if (viewingMembers && selectedGroup) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedGroup.name}</h3>
                        <p className="text-sm text-gray-600">{selectedGroup.description}</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setViewingMembers(false)}
                        className="border-gray-300"
                    >
                        ← Back to Groups
                    </Button>
                </div>
                <div className="text-center py-8 text-gray-500">
                    Member list view coming soon...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                    <div
                        key={group.id}
                        className="border-2 border-gray-200 rounded-lg p-6 hover:border-[#064580] transition-colors"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="font-bold text-lg text-gray-900">{group.name}</h3>
                            {group.is_system_group && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                                    System
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {group.description || 'No description'}
                        </p>

                        <div className="flex items-center justify-between mb-4">
                            <div className="text-sm text-gray-500">
                                <span className="font-semibold text-2xl text-gray-900">
                                    {group.member_count || 0}
                                </span>
                                <br />
                                members
                            </div>
                            <div className="text-xs text-gray-400">
                                {group.filter_type.replace('_', ' ')}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => viewMembers(group)}
                                variant="outline"
                                className="flex-1 text-sm border-gray-300"
                            >
                                View Members
                            </Button>
                            {!group.is_system_group && (
                                <Button
                                    variant="outline"
                                    className="text-sm border-red-300 text-red-600 hover:bg-red-50"
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {groups.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No groups found.
                </div>
            )}
        </div>
    );
}
