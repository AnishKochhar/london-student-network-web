'use client';

import { useEffect, useState } from 'react';
import { Job } from '@/app/lib/types';
import { Button } from '@/app/components/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve params
  useEffect(() => {
    async function resolve() {
      const p = await params;
      setJobId(p.id);
    }
    resolve();
  }, [params]);

  // Fetch job
  useEffect(() => {
    if (!jobId) return;

    async function load() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        if (data.success) setJob(data.job);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [jobId]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-500">
        Loading job…
      </div>
    );
  }

  // Not found
  if (!job) {
    return (
      <div className="min-h-screen grid place-items-center text-red-500">
        Job not found.
      </div>
    );
  }

  // Final page
  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900 px-4 py-10 md:px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Back */}
        <div className="col-span-12 mb-2">
          <Link href="/jobs" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" /> Back to jobs
          </Link>
        </div>

        {/* LEFT: Main Article */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* Header */}
          <div className="bg-white rounded-xl shadow p-8">
            <h1 className="text-3xl font-bold mb-2">{job.position}</h1>
            <p className="text-gray-600 text-sm mb-6">
              {job.location} · {job.job_type} · Posted {new Date(job.created_at).toLocaleDateString()}
            </p>

            <a
              href={job.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="filled" size="lg" className="px-10">
                Apply Now
              </Button>
            </a>
          </div>

          {/* DESCRIPTION — LinkedIn-style full Markdown block */}
          <article className="bg-white rounded-xl shadow p-8 prose max-w-none">
            <div className="whitespace-pre-line">
              {job.description}
            </div>
          </article>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">

          {/* Company */}
          <aside className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-3">About the Company</h3>
            <Link
              href={`/company/${job.company_id}`}
              className="text-blue-600 font-medium"
            >
              View company profile →
            </Link>
          </aside>

          {/* Deadline */}
          {job.deadline && (
            <aside className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Application Deadline</h3>
              <p className="text-gray-700">
                {new Date(job.deadline).toLocaleDateString()}
              </p>
            </aside>
          )}

        </div>
      </div>
    </div>
  );
}
