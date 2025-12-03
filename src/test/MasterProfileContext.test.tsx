import { render, waitFor, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MasterProfileProvider, useMasterProfile } from '../contexts/MasterProfileContext';
import { AuthContext } from '../contexts/AuthContext';
import { useEffect } from 'react';

// Mock useFirestore
const mockSetDocument = vi.fn();
const mockSubscribeToDocument = vi.fn();

vi.mock('../hooks/useFirestore', () => ({
  useFirestore: () => ({
    setDocument: mockSetDocument,
    subscribeToDocument: mockSubscribeToDocument,
    isAuthReady: true,
    userId: 'test-uid'
  })
}));

const TestComponent = () => {
  const { profile, updateProfile, loading } = useMasterProfile();
  
  useEffect(() => {
    if (!loading) {
      updateProfile({ id: 'test', fullName: 'New Name' } as any);
    }
  }, [loading, updateProfile]);

  if (loading) return <div>Loading...</div>;
  return <div>{profile?.fullName || 'No Profile'}</div>;
};

const renderProvider = (authReady = true) => {
  return render(
    <AuthContext.Provider value={{ 
      user: { uid: 'test-uid' } as any, 
      userId: 'test-uid', 
      isAuthReady: authReady, 
      login: vi.fn(), 
      register: vi.fn(), 
      logout: vi.fn(),
      signInAsGuest: vi.fn()
    }}>
      <MasterProfileProvider>
        <TestComponent />
      </MasterProfileProvider>
    </AuthContext.Provider>
  );
};

describe('MasterProfileContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default subscription behavior: immediate callback with null
    mockSubscribeToDocument.mockImplementation((_col, _docId, cb) => {
      cb(null);
      return () => {};
    });
  });

  it('subscribes to firestore on mount', async () => {
    renderProvider();
    
    expect(mockSubscribeToDocument).toHaveBeenCalledWith(
      'master_profiles',
      'primary',
      expect.any(Function)
    );
  });

  it('updates profile via firestore', async () => {
    mockSubscribeToDocument.mockImplementation((_col, _docId, cb) => {
      cb({ id: 'test', fullName: 'Old Name' });
      return () => {};
    });

    renderProvider();

    await waitFor(() => {
      expect(screen.getByText('Old Name')).toBeInTheDocument();
    });

    // Component triggers update on mount after loading
    expect(mockSetDocument).toHaveBeenCalledWith(
      'master_profiles', 
      'primary', 
      expect.objectContaining({ fullName: 'New Name' })
    );
  });
});

