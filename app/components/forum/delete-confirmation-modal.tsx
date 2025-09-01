'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemType: 'thread' | 'comment' | 'reply';
  isDeleting?: boolean;
}

export default function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemType,
  isDeleting = false 
}: DeleteConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const itemTypeLabel = 
    itemType === 'thread' ? 'thread' :
    itemType === 'comment' ? 'comment' : 'reply';

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] border border-white/20 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
            Delete {itemTypeLabel}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={isDeleting}
          >
            <XMarkIcon className="w-6 h-6 text-white/80" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-white/90">
            Are you sure you want to delete this {itemTypeLabel}? This action cannot be undone.
          </p>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed border border-red-500 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}