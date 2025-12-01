import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResumeTailorPage from '../features/04_ai_resume_tailor/ResumeTailorPage';
import { MasterProfileContext } from '../contexts/MasterProfileContext';
import { BrowserRouter } from 'react-router-dom';

// Mocks
const mockCallModel = vi.fn();
const mockProfile = {
  id: 'test-uid',
  fullName: 'Test User',
  email: 'test@example.com',
  experience: [],
  education: [],
  skills: [],
} as any;

// Mock the useGemini hook
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
        <ResumeTailorPage />
      </MasterProfileContext.Provider>
    </BrowserRouter>
  );
};

describe('ResumeTailorPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the input form initially', () => {
    renderPage();
    expect(screen.getByText('AI Resume Tailor')).toBeInTheDocument();
    expect(screen.getByText('Step 1: Input Job Details')).toBeInTheDocument();
  });

  it('alerts if profile is missing', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderPage(null); // No profile

    // Fill form to valid state
    const jdInput = screen.getByLabelText(/Job Description Text/i);
    const submitBtn = screen.getByText('Analyze & Tailor Resume').closest('button');
    
    fireEvent.change(jdInput, { target: { value: 'A very long job description that definitely meets the fifty character limit required by the schema validation logic.' } });
    
    // Wait for validation
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Please complete your Master Profile first.");
      expect(mockCallModel).not.toHaveBeenCalled();
    });
  });

  it('calls AI model with correct prompts', async () => {
    renderPage();
    
    const jdText = 'A very long job description that definitely meets the fifty character limit required by the schema validation logic.';
    
    const jdInput = screen.getByLabelText(/Job Description Text/i);
    const submitBtn = screen.getByText('Analyze & Tailor Resume').closest('button');
    
    fireEvent.change(jdInput, { target: { value: jdText } });
    
    // Wait for validation
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(mockCallModel).toHaveBeenCalled();
      const callArgs = mockCallModel.mock.calls[0][0];
      
      // Verify Prompt Structure
      expect(callArgs.prompt).toContain('TARGET JOB DESCRIPTION:');
      expect(callArgs.prompt).toContain(jdText);
      expect(callArgs.prompt).toContain('USER MASTER PROFILE:');
      
      // Verify Schema Usage
      expect(callArgs.responseSchema).toBeDefined();
    });
  });

  it('displays results after successful AI call', async () => {
    // Mock successful AI response
    mockCallModel.mockResolvedValue({
      matchScore: 85,
      matchRationale: 'Good match based on skills.',
      optimizedSummary: 'Experienced developer...',
      optimizedExperience: [],
      optimizedSkills: ['React'],
      missingKeywords: ['Python']
    });

    renderPage();
    
    // Trigger Analysis
    const jdInput = screen.getByLabelText(/Job Description Text/i);
    const submitBtn = screen.getByText('Analyze & Tailor Resume').closest('button');
    fireEvent.change(jdInput, { target: { value: 'Valid JD text for testing purposes that is long enough.' } });
    
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    fireEvent.click(submitBtn!);

    // Wait for Result View
    await waitFor(() => {
      expect(screen.getByText('Optimization Result')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Good match based on skills.')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument(); // Missing keyword
    });
  });
});

