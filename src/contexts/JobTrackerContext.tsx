import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { JobDetails } from '../lib/types';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from './AuthContext';

interface JobTrackerContextValue {
  savedJobs: JobDetails[];
  loading: boolean;
  saveJob: (job: Omit<JobDetails, 'id' | 'dateAdded' | 'status'>) => Promise<string>;
  removeJob: (jobId: string) => Promise<void>;
  updateJobStatus: (jobId: string, status: JobDetails['status']) => Promise<void>;
}

export const JobTrackerContext = createContext<JobTrackerContextValue | undefined>(undefined);

export const JobTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedJobs, setSavedJobs] = useState<JobDetails[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { isAuthReady, userId } = useAuth();
  const { subscribeToCollection, addDocument, deleteDocument, updateDocument } = useFirestore();

  useEffect(() => {
    if (!isAuthReady || !userId) {
      setSavedJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Subscribe to saved jobs collection
    // Path: /artifacts/{APP_ID}/users/{userId}/job_discovery_list
    const unsubscribe = subscribeToCollection('job_discovery_list', (data) => {
      // Sort by dateAdded descending
      const sorted = (data as JobDetails[]).sort((a, b) => 
        new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      );
      setSavedJobs(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, userId, subscribeToCollection]);

  const saveJob = useCallback(async (jobData: Omit<JobDetails, 'id' | 'dateAdded' | 'status'>) => {
    if (!userId) throw new Error("User not authenticated");
    
    // Check if already saved (by URL if available, or title+company combo)
    const exists = savedJobs.find(j => 
      (jobData.url && j.url === jobData.url) || 
      (j.title === jobData.title && j.company === jobData.company)
    );
    
    if (exists) {
      console.log("Job already saved, skipping duplicate.");
      return exists.id;
    }

    const newJob: Omit<JobDetails, 'id'> = {
      ...jobData,
      status: 'saved',
      dateAdded: new Date().toISOString()
    };

    return await addDocument('job_discovery_list', newJob);
  }, [userId, addDocument, savedJobs]);

  const removeJob = useCallback(async (jobId: string) => {
    await deleteDocument('job_discovery_list', jobId);
  }, [deleteDocument]);

  const updateJobStatus = useCallback(async (jobId: string, status: JobDetails['status']) => {
    console.log('Updating job status:', jobId, status);
    try {
      const result = await updateDocument('job_discovery_list', jobId, { status });
      console.log('Update document result:', result);
      // Explicitly return to ensure promise resolves
      return Promise.resolve(result);
    } catch (error) {
      console.error('Update document error:', error);
      throw error; // Re-throw to be caught by the component
    }
  }, [updateDocument]);

  const value: JobTrackerContextValue = {
    savedJobs,
    loading,
    saveJob,
    removeJob,
    updateJobStatus
  };

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
