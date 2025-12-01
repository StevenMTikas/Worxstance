import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResumeTailorInput from '../features/04_ai_resume_tailor/ResumeTailorInput';
import { MasterProfileContext } from '../contexts/MasterProfileContext';

// Mock Profile Context
const mockProfile = {
  id: 'test-uid',
  fullName: 'Test User',
  email: 'test@example.com',
  experience: [{ id: '1' }],
  education: [],
  skills: ['React'],
} as any;

const renderInput = (onAnalyze = vi.fn(), isAnalyzing = false, profile = mockProfile) => {
  return render(
    <MasterProfileContext.Provider value={{ 
      profile, 
      loading: false, 
      error: null, 
      updateProfile: vi.fn() 
    }}>
      <ResumeTailorInput onAnalyze={onAnalyze} isAnalyzing={isAnalyzing} />
    </MasterProfileContext.Provider>
  );
};

describe('ResumeTailorInput', () => {
  it('renders the form elements', () => {
    renderInput();
    expect(screen.getByText('Step 1: Input Job Details')).toBeInTheDocument();
    expect(screen.getByLabelText(/Job Description Text/i)).toBeInTheDocument();
    expect(screen.getByText('Analyze & Tailor Resume')).toBeInTheDocument();
  });

  it('displays profile summary in sidebar', () => {
    renderInput();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('1 Experience Entries')).toBeInTheDocument();
    expect(screen.getByText('1 Skills Listed')).toBeInTheDocument();
  });

  it('disables submit button when JD is too short', async () => {
    renderInput();
    const jdInput = screen.getByLabelText(/Job Description Text/i);
    const submitBtn = screen.getByText('Analyze & Tailor Resume').closest('button');

    // Type short text
    fireEvent.change(jdInput, { target: { value: 'Too short' } });
    
    // Check disabled state (might need to wait for validation mode: onChange)
    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
    });
  });

  it('enables submit button when JD is valid', async () => {
    renderInput();
    const jdInput = screen.getByLabelText(/Job Description Text/i);
    const submitBtn = screen.getByText('Analyze & Tailor Resume').closest('button');

    // Type long text (>50 chars)
    const longText = 'This is a valid job description that is definitely longer than fifty characters to pass the validation check required by the zod schema.';
    fireEvent.change(jdInput, { target: { value: longText } });

    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });
  });

  it('calls onAnalyze with form data', async () => {
    const handleAnalyze = vi.fn();
    renderInput(handleAnalyze);
    
    const jdInput = screen.getByLabelText(/Job Description Text/i);
    const roleInput = screen.getByLabelText(/Target Role/i);
    const submitBtn = screen.getByText('Analyze & Tailor Resume').closest('button');

    const longText = 'This is a valid job description that is definitely longer than fifty characters to pass the validation check required by the zod schema.';
    
    fireEvent.change(roleInput, { target: { value: 'Software Engineer' } });
    fireEvent.change(jdInput, { target: { value: longText } });

    // Wait for validation
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(handleAnalyze).toHaveBeenCalledWith({
        targetRole: 'Software Engineer',
        jobDescription: longText
      });
    });
  });

  it('shows loading state when analyzing', () => {
    renderInput(vi.fn(), true); // isAnalyzing = true
    expect(screen.getByText('Analyzing Match...')).toBeInTheDocument();
    expect(screen.getByText('Analyzing Match...').closest('button')).toBeDisabled();
  });
});

