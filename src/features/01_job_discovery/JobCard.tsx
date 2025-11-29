import React from 'react';
import type { TrackedJob } from '../../lib/types';

interface JobCardProps {
  job: TrackedJob;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        {job.title} <span className="text-slate-500">· {job.company}</span>
      </h2>
      {job.url && (
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex text-xs text-blue-600 hover:underline"
        >
          View posting
        </a>
      )}
    </div>
  );
};

export default JobCard;


