'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  isSubmitting?: boolean;
}

export default function BaseModal({ 
  isOpen, 
  onClose, 
  title, 
  icon, 
  children, 
  footer,
  maxWidth = 'max-w-2xl',
  isSubmitting = false
}: BaseModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full ${maxWidth} bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] border border-white/20 rounded-xl shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={isSubmitting}
            aria-label="Close"
          >
            <XMarkIcon className="w-6 h-6 text-white/80" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-4 p-6 pt-4 border-t border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}