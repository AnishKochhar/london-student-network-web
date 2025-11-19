// Refactored JobsPage with LinkedIn-style layout: filters at top, left job list panel, right job detail panel
// Note: This is only UI restructuring. Adjust API integration as needed.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Job } from '../lib/types';
import { Button } from '../components/button';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import AddJobModal from './add-job-modal';
import Image from 'next/image';
import { JobDetailPanel } from './job-details';

export default function JobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage, setJobsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [showAddJob, setShowAddJob] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    company: '',
    jobType: '',
    location: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  async function fetchJobs() {
    setLoading(true);
    try {
      // Build query params with filters
      const params = new URLSearchParams({
        pageSize: jobsPerPage.toString(),
        pageNum: currentPage.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.company && { company: filters.company }),
        ...(filters.jobType && { jobType: filters.jobType }),
        ...(filters.location && { location: filters.location })
      });

      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();

      if (data.success) {
        setTotalPages(Math.ceil(data.total / jobsPerPage));
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      company: '',
      jobType: '',
      location: ''
    });
  };

  // Apply filters and refetch
  const applyFilters = () => {
    setCurrentPage(1);
    fetchJobs();
  };

  useEffect(() => {
    fetchJobs();
  }, [jobsPerPage, currentPage]);

  return (
    <div className="h-full w-full bg-gray-50 p-6">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-semibold">Current Opportunities</h1>

        <Button
          onClick={() => setShowAddJob(true)}
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
          variant="filled"
        >
          <PlusIcon className="h-4 w-4" /> Post a Job
        </Button>
      </div>

      {/* Filter Header */}
      <div className="max-w-7xl mx-auto mb-6 bg-white rounded-xl shadow p-4">
        {/* Main Search Bar */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs by title, keywords, or description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
          </Button>
          <Button
            onClick={applyFilters}
            variant="filled"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Search
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                placeholder="Filter by company..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.company}
                onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.jobType}
                onChange={(e) => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
              >
                <option value="">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="Filter by location..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            
            {/* Filter Actions */}
            <div className="md:col-span-3 flex justify-end gap-2 mt-2">
              <Button
                onClick={resetFilters}
                variant="outline"
                className="text-gray-600 border-gray-300"
              >
                Reset Filters
              </Button>
              <Button
                onClick={applyFilters}
                variant="filled"
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main 2-Panel Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 h-[70vh]">
        {/* LEFT PANEL — Job List */}
        <div className="bg-white rounded-xl shadow p-4 flex flex-col h-full relative">
          <h2 className="text-lg font-semibold mb-4">Job Listings</h2>

          {/* Scrollable job list container - this will take available space */}
          <div className="flex-1 overflow-y-auto mb-4">
            {loading ? (
              <div className="text-center py-10 text-gray-500">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No jobs available.</div>
            ) : (
              <ul className="space-y-3 max-h-[40vh]">
                {jobs.map((job) => (
                  <li
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-100 ${
                      selectedJob?.id === job.id ? 'bg-gray-100 border-blue-500' : ''
                    }`}
                  > 
                <div className="flex items-start gap-4 py-2">
                      {/* Logo */}
                      <Image
                        src={job.company_logo_url || "/favicon-32x32.png"}
                        alt={job.company_name || "Company Logo"}
                        width={50}
                        height={50}
                        className="object-contain rounded-lg border p-1 bg-white flex-shrink-0"
                      />

                      {/* Job Info — now allowed to wrap and grow */}
                      <div className="flex flex-col flex-1 leading-snug space-y-0.5">
                        <div className="font-semibold text-gray-900 text-base break-words">
                          {job.position}
                        </div>

                        <div className="text-sm text-gray-700 break-words">
                          {job.company_name}
                        </div>

                        <div className="text-xs text-gray-500 break-words">
                          {job.location}
                        </div>

                        <div className="text-xs text-blue-600 font-medium mt-1">
                          {job.job_type}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Fixed pagination at bottom */}
          {!loading && jobs.length > 0 && (
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <label className="font-medium">Jobs per page:</label>
                <select
                  className="border rounded-lg px-2 py-1 bg-white"
                  value={jobsPerPage}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setJobsPerPage(Number(e.target.value));
                  }}
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-700">
                <button
                  className="px-3 py-1 border rounded disabled:opacity-40"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  className="px-3 py-1 border rounded disabled:opacity-40"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL — Job Details */}
        <div className="md:col-span-2 bg-white rounded-xl shadow p-6 overflow-y-auto">
          {selectedJob ? (
            <JobDetailPanel
              job={selectedJob}
              onViewFull={() => router.push(`/jobs/${selectedJob.id}`)}
            />
          ) : (
            <div className="text-center text-gray-500 py-20">
              Select a job to view details
            </div>
          )}
        </div>

      </div>

      {showAddJob && (
        <AddJobModal
          onClose={() => setShowAddJob(false)}
          onSuccess={() => {
            setShowAddJob(false);
            fetchJobs();
          }}
        />
      )}
    </div>
  );
}