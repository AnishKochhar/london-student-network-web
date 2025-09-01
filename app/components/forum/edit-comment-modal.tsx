'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';

interface EditCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedData: {
    content: string;
  }) => void;
  initialData: {
    id: number;
    content: string;
  };
  isSubmitting?: boolean;
}

export default function EditCommentModal({ 
  isOpen, 
  onClose, 
  onUpdate, 
  initialData,
  isSubmitting = false 
}: EditCommentModalProps) {
  const [content, setContent] = useState(initialData.content);
  const [mounted, setMounted] = useState(false);
  const isUpdating = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isUpdating.current) {
      setContent(initialData.content);
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (content.trim()) {
      isUpdating.current = true;
      
      onUpdate({
        content: content.trim()
      });
      
      // Reset the flag after a brief delay (after modal closes)
      setTimeout(() => {
        isUpdating.current = false;
      }, 500);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] border border-white/20 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <PencilIcon className="w-6 h-6 text-blue-400" />
            Edit Comment
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <XMarkIcon className="w-6 h-6 text-white/80" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Content Textarea */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Your comment..."
              rows={4}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed border border-blue-500 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(modalContent, document.body);
}