"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ExclamationCircleIcon, CheckIcon, XMarkIcon, AtSymbolIcon } from "@heroicons/react/24/outline";
import { Button } from "@/app/components/button";
import AccountLogo from "../components/account/account-logo";
import StripeConnectStatusCompact from "../components/account/stripe-connect-status-compact";
import OrganiserInfoCard from "../components/account/organiser-info-card";
import { updateName, resendPrimaryVerificationEmail, resendUniversityVerificationEmail } from './actions';
import { getUniversityNameFromCode } from "@/app/lib/university-email-mapping";
import toast from "react-hot-toast";

interface Props {
  user: any;
  verificationStatus: any;
  username: string | null;
  stripeStatus: any;
  accountFields: any;
  predefinedTags: any[];
}

export default function PersonalInfoSection({
  user,
  verificationStatus,
  username,
  stripeStatus,
  accountFields,
  predefinedTags,
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [resendingEmail, setResendingEmail] = useState<'primary' | 'university' | null>(null);

  const handleNameDoubleClick = () => {
    if (session?.user?.role === "organiser") {
      setIsEditingName(true);
      setEditedName(session.user.name || "");
    }
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  const handleNameSave = async () => {
    if (!editedName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Updating name...");

    try {
      const result = await updateName(editedName);

      if (result.success) {
        setIsEditingName(false);
        toast.success("Name updated successfully! You'll be signed out to refresh your session.", {
          id: toastId,
          duration: 4000
        });

        // Sign out and redirect back to account page
        // This ensures they get a fresh JWT token with the updated name
        setTimeout(async () => {
          window.location.href = "/logout?redirect=/account&message=name-updated";
        }, 1500);
      } else {
        toast.error(result.error || "Failed to update name", { id: toastId });
      }
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("Failed to update name", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendPrimaryEmail = async () => {
    if (resendingEmail) return;

    setResendingEmail('primary');
    const toastId = toast.loading("Sending verification email...");

    try {
      const result = await resendPrimaryVerificationEmail();

      if (result.success) {
        toast.success("Verification email sent! Check your inbox and junk folder.", { id: toastId, duration: 6000 });
      } else {
        toast.error(result.error || "Failed to send verification email. Please try again.", { id: toastId });
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.", { id: toastId });
    } finally {
      setResendingEmail(null);
    }
  };

  const handleResendUniversityEmail = async () => {
    if (resendingEmail || !verificationStatus?.university_email) return;

    setResendingEmail('university');
    const toastId = toast.loading("Sending university verification email...");

    try {
      const result = await resendUniversityVerificationEmail(verificationStatus.university_email);

      if (result.success) {
        toast.success("University verification email sent! Check your inbox and junk folder.", { id: toastId, duration: 6000 });
      } else {
        toast.error(result.error || "Failed to send verification email. Please try again.", { id: toastId });
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.", { id: toastId });
    } finally {
      setResendingEmail(null);
    }
  };

  return (
    <section id="personal" className="scroll-mt-8">
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-8">Personal information</h2>
      <p className="text-gray-300 mb-4 md:mb-8">View your personal information and contact details</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className={`bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 ${user?.role === "organiser" ? "opacity-100" : "opacity-75"} ${isEditingName ? "relative" : ""}`}>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Name {user?.role === "organiser" && <span className="text-xs text-blue-300">(double-click to edit)</span>}
          </label>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="flex-1 bg-white/10 rounded-lg px-4 py-3 text-white font-medium border border-white/20 focus:border-blue-400 focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameSave();
                  if (e.key === "Escape") handleNameCancel();
                }}
              />
            </div>
          ) : (
            <div
              className={`bg-white/5 rounded-lg px-4 py-3 text-gray-300 font-medium ${
                user?.role === "organiser"
                  ? "cursor-pointer hover:bg-white/10 transition-colors"
                  : "cursor-not-allowed"
              }`}
              onDoubleClick={handleNameDoubleClick}
              aria-disabled={user?.role !== "organiser"}
            >
              {user?.name || "Not provided"}
            </div>
          )}

          {/* Save buttons */}
          {isEditingName && (
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={handleNameCancel}
                disabled={isSaving}
                className="flex items-center justify-center px-3 py-1.5 text-sm bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Cancel
              </button>
              <button
                onClick={handleNameSave}
                disabled={isSaving || !editedName.trim()}
                className="flex items-center justify-center px-3 py-1.5 text-sm bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/30"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mr-1"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Save
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 opacity-75">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Email
          </label>
          <div className="bg-white/5 rounded-lg px-4 py-3 text-gray-300 font-medium cursor-not-allowed" aria-disabled="true">
            {user?.email || "Not provided"}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 opacity-75">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Role
          </label>
          <div className="bg-white/5 rounded-lg px-4 py-3 text-gray-300 font-medium capitalize cursor-not-allowed" aria-disabled="true">
            {user?.role || "User"}
          </div>
        </div>

        <div className={`bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 ${username ? "opacity-75" : "opacity-100"}`}>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Forum Username {!username && <span className="text-xs text-blue-300">(double-click to set)</span>}
          </label>
          <div
            className={`bg-white/5 rounded-lg px-4 py-3 font-medium flex items-center gap-2 ${
              username
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-400 cursor-pointer hover:bg-white/10 transition-colors"
            }`}
            aria-disabled={!!username}
          >
            <AtSymbolIcon className="h-4 w-4 text-gray-400" />
            {username || "Not set - double click to create"}
          </div>
          {username && (
            <p className="text-xs text-gray-500 mt-2">Username cannot be changed once set</p>
          )}
        </div>

        {/* Email Verification Status */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Email Verification Status
          </label>

          {verificationStatus ? (
            <>
              {/* Primary Email Verification */}
              <div className="mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">Primary Email</span>
                    {verificationStatus.emailverified ? (
                      <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                        <CheckIcon className="h-3 w-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
                        <ExclamationCircleIcon className="h-3 w-3" />
                        Not Verified
                      </span>
                    )}
                  </div>
                  {!verificationStatus.emailverified && (
                    <button
                      onClick={handleResendPrimaryEmail}
                      disabled={resendingEmail === 'primary'}
                      className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendingEmail === 'primary' ? 'Sending...' : 'Resend verification'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              {/* University Email Verification */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">University Email</span>
                    {verificationStatus.verified_university ? (
                      <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                        <CheckIcon className="h-3 w-3" />
                        Verified
                      </span>
                    ) : verificationStatus.university_email ? (
                      <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
                        <ExclamationCircleIcon className="h-3 w-3" />
                        Not Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full">
                        <XMarkIcon className="h-3 w-3" />
                        Not Set
                      </span>
                    )}
                  </div>
                  {verificationStatus.university_email && !verificationStatus.verified_university && (
                    <button
                      onClick={handleResendUniversityEmail}
                      disabled={resendingEmail === 'university'}
                      className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendingEmail === 'university' ? 'Sending...' : 'Resend verification'}
                    </button>
                  )}
                </div>
                {verificationStatus.university_email ? (
                  <>
                    <p className="text-xs text-gray-500 mb-2">{verificationStatus.university_email}</p>
                    {verificationStatus.verified_university && (
                      <p className="text-xs text-green-400/80">
                        ✓ Verified with {getUniversityNameFromCode(verificationStatus.verified_university) || verificationStatus.verified_university}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-500">
                    Verify your university email to access university-restricted events
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-500">Failed to load verification status</p>
          )}
        </div>

        {/* Stripe Payment Status - For Organisers/Companies */}
        {(user.role === 'organiser' || user.role === 'company') && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Payment Processing
            </label>
            <StripeConnectStatusCompact initialStatus={stripeStatus} />
          </div>
        )}
      </div>

      {user.role === "organiser" && (
        <OrganiserInfoCard
          userId={user.id}
          initialAccountFields={accountFields}
          initialStripeStatus={stripeStatus}
          initialPredefinedTags={predefinedTags}
        />
      )}
    </section>
  );
}
