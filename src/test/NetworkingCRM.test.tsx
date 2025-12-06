import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import NetworkingCRM from '../features/02_networking/NetworkingCRM';
import type { NetworkingContact } from '../lib/types';

const mockUpdateStage = vi.fn();
const mockBulkSend = vi.fn();
const mockCreateContact = vi.fn();
const mockUpdateContact = vi.fn();
const mockSaveSequence = vi.fn();
const mockLogActivity = vi.fn();

const mockContacts: NetworkingContact[] = [
  {
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
    tags: ['Product', 'Series B'],
    activity: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'contact-2',
    fullName: 'Mina Patel',
    role: 'VP Marketing',
    company: 'Acme AI',
    email: 'mina@example.com',
    linkedinUrl: 'https://linkedin.com/in/mina',
    location: 'NYC',
    status: 'warm',
    priority: 'medium',
    icpValueScore: 75,
    mutualContext: 'Warm intro via Priya',
    tags: ['ABM'],
    activity: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

vi.mock('../contexts/NetworkingContext', () => ({
  useNetworking: () => ({
    contacts: mockContacts,
    sequences: [],
    loadingContacts: false,
    loadingSequences: false,
    createContact: mockCreateContact,
    updateContact: mockUpdateContact,
    updateContactStage: mockUpdateStage,
    bulkSendWithTemplate: mockBulkSend,
    logActivity: mockLogActivity,
    saveSequence: mockSaveSequence,
    markSequenceSent: vi.fn(),
  }),
}));

vi.mock('../contexts/MasterProfileContext', () => ({
  useMasterProfile: () => ({
    profile: {
      fullName: 'Alex Candidate',
      targetRoles: ['Product Lead'],
      skills: ['GTM', 'AI', 'Leadership'],
    },
    loading: false,
    error: null,
    updateProfile: vi.fn(),
  }),
}));

vi.mock('../hooks/useGemini', () => ({
  useGemini: () => ({
    loading: false,
    error: null,
    callModel: vi.fn().mockResolvedValue({
      subject: 'Subject',
      opener: 'Opener',
      body: ['Paragraph'],
      cta: 'CTA',
      personalizationNotes: ['Note'],
    }),
  }),
}));

describe('NetworkingCRM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBulkSend.mockResolvedValue(undefined);
  });

  it('renders contacts inside their pipeline stages', () => {
    render(
      <BrowserRouter>
        <NetworkingCRM />
      </BrowserRouter>
    );

    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Warm')).toBeInTheDocument();
    expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    expect(screen.getByText('Mina Patel')).toBeInTheDocument();
  });

  it('moves a contact to the next stage', () => {
    render(
      <BrowserRouter>
        <NetworkingCRM />
      </BrowserRouter>
    );

    const moveButton = screen.getByText('Move to Warm');
    fireEvent.click(moveButton);

    expect(mockUpdateStage).toHaveBeenCalledWith('contact-1', 'warm');
  });

  it('enforces selection before triggering bulk send', async () => {
    render(
      <BrowserRouter>
        <NetworkingCRM />
      </BrowserRouter>
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    expect(screen.getByText(/Bulk Outreach/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Send with Template'));

    await waitFor(() => {
      expect(mockBulkSend).toHaveBeenCalled();
    });
  });

  it('opens edit modal when edit button is clicked', async () => {
    render(
      <BrowserRouter>
        <NetworkingCRM />
      </BrowserRouter>
    );

    const editButtons = screen.getAllByLabelText('Edit contact');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Edit Contact')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Jordan Lee')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Director of Product')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Northwind')).toBeInTheDocument();
    });
  });

  it('updates contact when save changes is clicked', async () => {
    mockUpdateContact.mockResolvedValue(undefined);
    render(
      <BrowserRouter>
        <NetworkingCRM />
      </BrowserRouter>
    );

    const editButtons = screen.getAllByLabelText('Edit contact');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Edit Contact')).toBeInTheDocument();
    });

    const fullNameInput = screen.getByDisplayValue('Jordan Lee');
    fireEvent.change(fullNameInput, { target: { value: 'Jordan Lee Updated' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateContact).toHaveBeenCalledWith('contact-1', expect.objectContaining({
        fullName: 'Jordan Lee Updated',
      }));
    });
  });

  it('closes edit modal when cancel is clicked', async () => {
    render(
      <BrowserRouter>
        <NetworkingCRM />
      </BrowserRouter>
    );

    const editButtons = screen.getAllByLabelText('Edit contact');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Edit Contact')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Edit Contact')).not.toBeInTheDocument();
    });
  });
});

