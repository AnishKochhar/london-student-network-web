'use client';

import { useState } from 'react';
import { XMarkIcon, PlusIcon, TagIcon } from '@heroicons/react/24/outline';

interface NewThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (threadData: {
    title: string;
    content: string;
    tags: string[];
  }) => void;
}

export default function NewThreadModal({ isOpen, onClose, onSubmit }: NewThreadModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (title.trim() && content.trim()) {
      onSubmit({
        title: title.trim(),
        content: content.trim(),
        tags
      });
      // Reset form
      setTitle('');
      setContent('');
      setTags([]);
      setTagInput('');
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] border border-white/20 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <PlusIcon className="w-6 h-6 text-blue-400" />
            Start New Thread
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-white/80" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Thread Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question or topic?"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              required
            />
          </div>

          {/* Content Textarea */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your question or share your thoughts in detail..."
              rows={6}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Tags Section */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
              <TagIcon className="w-4 h-4" />
              Tags
            </label>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag..."
                className="flex-1 px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600/30 border border-blue-400/30 rounded-lg text-blue-300 hover:bg-blue-600/50 transition-colors"
              >
                Add
              </button>
            </div>

            {/* Tag Display */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600/30 border border-blue-400/30 rounded-full text-sm text-blue-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-300 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 hover:border-white/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!title.trim() || !content.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed border border-blue-500 rounded-lg text-white font-medium transition-colors"
            >
              Create Thread
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
