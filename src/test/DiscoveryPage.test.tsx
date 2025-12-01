import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DiscoveryPage from '../features/01_job_discovery/DiscoveryPage';
import { MasterProfileContext } from '../contexts/MasterProfileContext';
import { BrowserRouter } from 'react-router-dom';

// Mocks
const mockCallModel = vi.fn();
const mockProfile = {
  id: 'test-uid',
  skills: ['React', 'TypeScript'],
  experience: [{ role: 'Dev', company: 'Tech' }]
} as any;

vi.mock('../hooks/useGemini', () => ({
  useGemini: () => ({
    loading: false,
    error: null,
    callModel: mockCallModel
  })
}));

const renderPage = (profileValue = mockProfile) => {
  return render(
    <BrowserRouter>
      <MasterProfileContext.Provider value={{ 
        profile: profileValue, 
        loading: false, 
        error: null, 
        updateProfile: vi.fn() 
      }}>
        <DiscoveryPage />
      </MasterProfileContext.Provider>
    </BrowserRouter>
  );
};

describe('DiscoveryPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls AI with grounding tools enabled', async () => {
    renderPage();
    
    // Fill Search Form
    fireEvent.change(screen.getByLabelText(/Target Role/i), { target: { value: 'Frontend Dev' } });
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'Remote' } });
    
    // Submit
    const submitBtn = screen.getByText('Find Jobs').closest('button');
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(mockCallModel).toHaveBeenCalled();
      const callArgs = mockCallModel.mock.calls[0][0];
      
      // Verify Grounding Tool is passed
      expect(callArgs.tools).toEqual([{ google_search: {} }]);
      
      // Verify Profile Context inclusion
      expect(callArgs.prompt).toContain('User Skills: React, TypeScript');
    });
  });

  it('renders job cards from AI response', async () => {
    mockCallModel.mockResolvedValue({
      recommendedJobs: [
        {
          title: 'Senior React Dev',
          company: 'Cool Corp',
          location: 'Remote',
          matchScore: 95,
          matchRationale: 'Perfect match',
          description: 'Build cool stuff.',
          url: 'https://example.com'
        }
      ]
    });

    renderPage();
    
    // Trigger Search
    const submitBtn = screen.getByText('Find Jobs').closest('button');
    fireEvent.change(screen.getByLabelText(/Target Role/i), { target: { value: 'Frontend Dev' } });
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'Remote' } });
    fireEvent.click(submitBtn!);

    // Check Results
    await waitFor(() => {
      expect(screen.getByText('Senior React Dev')).toBeInTheDocument();
      expect(screen.getByText('Cool Corp')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
    });
  });
});

