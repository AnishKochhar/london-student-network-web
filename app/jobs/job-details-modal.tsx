'use client';

import { useEffect, useState } from 'react';
import { Job } from '../lib/types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/button';

interface JobDetailsModalProps {
  jobId: number;
  onClose: () => void;
}

export default function JobDetailsModal({ jobId, onClose }: JobDetailsModalProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/get/${jobId}`);
        const data = await res.json();
        if (data.success) setJob(data.job);
      } catch (err) {
        console.error('Error fetching job:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl text-gray-900">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading job...</div>
        ) : !job ? (
          <div className="text-center py-10 text-red-500">
            Unable to load job details.
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-2">{job.position}</h2>
            <p className="text-sm text-gray-600 mb-4">
              {job.company_name} • {job.location} • {job.job_type}
            </p>

            <div className="text-sm text-gray-700 space-y-3">
              <p className="whitespace-pre-line">{job.description}</p>

              {job.deadline && (
                <p>
                  <strong>Deadline:</strong>{' '}
                  {new Date(job.deadline).toLocaleDateString()}
                </p>
              )}

              <p>
                <strong>Posted:</strong>{' '}
                {new Date(job.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="mt-6">
              <a
                href={job.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="filled" size="md" className="w-full">
                  Apply Now
                </Button>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
