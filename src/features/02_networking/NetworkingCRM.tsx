import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, X } from 'lucide-react';
import { useNetworking } from '../../contexts/NetworkingContext';
import { useMasterProfile } from '../../contexts/MasterProfileContext';
import type { NetworkingContact, PipelineStage } from '../../lib/types';
import { Button } from '../../components/common/Button';
import OutreachGenerator from './OutreachGenerator';

const stageMeta: Record<PipelineStage, { label: string; helper: string; accent: string; }> = {
  new: { label: 'New', helper: 'Fresh leads captured this week', accent: 'border-sky-200' },
  warm: { label: 'Warm', helper: 'Conversation in motion', accent: 'border-amber-200' },
  meeting: { label: 'Meeting', helper: 'Live conversations scheduled', accent: 'border-emerald-200' },
  closed: { label: 'Closed', helper: 'Introductions, offers, or parked', accent: 'border-violet-200' },
};

const initialBulkTemplate = {
  subject: 'Quick idea for {{company}}',
  opener: 'Wanted to pass along a fast win based on what {{company}} is scaling right now.',
  body: [
    'I’ve led similar initiatives at top GTM orgs and saw ${value} impact.',
    'Happy to pass along a teardown or bullet list if helpful.',
  ],
  cta: 'Open to a 15-min chat next week?',
  personalizationNotes: [
    'Mention a recent post or funding announcement.',
    'Connect their focus area with a specific achievement from your Master Profile.',
  ],
  channel: 'email' as const,
  templateType: 'intro' as const,
};

const stageOrder: PipelineStage[] = ['new', 'warm', 'meeting', 'closed'];

// Helper to get the last contact date from a contact
const getLastContactDate = (contact: NetworkingContact): string | null => {
  // First check lastInteractionAt
  if (contact.lastInteractionAt) {
    return contact.lastInteractionAt;
  }
  
  // Otherwise, find the most recent activity that represents contact
  // Include email, call, meeting, and ai_draft (since drafts are also outreach attempts)
  const contactActivities = (contact.activity || []).filter(
    (act) => act.type === 'email' || act.type === 'call' || act.type === 'meeting' || act.type === 'ai_draft'
  );
  
  if (contactActivities.length > 0) {
    const sorted = contactActivities.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted[0].createdAt;
  }
  
  return null;
};

const NetworkingCRM: React.FC = () => {
  const navigate = useNavigate();
  const {
    contacts,
    loadingContacts,
    createContact,
    updateContact,
    updateContactStage,
    bulkSendWithTemplate,
  } = useNetworking();
  const { profile } = useMasterProfile();

  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [contactForm, setContactForm] = useState({
    fullName: '',
    company: '',
    role: '',
    email: '',
    linkedinUrl: '',
    mutualContext: '',
    tags: '',
  });
  const [creatingContact, setCreatingContact] = useState(false);
  const [bulkTemplate, setBulkTemplate] = useState(initialBulkTemplate);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  
  // Edit modal state
  const [editingContact, setEditingContact] = useState<NetworkingContact | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    company: '',
    role: '',
    email: '',
    linkedinUrl: '',
    mutualContext: '',
    tags: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const selectedContact = useMemo<NetworkingContact | null>(() => {
    if (!selectedContactId) return null;
    return contacts.find((c) => c.id === selectedContactId) ?? null;
  }, [selectedContactId, contacts]);

  const bucketed = useMemo(() => {
    return stageOrder.map((stage) => ({
      stage,
      contacts: contacts.filter((contact) => contact.status === stage),
    }));
  }, [contacts]);

  const getNextStage = (stage: PipelineStage): PipelineStage | null => {
    const idx = stageOrder.indexOf(stage);
    if (idx === -1 || idx === stageOrder.length - 1) return null;
    return stageOrder[idx + 1];
  };

  const handleCreateContact = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!contactForm.fullName.trim()) return;

    setCreatingContact(true);
    try {
      await createContact({
        fullName: contactForm.fullName,
        company: contactForm.company,
        role: contactForm.role,
        email: contactForm.email,
        linkedinUrl: contactForm.linkedinUrl,
        mutualContext: contactForm.mutualContext,
        tags: contactForm.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setContactForm({
        fullName: '',
        company: '',
        role: '',
        email: '',
        linkedinUrl: '',
        mutualContext: '',
        tags: '',
      });
    } finally {
      setCreatingContact(false);
    }
  };

  const toggleSelection = (contactId: string) => {
    setSelectedIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleBulkSend = async () => {
    if (selectedIds.length === 0) return;
    setBulkSending(true);
    setBulkError(null);

    try {
      await bulkSendWithTemplate(selectedIds, bulkTemplate);
      setSelectedIds([]);
    } catch (err: any) {
      setBulkError(err.message || 'Bulk send failed.');
    } finally {
      setBulkSending(false);
    }
  };

  const handleEditContact = (contact: NetworkingContact) => {
    setEditingContact(contact);
    setEditForm({
      fullName: contact.fullName,
      company: contact.company || '',
      role: contact.role || '',
      email: contact.email || '',
      linkedinUrl: contact.linkedinUrl || '',
      mutualContext: contact.mutualContext || '',
      tags: contact.tags.join(', '),
    });
  };

  const handleCloseEditModal = () => {
    setEditingContact(null);
    setEditForm({
      fullName: '',
      company: '',
      role: '',
      email: '',
      linkedinUrl: '',
      mutualContext: '',
      tags: '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingContact) return;
    
    setSavingEdit(true);
    const contactId = editingContact.id;
    const updatePayload = {
      fullName: editForm.fullName,
      company: editForm.company,
      role: editForm.role,
      email: editForm.email,
      linkedinUrl: editForm.linkedinUrl,
      mutualContext: editForm.mutualContext,
      tags: editForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    
    try {
      // Call updateContact and ensure it resolves
      const updatePromise = updateContact(contactId, updatePayload);
      await updatePromise;
      
      // Close modal after successful update
      handleCloseEditModal();
    } catch (err) {
      console.error('Failed to update contact:', err);
      alert('Failed to update contact. Please try again.');
      // Don't close modal on error so user can retry
    } finally {
      // Always reset loading state, even if there was an error
      setSavingEdit(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Back to dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500"></p>
              <h1 className="text-3xl font-bold text-slate-900">Strategic Outreach Manager</h1>
              <p className="text-slate-600 max-w-2xl"></p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm min-w-[260px]">
            <p className="text-xs font-semibold text-slate-500 uppercase">Profile signal</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {profile?.targetRoles?.[0] || 'Add target role'}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {profile?.skills?.slice(0, 4).join(', ') || 'Add skills to personalize outreach.'}
            </p>
          </div>
        </div>
      </header>

      {loadingContacts ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-slate-500 animate-pulse">Loading contacts…</div>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {bucketed.map(({ stage, contacts: stageContacts }) => (
              <article
                key={stage}
                className={`bg-white border ${stageMeta[stage].accent} rounded-2xl p-4 shadow-sm flex flex-col`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{stageMeta[stage].label}</h2>
                    <p className="text-xs text-slate-500">{stageMeta[stage].helper}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-500">{stageContacts.length}</span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[480px] pr-2">
                  {stageContacts.length === 0 && (
                    <div className="border border-dashed border-slate-200 rounded-lg p-3 text-sm text-slate-400">
                      No contacts yet.
                    </div>
                  )}

                  {stageContacts.map((contact) => {
                    const isSelected = selectedIds.includes(contact.id);
                    const isActive = selectedContact?.id === contact.id;
                    const nextStage = getNextStage(contact.status);

                    return (
                      <div
                        key={contact.id}
                        className={`rounded-lg border p-3 cursor-pointer transition hover:border-indigo-300 relative ${
                          isActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'
                        }`}
                        onClick={() => setSelectedContactId(contact.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">{contact.fullName}</p>
                            <p className="text-xs text-slate-500">{contact.role || ''} {contact.role && contact.company ? '·' : ''} {contact.company || ''}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {getLastContactDate(contact) 
                                ? `Last contact: ${new Date(getLastContactDate(contact)!).toLocaleDateString()}`
                                : 'Never contacted'}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelection(contact.id);
                            }}
                          />
                        </div>

                        <div className="mt-2 text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
                            Priority: {contact.priority}
                          </span>
                          {contact.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {contact.activity.length > 0 && (
                          <div className="mt-3 border-t border-slate-100 pt-2">
                            <p className="text-xs font-semibold text-slate-500 mb-1">Recent activity</p>
                            <ul className="space-y-1">
                              {contact.activity.slice(-2).map((activity) => (
                                <li key={activity.id} className="text-xs text-slate-600">
                                  {new Date(activity.createdAt).toLocaleDateString()} · {activity.summary}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {nextStage && (
                          <Button
                            className="mt-3 w-full text-xs"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateContactStage(contact.id, nextStage);
                            }}
                          >
                            Move to {stageMeta[nextStage].label}
                          </Button>
                        )}

                        <button
                          className="absolute bottom-2 right-2 p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditContact(contact);
                          }}
                          aria-label="Edit contact"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>

          <section className="mt-8 grid grid-cols-1 xl:grid-cols-5 gap-6">
            <form
              onSubmit={handleCreateContact}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 xl:col-span-3"
            >
              <h3 className="text-lg font-semibold text-slate-900">Add Contact</h3>
              {[
                { key: 'fullName', label: 'Full name', required: true },
                { key: 'company', label: 'Company' },
                { key: 'role', label: 'Role' },
                { key: 'email', label: 'Email' },
                { key: 'linkedinUrl', label: 'LinkedIn URL' },
              ].map((field) => (
                <label key={field.key} className="text-sm font-medium text-slate-700 block">
                  {field.label}
                  <input
                    type="text"
                    required={field.required}
                    value={(contactForm as any)[field.key]}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </label>
              ))}

              <label className="text-sm font-medium text-slate-700 block">
                Mutual context
                <textarea
                  value={contactForm.mutualContext}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, mutualContext: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={2}
                />
              </label>

              <label className="text-sm font-medium text-slate-700 block">
                Tags (comma separated)
                <input
                  type="text"
                  value={contactForm.tags}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, tags: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </label>

              <Button type="submit" className="w-full" isLoading={creatingContact}>
                Save Contact
              </Button>
            </form>

            <div className="xl:col-span-2">
              <OutreachGenerator contact={selectedContact} />
            </div>
          </section>

          {selectedIds.length > 0 && (
            <section className="mt-8 bg-white border border-indigo-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Bulk Outreach · {selectedIds.length} contact(s) selected
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="ghost" onClick={() => setSelectedIds([])}>
                    Clear Selection
                  </Button>
                  <Button onClick={handleBulkSend} isLoading={bulkSending}>
                    Send with Template
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm font-medium text-slate-700 block">
                  Subject
                  <input
                    type="text"
                    value={bulkTemplate.subject}
                    onChange={(e) => setBulkTemplate((prev) => ({ ...prev, subject: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 block">
                  CTA
                  <input
                    type="text"
                    value={bulkTemplate.cta}
                    onChange={(e) => setBulkTemplate((prev) => ({ ...prev, cta: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 block md:col-span-2">
                  Opener
                  <textarea
                    value={bulkTemplate.opener}
                    onChange={(e) => setBulkTemplate((prev) => ({ ...prev, opener: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    rows={2}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 block md:col-span-2">
                  Body paragraphs (one per line)
                  <textarea
                    value={bulkTemplate.body.join('\n')}
                    onChange={(e) => setBulkTemplate((prev) => ({ ...prev, body: e.target.value.split('\n').filter(Boolean) }))}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    rows={3}
                  />
                </label>
              </div>

              {bulkError && (
                <p className="mt-3 text-sm text-rose-600">{bulkError}</p>
              )}
            </section>
          )}
        </>
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Edit Contact</h3>
              <button
                onClick={handleCloseEditModal}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <label className="text-sm font-medium text-slate-700 block">
                Full name *
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm font-medium text-slate-700 block">
                  Company
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, company: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700 block">
                  Role
                  <input
                    type="text"
                    value={editForm.role}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </label>
              </div>

              <label className="text-sm font-medium text-slate-700 block">
                Email
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </label>

              <label className="text-sm font-medium text-slate-700 block">
                LinkedIn URL
                <input
                  type="url"
                  value={editForm.linkedinUrl}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </label>

              <label className="text-sm font-medium text-slate-700 block">
                Mutual context
                <textarea
                  value={editForm.mutualContext}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, mutualContext: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                />
              </label>

              <label className="text-sm font-medium text-slate-700 block">
                Tags (comma separated)
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, tags: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </label>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleCloseEditModal}
                disabled={savingEdit}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                isLoading={savingEdit}
                disabled={!editForm.fullName.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkingCRM;
