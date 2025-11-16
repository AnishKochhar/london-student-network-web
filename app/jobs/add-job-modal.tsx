'use client';

import { useState } from 'react';
import { Button } from '../components/button';
import { Job } from '../lib/types';
import toast from 'react-hot-toast';

interface AddJobModalProps {
  onClose: () => void;
  onSuccess: () => void;
  companyId?: string; // Optional in case you get this from session/user context
}

export default function AddJobModal({ onClose, onSuccess, companyId }: AddJobModalProps) {
  const [form, setForm] = useState<Partial<Job>>({
    company_id: companyId || '',
    position: '',
    location: '',
    job_type: '',
    description: '',
    link: '',
    deadline: '',
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("successfully posted job")
        onSuccess();
        onClose();
      } else {
        console.error('Failed to post job:', data.message);
        toast.error(data.message)
      }
    } catch (err) {
      console.error('Error posting job:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Post a Job</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Position"
            value={form.position || ''}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            required
          />

          <input
            type="text"
            placeholder="Location"
            value={form.location || ''}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            required
          />

          <input
            type="text"
            placeholder="Type (e.g. Part-time, Freelance)"
            value={form.job_type || ''}
            onChange={(e) => setForm({ ...form, job_type: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            required
          />

          <textarea
            placeholder="Description"
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 h-24"
            required
          />

          <input
            type="text"
            placeholder="Application Link"
            value={form.link || ''}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            required
          />

          <input
            type="date"
            value={form.deadline ? form.deadline.split('T')[0] : ''}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={loading}
              variant={'outline'}
            >
              {loading ? 'Posting...' : 'Post Job'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
