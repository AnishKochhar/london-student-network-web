import { Button } from "../components/button";
import { Job } from "../lib/types";

export function JobDetailPanel({ job, onViewFull }: {
  job: Job;
  onViewFull: () => void;
}) {
  if (!job) {
    return (
      <div className="text-center text-gray-500 py-20">
        Select a job to view details
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl shadow p-6">
          <h1 className="text-2xl font-bold mb-1 break-words">{job.position}</h1>

          <p className="text-gray-700 text-sm font-medium break-words">
            {job.company_name}
          </p>

          <p className="text-gray-500 text-sm mt-1">
            {job.location} • {job.job_type}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Posted {new Date(job.created_at).toLocaleDateString()}
          </p>

          <Button
            variant="ghost"
            className="mt-4"
            onClick={onViewFull}
          >
            View Full Job Page
          </Button>
        </div>

        {/* Job Description Preview */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Job Overview</h3>

          <div className="text-sm text-gray-700 max-h-48 overflow-y-auto whitespace-pre-line">
            {job.description?.slice(0, 600) || "No description available."}

            {/* Fade-out if truncated */}
            {job.description && job.description.length > 600 && (
              <div className="mt-3 text-blue-600 cursor-pointer" onClick={onViewFull}>
                Read more →
              </div>
            )}
          </div>
        </div>

        {/* Extra meta */}
        {job.deadline && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Application Deadline</h3>
            <p className="text-gray-700">
              {new Date(job.deadline).toLocaleDateString()}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
