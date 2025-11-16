"use client";

import { useState } from 'react';
import { Button } from '@/app/components/button';
import { NewsletterCampaign } from '@/app/lib/newsletter/types';

interface CampaignSendModalProps {
    campaign: NewsletterCampaign;
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'confirm' | 'test' | 'sending' | 'success';

export default function CampaignSendModal({ campaign, onClose, onSuccess }: CampaignSendModalProps) {
    const [step, setStep] = useState<Step>('confirm');
    const [testEmail, setTestEmail] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [sending, setSending] = useState(false);

    async function handleSendTest() {
        if (!testEmail) return;

        setSendingTest(true);
        try {
            const response = await fetch(`/api/admin/newsletter/campaigns/${campaign.id}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test_email: testEmail }),
            });

            const data = await response.json();

            if (data.success) {
                alert(`Test email sent to ${testEmail}`);
            } else {
                alert('Failed to send test email: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error sending test:', error);
            alert('Failed to send test email');
        } finally {
            setSendingTest(false);
        }
    }

    async function handleSend() {
        setStep('sending');
        setSending(true);

        try {
            const response = await fetch(`/api/admin/newsletter/campaigns/${campaign.id}/send`, {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                setStep('success');
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            } else {
                alert('Failed to send campaign: ' + (data.error || 'Unknown error'));
                setStep('confirm');
            }
        } catch (error) {
            console.error('Error sending campaign:', error);
            alert('Failed to send campaign');
            setStep('confirm');
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold">
                            {step === 'success' ? 'Campaign Sent!' : 'Send Campaign'}
                        </h2>
                        {step !== 'sending' && step !== 'success' && (
                            <button
                                onClick={onClose}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <p className="text-green-100">{campaign.name}</p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'confirm' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-blue-900 mb-2">Campaign Details</h3>
                                <dl className="space-y-2 text-sm">
                                    <div>
                                        <dt className="text-gray-600">Subject:</dt>
                                        <dd className="text-gray-900 font-medium">{campaign.subject}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-600">From:</dt>
                                        <dd className="text-gray-900">{campaign.from_name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-600">Recipients:</dt>
                                        <dd className="text-gray-900 font-medium">
                                            Approximately {campaign.total_recipients} people
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex gap-2">
                                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-yellow-900">Before you send</p>
                                        <p className="text-sm text-yellow-800 mt-1">
                                            We recommend sending a test email to yourself first to verify everything looks correct.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('test')}
                                    className="w-full border-gray-300"
                                >
                                    Send Test Email First
                                </Button>
                                <Button
                                    variant="filled"
                                    onClick={handleSend}
                                    disabled={sending}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Send to All Recipients Now
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'test' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Send Test Email</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Enter your email address to receive a test version of this campaign
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Test Email Address
                                </label>
                                <input
                                    type="email"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    placeholder="your.email@example.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-gray-900 placeholder-gray-400"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('confirm')}
                                    className="flex-1 border-gray-300"
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="filled"
                                    onClick={handleSendTest}
                                    disabled={!testEmail || sendingTest}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                                >
                                    {sendingTest ? 'Sending...' : 'Send Test'}
                                </Button>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-600 mb-3">
                                    Once you&apos;ve verified the test email, you can proceed to send to all recipients:
                                </p>
                                <Button
                                    variant="filled"
                                    onClick={handleSend}
                                    disabled={sending}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Send to All Recipients
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'sending' && (
                        <div className="text-center py-12">
                            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sending Campaign...</h3>
                            <p className="text-gray-600">
                                Your campaign is being queued for delivery. This may take a few moments.
                            </p>
                            <p className="text-sm text-gray-500 mt-4">
                                Emails will be sent in batches to ensure deliverability
                            </p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-12">
                            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Campaign Sent Successfully!</h3>
                            <p className="text-gray-600 mb-6">
                                Your campaign has been queued and will be delivered to {campaign.total_recipients} recipients.
                            </p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                                <p className="text-sm text-blue-900">
                                    <strong>What happens next?</strong>
                                </p>
                                <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                                    <li>Emails will be sent in batches over the next few minutes</li>
                                    <li>You can view delivery statistics in the Campaigns tab</li>
                                    <li>Recipients can unsubscribe using the link in the email footer</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer - only show on confirm and test steps */}
                {(step === 'confirm' || step === 'test') && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                        <p className="text-xs text-gray-500 text-center">
                            Once sent, this campaign cannot be stopped. Make sure everything is correct before proceeding.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
