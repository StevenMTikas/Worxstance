import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SkillGapAnalyzerPage from '../features/03_skill_gap_analyzer/SkillGapAnalyzerPage';
import { MasterProfileContext } from '../contexts/MasterProfileContext';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import * as useSkillGapAnalysisHook from '../features/03_skill_gap_analyzer/useSkillGapAnalysis';
import * as useFirestoreHook from '../hooks/useFirestore';

// Mock Dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockAnalyzeGap = vi.fn();
const mockAddDocument = vi.fn();

// Mock useSkillGapAnalysis
vi.spyOn(useSkillGapAnalysisHook, 'useSkillGapAnalysis').mockImplementation(() => ({
  analyzeGap: mockAnalyzeGap,
  analysisResult: null,
  loading: false,
  error: null,
}));

// Mock useFirestore
vi.spyOn(useFirestoreHook, 'useFirestore').mockImplementation(() => ({
  addDocument: mockAddDocument,
  subscribeToDocument: vi.fn(),
  setDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  subscribeToCollection: vi.fn(),
  getCollection: vi.fn()
}));

const mockProfile = {
  id: 'test-uid',
  fullName: 'Test User',
  email: 'test@example.com',
  experience: [],
  education: [],
  skills: ['React', 'TypeScript'],
  targetRoles: ['Frontend Developer'],
  certifications: []
} as any;

const mockAnalysisOutput = {
  matchScore: 75,
  summary: 'Good profile but missing Cloud skills.',
  missingSkills: [
    { skill: 'AWS', priority: 'high', reason: 'Required for deployment.' }
  ],
  matchingSkills: ['React', 'TypeScript'],
  roadmap: [
    { 
      title: 'Learn AWS Basics', 
      description: 'Understand EC2 and S3.', 
      estimatedTime: '2 weeks',
      priority: 'high'
    }
  ]
};

const renderPage = (profileValue = mockProfile, authReady = true, user = { uid: 'test-uid' }) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ 
        user: user as any, 
        userId: user ? user.uid : null,
        isAuthReady: authReady, 
        login: vi.fn(), 
        register: vi.fn(),
        logout: vi.fn() 
      } as any}>
        <MasterProfileContext.Provider value={{ 
          profile: profileValue, 
          loading: false, 
          error: null, 
          updateProfile: vi.fn() 
        }}>
          <SkillGapAnalyzerPage />
        </MasterProfileContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('SkillGapAnalyzerPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset hook mock to default state
    vi.spyOn(useSkillGapAnalysisHook, 'useSkillGapAnalysis').mockImplementation(() => ({
      analyzeGap: mockAnalyzeGap,
      analysisResult: null,
      loading: false,
      error: null,
    }));
  });

  it('renders the input form initially', () => {
    renderPage();
    expect(screen.getByText('Skill Gap Analyzer')).toBeInTheDocument();
    expect(screen.getByText('New Analysis')).toBeInTheDocument();
    expect(screen.getByLabelText(/Job Description/i)).toBeInTheDocument();
  });

  it('shows warning if profile is missing', () => {
    renderPage(null);
    expect(screen.getByText(/Please complete your Master Profile/i)).toBeInTheDocument();
    expect(screen.getByText('Go to Master Profile')).toBeInTheDocument();
  });

  it('validates input length', async () => {
    renderPage();
    const jdInput = screen.getByLabelText(/Job Description/i);
    const submitBtn = screen.getByRole('button', { name: /Analyze Gaps/i });

    fireEvent.change(jdInput, { target: { value: 'Too short' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/must be at least 50 characters/i)).toBeInTheDocument();
      expect(mockAnalyzeGap).not.toHaveBeenCalled();
    });
  });

  it('calls analyzeGap when form is submitted with valid data', async () => {
    // Mock analyzeGap to return result (simulating success)
    mockAnalyzeGap.mockResolvedValue(mockAnalysisOutput);

    renderPage();
    const validJD = 'This is a very long job description that definitely exceeds the fifty character minimum requirement for the validation to pass successfully.';
    const jdInput = screen.getByLabelText(/Job Description/i);
    const submitBtn = screen.getByRole('button', { name: /Analyze Gaps/i });

    fireEvent.change(jdInput, { target: { value: validJD } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAnalyzeGap).toHaveBeenCalledWith(validJD, mockProfile, '');
    });
  });

  it('displays results and allows saving after successful analysis', async () => {
    // Mock analyzeGap to return result and update hook state
    // In a real integration test with actual hooks this would happen naturally.
    // Here we need to simulate the component re-rendering with new data or state change.
    // However, since we mocked the hook, the component won't re-render with new data unless we change the mock return value AND force re-render, 
    // OR (better) we make the component use local state to store the result returned by the async function (which it does: setCurrentReport).
    
    mockAnalyzeGap.mockResolvedValue(mockAnalysisOutput);

    renderPage();
    
    const validJD = 'This is a very long job description that definitely exceeds the fifty character minimum requirement for the validation to pass successfully.';
    fireEvent.change(screen.getByLabelText(/Job Description/i), { target: { value: validJD } });
    fireEvent.click(screen.getByRole('button', { name: /Analyze Gaps/i }));

    // Wait for the report to appear
    await waitFor(() => {
      expect(screen.getByText('Analysis Summary')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Good profile but missing Cloud skills.')).toBeInTheDocument();
    });

    // Check Roadmap
    expect(screen.getByText('Personalized Learning Roadmap')).toBeInTheDocument();
    expect(screen.getByText('Learn AWS Basics')).toBeInTheDocument();

    // Test Save
    const saveBtn = screen.getByRole('button', { name: /Save Report/i });
    mockAddDocument.mockResolvedValue('new-doc-id');
    
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockAddDocument).toHaveBeenCalledWith('gap_reports', expect.objectContaining({
        matchScore: 75,
        summary: 'Good profile but missing Cloud skills.',
        jobTitle: 'Unspecified Role'
      }));
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });
});

