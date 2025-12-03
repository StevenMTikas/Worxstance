import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useFirestore } from '../hooks/useFirestore';
import { useUsageCounters } from '../hooks/useUsageCounters';
import { trackEvent } from '../lib/analytics';
import type {
  ContactActivity,
  ContactPriority,
  NetworkingContact,
  OutreachSequence,
  PipelineStage,
  OutreachChannel,
} from '../lib/types';

interface CreateContactPayload {
  fullName: string;
  role?: string;
  company?: string;
  email?: string;
  linkedinUrl?: string;
  location?: string;
  status?: PipelineStage;
  priority?: ContactPriority;
  tags?: string[];
  mutualContext?: string;
}

interface ActivityInput {
  type: ContactActivity['type'];
  summary: string;
  sentiment?: ContactActivity['sentiment'];
  metadata?: Record<string, unknown>;
}

interface OutreachSequencePayload {
  contactId: string;
  subject: string;
  opener: string;
  body: string[];
  cta: string;
  personalizationNotes: string[];
  channel: OutreachChannel;
  templateType: OutreachSequence['templateType'];
  status?: OutreachSequence['status'];
  sendMode?: OutreachSequence['sendMode'];
}

interface BulkTemplatePayload {
  subject: string;
  opener: string;
  body: string[];
  cta: string;
  personalizationNotes: string[];
  channel: OutreachChannel;
  templateType: OutreachSequence['templateType'];
}

interface NetworkingContextValue {
  contacts: NetworkingContact[];
  sequences: OutreachSequence[];
  loadingContacts: boolean;
  loadingSequences: boolean;
  createContact: (payload: CreateContactPayload) => Promise<string>;
  updateContact: (contactId: string, payload: Partial<CreateContactPayload>) => Promise<void>;
  updateContactStage: (contactId: string, nextStage: PipelineStage) => Promise<void>;
  logActivity: (contactId: string, activity: ActivityInput) => Promise<void>;
  saveSequence: (payload: OutreachSequencePayload) => Promise<string>;
  markSequenceSent: (sequenceId: string) => Promise<void>;
  bulkSendWithTemplate: (contactIds: string[], template: BulkTemplatePayload) => Promise<void>;
}

const NetworkingContext = createContext<NetworkingContextValue | undefined>(undefined);

const FREE_BULK_SEND_LIMIT = 20;

const personalize = (template: string, contact?: NetworkingContact): string => {
  if (!contact) return template;
  const firstName = contact.fullName.split(' ')[0] || contact.fullName;
  return template
    .replace(/{{firstName}}/gi, firstName)
    .replace(/{{company}}/gi, contact.company || 'your team');
};

export const NetworkingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useState<NetworkingContact[]>([]);
  const [sequences, setSequences] = useState<OutreachSequence[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingSequences, setLoadingSequences] = useState(true);

  const {
    subscribeToCollection,
    setDocument,
    updateDocument,
    isAuthReady,
    userId,
  } = useFirestore();
  const { assertWithinLimit } = useUsageCounters();

  useEffect(() => {
    if (!isAuthReady || !userId) {
      setContacts([]);
      setLoadingContacts(false);
      return;
    }

    setLoadingContacts(true);
    const unsubscribe = subscribeToCollection('networking_tracker', (data) => {
      setContacts((data as NetworkingContact[]) ?? []);
      setLoadingContacts(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, userId, subscribeToCollection]);

  useEffect(() => {
    if (!isAuthReady || !userId) {
      setSequences([]);
      setLoadingSequences(false);
      return;
    }

    setLoadingSequences(true);
    const unsubscribe = subscribeToCollection('outreach_sequences', (data) => {
      setSequences((data as OutreachSequence[]) ?? []);
      setLoadingSequences(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, userId, subscribeToCollection]);

  const createContact = useCallback(async (payload: CreateContactPayload) => {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    const contact: NetworkingContact = {
      id,
      fullName: payload.fullName,
      role: payload.role,
      company: payload.company,
      email: payload.email,
      linkedinUrl: payload.linkedinUrl,
      location: payload.location,
      status: payload.status ?? 'new',
      priority: payload.priority ?? 'medium',
      icpValueScore: payload.priority === 'high' ? 90 : payload.priority === 'low' ? 45 : 70,
      mutualContext: payload.mutualContext,
      tags: payload.tags ?? [],
      activity: [],
      nextStep: 'Personalize outreach using ICP template',
      lastInteractionAt: undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await setDocument('networking_tracker', id, contact);
    trackEvent('crm_contact_created', { stage: contact.status, priority: contact.priority });
    return id;
  }, [setDocument]);

  const updateContact = useCallback(async (contactId: string, payload: Partial<CreateContactPayload>) => {
    const timestamp = new Date().toISOString();
    const updateData: Partial<NetworkingContact> = {
      ...payload,
      tags: payload.tags,
      updatedAt: timestamp,
    };
    
    // Update the document - this returns a Promise that resolves when the write completes
    await updateDocument('networking_tracker', contactId, updateData);
    
    // Track event (non-blocking - don't await)
    try {
      trackEvent('crm_contact_updated', { contactId });
    } catch (err) {
      // Analytics errors shouldn't block the update
      console.warn('Failed to track contact update event:', err);
    }
  }, [updateDocument]);

  const updateContactStage = useCallback(async (contactId: string, nextStage: PipelineStage) => {
    const timestamp = new Date().toISOString();
    await updateDocument('networking_tracker', contactId, {
      status: nextStage,
      updatedAt: timestamp,
    });
    trackEvent('crm_stage_changed', { contactId, stage: nextStage });
  }, [updateDocument]);

  const logActivity = useCallback(async (contactId: string, activityInput: ActivityInput) => {
    const contact = contacts.find((c) => c.id === contactId);
    const timestamp = new Date().toISOString();
    const activity: ContactActivity = {
      id: uuidv4(),
      createdAt: timestamp,
      owner: 'user',
      ...activityInput,
    };

    const nextActivity = [...(contact?.activity ?? []), activity];
    await updateDocument('networking_tracker', contactId, {
      activity: nextActivity,
      lastInteractionAt: timestamp,
      updatedAt: timestamp,
    });
    trackEvent('crm_activity_logged', { contactId, type: activityInput.type });
  }, [contacts, updateDocument]);

  const saveSequence = useCallback(async (payload: OutreachSequencePayload) => {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    const sequence: OutreachSequence = {
      id,
      contactId: payload.contactId,
      subject: payload.subject,
      opener: payload.opener,
      body: payload.body,
      cta: payload.cta,
      personalizationNotes: payload.personalizationNotes,
      channel: payload.channel,
      templateType: payload.templateType,
      status: payload.status ?? 'draft',
      sendMode: payload.sendMode ?? 'single',
      createdAt: timestamp,
      updatedAt: timestamp,
      sentAt: payload.status === 'sent' ? timestamp : undefined,
    };

    await setDocument('outreach_sequences', id, sequence);
    trackEvent('crm_sequence_saved', { contactId: payload.contactId, status: sequence.status });
    return id;
  }, [setDocument]);

  const markSequenceSent = useCallback(async (sequenceId: string) => {
    const sequence = sequences.find((s) => s.id === sequenceId);
    const timestamp = new Date().toISOString();
    await updateDocument('outreach_sequences', sequenceId, {
      status: 'sent',
      sentAt: timestamp,
      updatedAt: timestamp,
    });

    if (sequence) {
      await logActivity(sequence.contactId, {
        type: 'email',
        summary: `Sent ${sequence.channel} outreach: ${sequence.subject}`,
        sentiment: 'positive',
      });
    }

    trackEvent('crm_sequence_sent', { sequenceId });
  }, [logActivity, sequences, updateDocument]);

  const bulkSendWithTemplate = useCallback(async (contactIds: string[], template: BulkTemplatePayload) => {
    if (contactIds.length === 0) return;

    await assertWithinLimit('networking_bulk_send_daily', FREE_BULK_SEND_LIMIT, contactIds.length, 'daily');
    const timestamp = new Date().toISOString();

    await Promise.all(contactIds.map(async (contactId) => {
      const contact = contacts.find((c) => c.id === contactId);
      const sequenceId = await saveSequence({
        contactId,
        subject: personalize(template.subject, contact),
        opener: personalize(template.opener, contact),
        body: template.body.map((paragraph) => personalize(paragraph, contact)),
        cta: personalize(template.cta, contact),
        personalizationNotes: template.personalizationNotes,
        channel: template.channel,
        templateType: template.templateType,
        status: 'sent',
        sendMode: 'bulk',
      });

      await updateDocument('outreach_sequences', sequenceId, {
        sentAt: timestamp,
        updatedAt: timestamp,
      });

      await logActivity(contactId, {
        type: 'email',
        summary: `Bulk ${template.templateType} outreach queued`,
        sentiment: 'neutral',
      });
    }));

    trackEvent('crm_bulk_send', {
      count: contactIds.length,
      templateType: template.templateType,
    });
  }, [assertWithinLimit, contacts, logActivity, saveSequence, updateDocument]);

  const value = useMemo<NetworkingContextValue>(() => ({
    contacts,
    sequences,
    loadingContacts,
    loadingSequences,
    createContact,
    updateContact,
    updateContactStage,
    logActivity,
    saveSequence,
    markSequenceSent,
    bulkSendWithTemplate,
  }), [
    contacts,
    sequences,
    loadingContacts,
    loadingSequences,
    createContact,
    updateContact,
    updateContactStage,
    logActivity,
    saveSequence,
    markSequenceSent,
    bulkSendWithTemplate,
  ]);

  return (
    <NetworkingContext.Provider value={value}>
      {children}
    </NetworkingContext.Provider>
  );
};

export const useNetworking = (): NetworkingContextValue => {
  const ctx = useContext(NetworkingContext);
  if (!ctx) {
    throw new Error('useNetworking must be used within a NetworkingProvider');
  }
  return ctx;
};

