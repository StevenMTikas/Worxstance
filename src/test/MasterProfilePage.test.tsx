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
        logout: vi.fn() 
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
});
