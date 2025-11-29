import React, { createContext, useContext, useState } from 'react';
import type { TrackedJob } from '../lib/types';

interface JobTrackerContextValue {
  jobs: TrackedJob[];
  addJob: (job: TrackedJob) => void;
}

const JobTrackerContext = createContext<JobTrackerContextValue | undefined>(undefined);

export const JobTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<TrackedJob[]>([]);

  const addJob = (job: TrackedJob) => {
    setJobs((prev) => [...prev, job]);
  };

  const value: JobTrackerContextValue = { jobs, addJob };

  return (
    <JobTrackerContext.Provider value={value}>
      {children}
    </JobTrackerContext.Provider>
  );
};

export const useJobTracker = (): JobTrackerContextValue => {
  const ctx = useContext(JobTrackerContext);
  if (!ctx) {
    throw new Error('useJobTracker must be used within a JobTrackerProvider');
  }
  return ctx;
};


