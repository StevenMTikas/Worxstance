import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MasterProfilePage from '../pages/MasterProfile';
import { AuthContext } from '../contexts/AuthContext';
import { MasterProfileContext } from '../contexts/MasterProfileContext';
import { BrowserRouter } from 'react-router-dom';

// Mocks
const mockUser = {
  uid: 'test-uid-123',
  email: 'test@example.com',
  isAnonymous: false,
} as any;

const mockUpdateProfile = vi.fn();
const mockProfile = {
  id: 'test-uid-123',
  fullName: 'John Doe',
  email: 'test@example.com',
  experience: [],
  education: [],
  skills: [],
  targetRoles: [],
  certifications: [],
  lastUpdated: '2023-01-01T00:00:00.000Z'
} as any;

const renderWithProviders = (ui: React.ReactNode, profileValue = null) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ 
        user: mockUser, 
        userId: mockUser.uid, 
        isAuthReady: true, 
        login: vi.fn(), 
        register: vi.fn(), 
        logout: vi.fn(),
        signInAsGuest: vi.fn()
      }}>
        <MasterProfileContext.Provider value={{ 
          profile: profileValue, 
          loading: false,
          error: null,
          updateProfile: mockUpdateProfile 
        }}>
          {ui}
        </MasterProfileContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('MasterProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the basic info section', () => {
    renderWithProviders(<MasterProfilePage />);
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
  });

  it('renders existing profile data', () => {
    renderWithProviders(<MasterProfilePage />, mockProfile);
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
  });

  it('validates required fields on save', async () => {
    renderWithProviders(<MasterProfilePage />);
    
    const saveBtn = screen.getByText('Save Changes');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
    });
  });

  it('calls updateProfile when form is valid', async () => {
    renderWithProviders(<MasterProfilePage />);
    
    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'jane@example.com' } });
    
    // Click save
    const saveBtn = screen.getByText('Save Changes');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
      const calledArg = mockUpdateProfile.mock.calls[0][0];
      expect(calledArg.fullName).toBe('Jane Smith');
      expect(calledArg.email).toBe('jane@example.com');
    });
  });

  it('renders Education section', () => {
    renderWithProviders(<MasterProfilePage />);
    expect(screen.getByText('Education')).toBeInTheDocument();
  });

  it('renders Skills section', () => {
    renderWithProviders(<MasterProfilePage />);
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  it('allows adding education entries', async () => {
    renderWithProviders(<MasterProfilePage />);
    
    const addEducationBtn = screen.getByText('Add Education');
    fireEvent.click(addEducationBtn);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g. MIT, Stanford University/i)).toBeInTheDocument();
    });
  });

  it('allows adding skills', async () => {
    renderWithProviders(<MasterProfilePage />);
    
    const skillInput = screen.getByPlaceholderText(/e.g. Python, React, Project Management/i);
    const addSkillBtn = screen.getByText('Add');

    fireEvent.change(skillInput, { target: { value: 'Python' } });
    fireEvent.click(addSkillBtn);

    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
    });
  });

  it('saves education data correctly', async () => {
    renderWithProviders(<MasterProfilePage />);
    
    // Fill required fields first
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'test@example.com' } });
    
    // Add education
    const addEducationBtn = screen.getByText('Add Education');
    fireEvent.click(addEducationBtn);

    await waitFor(() => {
      const institutionInput = screen.getByPlaceholderText(/e.g. MIT, Stanford University/i);
      expect(institutionInput).toBeInTheDocument();
    });

    const institutionInput = screen.getByPlaceholderText(/e.g. MIT, Stanford University/i);
    const degreeInput = screen.getByPlaceholderText(/e.g. Bachelor of Science/i);
    
    // Find graduation date input by its name attribute
    const graduationDateInputs = screen.getAllByDisplayValue('');
    const graduationDateInput = graduationDateInputs.find(input => 
      input.getAttribute('type') === 'date'
    ) as HTMLInputElement;
    
    expect(graduationDateInput).toBeDefined();
    
    fireEvent.change(institutionInput, { target: { value: 'MIT' } });
    fireEvent.change(degreeInput, { target: { value: 'Bachelor of Science' } });
    fireEvent.change(graduationDateInput, { target: { value: '2020-05-15' } });

    // Save
    const saveBtn = screen.getByText('Save Changes');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
      const calledArg = mockUpdateProfile.mock.calls[0][0];
      expect(calledArg.education).toBeDefined();
      expect(Array.isArray(calledArg.education)).toBe(true);
      expect(calledArg.education.length).toBe(1);
      expect(calledArg.education[0].institution).toBe('MIT');
      expect(calledArg.education[0].degree).toBe('Bachelor of Science');
    }, { timeout: 3000 });
  });

  it('saves skills data correctly', async () => {
    renderWithProviders(<MasterProfilePage />);
    
    // Fill required fields first
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'test@example.com' } });
    
    // Add skills
    const skillInput = screen.getByPlaceholderText(/e.g. Python, React, Project Management/i);
    const addSkillBtn = screen.getByText('Add');

    fireEvent.change(skillInput, { target: { value: 'Python' } });
    fireEvent.click(addSkillBtn);

    await waitFor(() => {
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    // Add another skill
    fireEvent.change(skillInput, { target: { value: 'React' } });
    fireEvent.click(addSkillBtn);

    // Save
    const saveBtn = screen.getByText('Save Changes');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
      const calledArg = mockUpdateProfile.mock.calls[0][0];
      expect(calledArg.skills).toBeDefined();
      expect(Array.isArray(calledArg.skills)).toBe(true);
      expect(calledArg.skills.length).toBeGreaterThan(0);
    });
  });
});
