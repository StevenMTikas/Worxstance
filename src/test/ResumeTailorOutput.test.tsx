import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResumeTailorOutput from '../features/04_ai_resume_tailor/ResumeTailorOutput';

const mockProfile = {
  id: '123',
  fullName: 'Test User',
  summary: 'Original Summary Text',
  experience: [
    {
      id: 'exp1',
      company: 'Tech Corp',
      role: 'Dev',
      achievements: ['Fixed bugs', 'Wrote code']
    }
  ],
  education: [],
  skills: []
} as any;

const mockResult = {
  matchScore: 85,
  matchRationale: 'Good fit',
  optimizedSummary: 'Better Summary Text',
  optimizedExperience: [
    {
      id: 'exp1',
      company: 'Tech Corp',
      role: 'Dev',
      optimizedAchievements: ['Optimized Bug Fix', 'Optimized Code Writing']
    }
  ],
  optimizedSkills: [],
  missingKeywords: ['Leadership']
} as any;

describe('ResumeTailorOutput', () => {
  it('renders score and rationale', () => {
    render(<ResumeTailorOutput originalProfile={mockProfile} result={mockResult} onReset={vi.fn()} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Good fit')).toBeInTheDocument();
  });

  it('renders download button', () => {
    render(<ResumeTailorOutput originalProfile={mockProfile} result={mockResult} onReset={vi.fn()} />);
    expect(screen.getByText('Download .md')).toBeInTheDocument();
  });

  it('triggers download on click', () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    const mockCreateObjectURL = vi.fn();
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    render(<ResumeTailorOutput originalProfile={mockProfile} result={mockResult} onReset={vi.fn()} />);
    
    const downloadBtn = screen.getByText('Download .md');
    fireEvent.click(downloadBtn);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });
});
