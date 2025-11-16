"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NewsletterGroup, EmailBuilderState, CreateCampaignRequest } from '@/app/lib/newsletter/types';

interface CampaignWizardProps {
    onClose: () => void;
    onSuccess: () => void;
}

type WizardStep = 'details' | 'groups' | 'content' | 'review';

export default function CampaignWizard({ onClose, onSuccess }: CampaignWizardProps) {
    const [currentStep, setCurrentStep] = useState<WizardStep>('details');
    const [groups, setGroups] = useState<NewsletterGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
    const [uniqueRecipientCount, setUniqueRecipientCount] = useState<number | null>(null);
    const [countingRecipients, setCountingRecipients] = useState(false);

    // Campaign data
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [fromName, setFromName] = useState('London Student Network');
    const [fromEmail, setFromEmail] = useState('hello@londonstudentnetwork.com');
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    const [emailContent, setEmailContent] = useState('');
    const [emailState] = useState<EmailBuilderState>({
        blocks: [
            {
                id: 'default-1',
                type: 'heading',
                order: 0,
                content: {
                    text: 'Your Campaign Title',
                    level: 1,
                },
            },
            {
                id: 'default-2',
                type: 'text',
                order: 1,
                content: {
                    text: 'Start writing your email content here...',
                },
            },
        ],
        globalStyles: {
            fontFamily: 'Arial, sans-serif',
        },
    });

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        async function fetchUniqueCount() {
            if (selectedGroupIds.length === 0) {
                setUniqueRecipientCount(0);
                return;
            }

            setCountingRecipients(true);
            try {
                const response = await fetch('/api/admin/newsletter/groups/count-unique', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ group_ids: selectedGroupIds }),
                });

                const data = await response.json();
                if (data.success) {
                    setUniqueRecipientCount(data.data.unique_count);
                }
            } catch (error) {
                console.error('Error fetching unique count:', error);
            } finally {
                setCountingRecipients(false);
            }
        }

        fetchUniqueCount();
    }, [selectedGroupIds]);

    async function fetchGroups() {
        try {
            const response = await fetch('/api/admin/newsletter/groups');
            const data = await response.json();
            if (data.success) {
                setGroups(data.data);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    }

    async function handleSubmit() {
        setLoading(true);
        try {
            const campaignData: CreateCampaignRequest = {
                name,
                subject,
                from_name: fromName,
                reply_to: fromEmail,
                content_html: emailContent,
                content_json: emailState,
                group_ids: selectedGroupIds,
            };

            const response = await fetch('/api/admin/newsletter/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaignData),
            });

            const data = await response.json();

            if (data.success) {
                onSuccess();
            } else {
                alert('Error creating campaign: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating campaign:', error);
            alert('Error creating campaign');
        } finally {
            setLoading(false);
        }
    }

    function toggleGroup(groupId: string) {
        setSelectedGroupIds(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        );
    }

    const steps: { id: WizardStep; label: string; title: string; subtitle: string }[] = [
        {
            id: 'details',
            label: 'Details',
            title: 'Campaign Details',
            subtitle: 'Set up the basic details for your email campaign'
        },
        {
            id: 'groups',
            label: 'Recipients',
            title: 'Select Recipients',
            subtitle: 'Choose which groups will receive this campaign'
        },
        {
            id: 'content',
            label: 'Content',
            title: 'Email Content',
            subtitle: 'Create your email content'
        },
        {
            id: 'review',
            label: 'Review',
            title: 'Review & Save',
            subtitle: 'Review the details before creating your campaign'
        },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);
    const currentStepData = steps[currentStepIndex];

    const canContinue = () => {
        switch (currentStep) {
            case 'details':
                return !!(name && subject);
            case 'groups':
                return selectedGroupIds.length > 0;
            case 'content':
                return !!emailContent;
            case 'review':
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setDirection('forward');
            setCurrentStep(steps[currentStepIndex + 1].id);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setDirection('backward');
            setCurrentStep(steps[currentStepIndex - 1].id);
        } else {
            onClose();
        }
    };

    const handleStepClick = (stepIndex: number) => {
        if (stepIndex < currentStepIndex) {
            setDirection('backward');
            setCurrentStep(steps[stepIndex].id);
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] z-50 flex items-center justify-center p-4 sm:p-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{
                        opacity: 0,
                        x: direction === 'forward' ? 100 : -100,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction === 'forward' ? -100 : 100 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="w-full max-w-4xl mx-auto"
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Header */}
                    <div className="text-center space-y-3 sm:space-y-4 mb-8">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white px-2">
                            {currentStepData.title}
                        </h1>
                        <p className="text-base sm:text-lg text-gray-300 px-2">
                            {currentStepData.subtitle}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 mb-8 max-h-[60vh] overflow-y-auto">
                        {currentStep === 'details' && (
                            <DetailsStep
                                name={name}
                                setName={setName}
                                subject={subject}
                                setSubject={setSubject}
                                fromName={fromName}
                                setFromName={setFromName}
                                fromEmail={fromEmail}
                                setFromEmail={setFromEmail}
                            />
                        )}

                        {currentStep === 'groups' && (
                            <GroupsStep
                                groups={groups}
                                selectedGroupIds={selectedGroupIds}
                                toggleGroup={toggleGroup}
                                uniqueRecipientCount={uniqueRecipientCount}
                                countingRecipients={countingRecipients}
                            />
                        )}

                        {currentStep === 'content' && (
                            <ContentStep
                                emailContent={emailContent}
                                setEmailContent={setEmailContent}
                            />
                        )}

                        {currentStep === 'review' && (
                            <ReviewStep
                                name={name}
                                subject={subject}
                                fromName={fromName}
                                fromEmail={fromEmail}
                                groups={groups.filter(g => selectedGroupIds.includes(g.id))}
                                emailContent={emailContent}
                            />
                        )}
                    </div>

                    {/* Footer with progress and buttons */}
                    <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 pt-6 sm:pt-8">
                        <button
                            onClick={handleBack}
                            className="px-4 sm:px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all text-sm sm:text-base"
                        >
                            {currentStep === 'details' ? 'Cancel' : 'Back'}
                        </button>

                        <div className="flex space-x-1.5 sm:space-x-2 justify-center">
                            {steps.map((_, i) => {
                                const stepNumber = i + 1;
                                const isCompleted = stepNumber < currentStepIndex + 1;
                                const isCurrent = stepNumber === currentStepIndex + 1;
                                const isClickable = isCompleted;

                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => isClickable ? handleStepClick(i) : undefined}
                                        disabled={!isClickable}
                                        className={`rounded-full transition-all duration-300 ease-in-out ${
                                            isCurrent
                                                ? 'w-6 sm:w-8 h-2 bg-white'
                                                : isCompleted
                                                  ? 'w-2 h-2 bg-blue-400 hover:bg-blue-300 cursor-pointer'
                                                  : 'w-2 h-2 bg-gray-600'
                                        } ${isClickable ? 'hover:scale-110' : ''}`}
                                    />
                                );
                            })}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <button
                                onClick={handleNext}
                                disabled={!canContinue() || loading}
                                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl transition-all text-sm sm:text-base font-medium"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                        Creating...
                                    </span>
                                ) : currentStep === 'review' ? (
                                    'Create Campaign'
                                ) : (
                                    'Continue'
                                )}
                            </button>
                            {currentStep !== 'review' && (
                                <span className="text-xs sm:text-sm text-gray-300 hidden sm:block">
                                    Press Enter ⏎
                                </span>
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function DetailsStep({
    name,
    setName,
    subject,
    setSubject,
    fromName,
    setFromName,
    fromEmail,
    setFromEmail,
}: {
    name: string;
    setName: (v: string) => void;
    subject: string;
    setSubject: (v: string) => void;
    fromName: string;
    setFromName: (v: string) => void;
    fromEmail: string;
    setFromEmail: (v: string) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name *
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Weekly Newsletter - January 2025"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#064580] focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1.5">Internal name for your reference</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Subject *
                </label>
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Your Weekly Update from LSN"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#064580] focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1.5">What recipients will see in their inbox</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Name
                    </label>
                    <input
                        type="text"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        placeholder="London Student Network"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#064580] focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Email
                    </label>
                    <input
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        placeholder="hello@londonstudentnetwork.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#064580] focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                    />
                </div>
            </div>
        </div>
    );
}

function GroupsStep({
    groups,
    selectedGroupIds,
    toggleGroup,
    uniqueRecipientCount,
    countingRecipients,
}: {
    groups: NewsletterGroup[];
    selectedGroupIds: string[];
    toggleGroup: (id: string) => void;
    uniqueRecipientCount: number | null;
    countingRecipients: boolean;
}) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => {
                    const isSelected = selectedGroupIds.includes(group.id);

                    return (
                        <button
                            key={group.id}
                            onClick={() => toggleGroup(group.id)}
                            className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                                isSelected
                                    ? 'border-[#064580] bg-[#064580]/5 shadow-md scale-[1.02]'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">{group.name}</h4>
                                {group.is_system_group && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                        System
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {group.description || 'No description'}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">
                                    {group.member_count || 0} members
                                </span>
                                {isSelected && (
                                    <svg className="w-5 h-5 text-[#064580]" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {selectedGroupIds.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-900">
                        <span className="font-semibold">
                            {selectedGroupIds.length} group{selectedGroupIds.length !== 1 ? 's' : ''} selected
                        </span>
                        {' — '}
                        {countingRecipients ? (
                            <span className="inline-flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                Calculating unique recipients...
                            </span>
                        ) : (
                            <>
                                <span className="font-semibold text-[#064580]">
                                    {uniqueRecipientCount !== null ? uniqueRecipientCount.toLocaleString() : '...'}
                                </span>
                                {' '}unique recipients
                            </>
                        )}
                    </p>
                </div>
            )}

            {groups.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-2">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No groups available</p>
                    <p className="text-sm text-gray-400 mt-1">Please create a group first</p>
                </div>
            )}
        </div>
    );
}

function ContentStep({
    emailContent,
    setEmailContent,
}: {
    emailContent: string;
    setEmailContent: (v: string) => void;
}) {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                    <span className="font-semibold">💡 Tip:</span> You can use HTML in your content for custom formatting.
                    An unsubscribe link will be automatically added to the footer.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Body
                </label>
                <textarea
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    rows={12}
                    placeholder="Write your email content here...

You can use basic HTML:
<h1>Heading</h1>
<p>Paragraph text</p>
<a href='https://example.com'>Link</a>
<strong>Bold text</strong>
<em>Italic text</em>"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#064580] focus:border-transparent text-gray-900 placeholder-gray-400 font-mono text-sm transition-all"
                />
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">Available Template Variables:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                    <li><code className="bg-yellow-100 px-2 py-0.5 rounded">{'{{user_name}}'}</code> - Recipient&apos;s name</li>
                    <li><code className="bg-yellow-100 px-2 py-0.5 rounded">{'{{user_email}}'}</code> - Recipient&apos;s email</li>
                    <li><code className="bg-yellow-100 px-2 py-0.5 rounded">{'{{unsubscribe_url}}'}</code> - Unsubscribe link (auto-added to footer)</li>
                </ul>
            </div>
        </div>
    );
}

function ReviewStep({
    name,
    subject,
    fromName,
    fromEmail,
    groups,
    emailContent,
}: {
    name: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    groups: NewsletterGroup[];
    emailContent: string;
}) {
    const totalRecipients = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#064580]/5 to-[#041A2E]/5 border-2 border-[#064580]/20 rounded-xl p-6 space-y-5">
                <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign Name</label>
                    <p className="text-gray-900 font-medium mt-1.5">{name}</p>
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Subject</label>
                    <p className="text-gray-900 font-medium mt-1.5">{subject}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">From Name</label>
                        <p className="text-gray-900 mt-1.5">{fromName}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">From Email</label>
                        <p className="text-gray-900 mt-1.5">{fromEmail}</p>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient Groups</label>
                    <div className="mt-2 space-y-2">
                        {groups.map(group => (
                            <div key={group.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 shadow-sm">
                                <span className="text-gray-900 font-medium">{group.name}</span>
                                <span className="text-sm text-gray-500">{group.member_count || 0} members</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                        Approximately <span className="font-semibold text-[#064580]">{totalRecipients}</span> total recipients
                    </p>
                </div>
            </div>

            <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Email Preview</label>
                <div className="border-2 border-gray-300 rounded-xl p-6 bg-white max-h-64 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: emailContent || '<p class="text-gray-400 italic">No content yet</p>' }} />
                </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-900">
                    <span className="font-semibold">✅ Ready to create!</span> Your campaign will be saved as a draft.
                    You can send test emails and make changes before sending to all recipients.
                </p>
            </div>
        </div>
    );
}
