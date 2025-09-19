'use client';

import { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import BaseModal from './base-modal';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'thread' | 'comment' | 'reply';
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
  itemId?: number;
}

export default function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  itemType,
  onConfirm,
  isDeleting: externalDeleting = false
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const itemTypeLabel = 
    itemType === 'thread' ? 'thread' :
    itemType === 'comment' ? 'comment' : 'reply';

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  const deleting = isDeleting || externalDeleting;

  const footerContent = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-6 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors"
        disabled={deleting}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleConfirmDelete}
        disabled={deleting}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed border border-red-500 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
      >
        {deleting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Deleting...
          </>
        ) : (
          'Delete'
        )}
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${itemTypeLabel}`}
      icon={<ExclamationTriangleIcon className="w-6 h-6 text-red-400" />}
      maxWidth="max-w-md"
      isSubmitting={deleting}
      footer={footerContent}
    >
      <p className="text-white/90">
        Are you sure you want to delete this {itemTypeLabel}? This action cannot be undone.
      </p>
    </BaseModal>
  );
}