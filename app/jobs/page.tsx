'use client';

import { useEffect, useState } from 'react';
import { Job } from '../lib/types';
import { Button } from '../components/button';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import JobDetailsModal from './job-details-modal';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage, setJobsPerPage] = useState(6);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        const res = await fetch(`/api/jobs/get?pageSize=${jobsPerPage}&pageNum=${currentPage}`);
        const data = await res.json();
        if (data.success) setJobs(data.jobs);
      } catch (err) {
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [jobsPerPage, currentPage]);

  const totalPages = Math.ceil(jobs.length / jobsPerPage);
  const currentJobs = jobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage
  );

  return (
    <div className="h-full w-full bg-gray-50 py-12 px-4 text-gray-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8 text-center">
          Current Opportunities
        </h1>

        {/* Table or loader */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No job opportunities available at the moment.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl shadow bg-white">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-800 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Position</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedJob(job)}
                  >
                    <td className="px-6 py-3 font-medium">{job.position}</td>
                    <td className="px-6 py-3">{job.company_name}</td>
                    <td className="px-6 py-3">{job.location}</td>
                    <td className="px-6 py-3">{job.job_type}</td>
                    <td className="px-6 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                        //   e.stopPropagation();
                          setSelectedJob(job);
                        }}
                      >
                        View <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && jobs.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 w-full">
            {/* Jobs per page selector */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <label htmlFor="jobsPerPage" className="font-medium">
                Jobs per page:
              </label>
              <select
                id="jobsPerPage"
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={jobsPerPage}
                onChange={(e) => {
                  setCurrentPage(1);
                  setJobsPerPage(Number(e.target.value));
                }}
              >
                {[5, 10, 20, 50].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                aria-disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>

              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="ghost"
                size="sm"
                aria-disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* Job details modal */}
      {selectedJob && (
        <JobDetailsModal
          jobId={selectedJob.id}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}
