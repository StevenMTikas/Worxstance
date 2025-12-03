import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OutreachGenerator from '../features/02_networking/OutreachGenerator';
import type { NetworkingContact } from '../lib/types';

const mockCallModel = vi.fn();
const mockSaveSequence = vi.fn();
const mockLogActivity = vi.fn();

const sampleContact: NetworkingContact = {
  id: 'contact-1',
  fullName: 'Jordan Lee',
  role: 'Director of Product',
  company: 'Northwind',
  email: 'jordan@example.com',
  linkedinUrl: 'https://linkedin.com/in/jordan',
  location: 'Remote',
  status: 'new',
  priority: 'high',
  icpValueScore: 90,
  mutualContext: 'Met at GTM Summit',
  tags: ['Product'],
  activity: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

vi.mock('../hooks/useGemini', () => ({
  useGemini: () => ({
    loading: false,
    error: null,
    callModel: mockCallModel,
  }),
}));

vi.mock('../contexts/MasterProfileContext', () => ({
  useMasterProfile: () => ({
    profile: {
      fullName: 'Alex Candidate',
      headline: 'Product Lead',
      skills: ['GTM', 'AI'],
    },
    loading: false,
    error: null,
    updateProfile: vi.fn(),
  }),
}));

vi.mock('../contexts/NetworkingContext', () => ({
  useNetworking: () => ({
    saveSequence: mockSaveSequence,
    logActivity: mockLogActivity,
    bulkSendWithTemplate: vi.fn(),
    contacts: [],
    sequences: [],
    loadingContacts: false,
    loadingSequences: false,
    createContact: vi.fn(),
    updateContactStage: vi.fn(),
    markSequenceSent: vi.fn(),
  }),
}));

describe('OutreachGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCallModel.mockResolvedValue({
      subject: 'New intro',
      opener: 'Thought of you because…',
      body: ['Paragraph body'],
      cta: 'Open to connect?',
      personalizationNotes: ['Reference launch'],
    });
  });

  it('prompts user to select a contact before generating', () => {
    render(<OutreachGenerator contact={null} />);

    expect(screen.getByText(/Select a contact from the board/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Generate Draft'));

    expect(mockCallModel).not.toHaveBeenCalled();
  });

  it('calls Gemini and saves draft', async () => {
    render(<OutreachGenerator contact={sampleContact} />);

    fireEvent.click(screen.getByText('Generate Draft'));

    await waitFor(() => {
      expect(mockCallModel).toHaveBeenCalled();
    });

    expect(await screen.findByText('New intro')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Save Draft'));

    await waitFor(() => {
      expect(mockSaveSequence).toHaveBeenCalledWith(
        expect.objectContaining({
          contactId: 'contact-1',
          subject: 'New intro',
        }),
      );
    });
    expect(mockLogActivity).toHaveBeenCalled();
  });
});

