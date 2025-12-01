import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JobCard from '../features/01_job_discovery/JobCard';
import { JobTrackerContext } from '../contexts/JobTrackerContext';

// Mocks
const mockSaveJob = vi.fn();
const mockJob = {
  title: 'React Dev',
  company: 'Tech Corp',
  location: 'Remote',
  matchScore: 90,
  matchRationale: 'Good fit',
  description: 'Job desc',
  url: 'http://example.com'
} as any;

const renderCard = (savedJobs = []) => {
  return render(
    <JobTrackerContext.Provider value={{
      savedJobs,
      loading: false,
      saveJob: mockSaveJob,
      removeJob: vi.fn(),
      updateJobStatus: vi.fn()
    }}>
      <JobCard job={mockJob} />
    </JobTrackerContext.Provider>
  );
};

describe('JobCard Integration', () => {
  it('calls saveJob when save button is clicked', async () => {
    renderCard();
    
    const saveBtn = screen.getByTitle('Save Job');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockSaveJob).toHaveBeenCalledWith(expect.objectContaining({
        title: 'React Dev',
        company: 'Tech Corp'
      }));
    });
  });

  it('shows saved state if job is already saved', () => {
    renderCard([mockJob]); // Pass job as already saved
    
    // Check for "Saved" title or Check icon
    expect(screen.getByTitle('Saved')).toBeInTheDocument();
    
    // Ensure button is disabled
    const saveBtn = screen.getByTitle('Saved');
    expect(saveBtn).toBeDisabled();
  });
});

