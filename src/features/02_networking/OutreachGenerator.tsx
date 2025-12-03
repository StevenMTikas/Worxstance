import React, { useMemo, useState } from 'react';
import { Button } from '../../components/common/Button';
import { useGemini } from '../../hooks/useGemini';
import { useMasterProfile } from '../../contexts/MasterProfileContext';
import { useNetworking } from '../../contexts/NetworkingContext';
import type { NetworkingContact, OutreachChannel } from '../../lib/types';
import { trackEvent } from '../../lib/analytics';
import {
  outreachDraftResponseSchema,
  parseOutreachDraft,
  OutreachDraft,
} from './schemas';

type TemplateType = 'intro' | 'warm_bump' | 'referral' | 'thank_you' | 'stay_in_contact';

interface OutreachGeneratorProps {
  contact: NetworkingContact | null;
}

const TEMPLATE_OPTIONS: { value: TemplateType; label: string; tone: string; }[] = [
  { value: 'intro', label: 'Cold Intro', tone: 'empathetic opener + specific hook' },
  { value: 'warm_bump', label: 'Warm Bump', tone: 'gracious reminder + value-add' },
  { value: 'referral', label: 'Referral Ask', tone: 'peer-to-peer, specific CTA' },
  { value: 'thank_you', label: 'Thank You', tone: 'grateful, mention interview insight' },
  { value: 'stay_in_contact', label: 'Stay in Contact', tone: 'maintain connection, share updates, keep door open' },
];

const OutreachGenerator: React.FC<OutreachGeneratorProps> = ({ contact }) => {
  const { callModel, loading } = useGemini();
  const { profile } = useMasterProfile();
  const { saveSequence, logActivity } = useNetworking();

  const [templateType, setTemplateType] = useState<TemplateType>('intro');
  const [channel, setChannel] = useState<OutreachChannel>('email');
  const [goal, setGoal] = useState('Book a 15-minute intro conversation');
  const [context, setContext] = useState('');
  const [draft, setDraft] = useState<OutreachDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const icpVoice = useMemo(() => (
    'Confident, empathetic coach voice. Reference mutual value, be specific, end with an actionable CTA.'
  ), []);

  const handleGenerate = async () => {
    if (!contact) {
      setError('Select a contact card to personalize the draft.');
      return;
    }

    setError(null);
    setDraft(null);

    const prompt = `
You are the Worxstance Strategic Outreach coach. Use the tone guidance from project-style-guide.pdf (empathetic, execution-focused) and content/email-sequence.pdf.

Contact Profile:
- Name: ${contact.fullName}
- Role: ${contact.role || 'Unknown role'}
- Company: ${contact.company || 'Unknown company'}
- Mutual context: ${contact.mutualContext || 'None provided'}
- Current pipeline stage: ${contact.status}

User (sender) Profile:
- Name: ${profile?.fullName ?? 'Worxstance Member'}
- Headline: ${profile?.headline ?? 'Top performer in growth tech'}
- Priority skills: ${(profile?.skills || []).slice(0, 5).join(', ') || 'Not specified'}

Goal: ${goal}
Additional context from user: ${context || 'N/A'}
Template style: ${templateType}. Channel: ${channel}.

Requirements:
- Subject line optimized for ${channel}.
- 1 short opener tied to mutual relevance.
- 2-3 concise body paragraphs (value, proof point, tie-back to them).
- CTA with a specific next step aligned to the goal.
- Personalization notes referencing ICP insights for follow-up tweaks.

Return JSON only.`;

    const result = await callModel({
      prompt,
      systemInstruction: `You must return structured outreach drafts as JSON. Voice reminder: ${icpVoice}`,
      temperature: 0.4,
      responseSchema: outreachDraftResponseSchema,
    });

    if (!result) {
      setError('Failed to generate draft. Please try again.');
      return;
    }

    try {
      const parsed = parseOutreachDraft(result);
      setDraft(parsed);
      trackEvent('crm_ai_draft_generated', { templateType, channel });
    } catch (err: any) {
      console.error('Parsing outreach draft failed', err);
      setError('AI response was not structured correctly. Try again.');
    }
  };

  const handleSaveDraft = async () => {
    if (!contact || !draft) {
      setError('Generate a draft before saving.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveSequence({
        contactId: contact.id,
        subject: draft.subject,
        opener: draft.opener,
        body: draft.body,
        cta: draft.cta,
        personalizationNotes: draft.personalizationNotes,
        channel,
        templateType,
      });

      await logActivity(contact.id, {
        type: 'ai_draft',
        summary: `AI drafted ${templateType} outreach via ${channel}`,
        sentiment: 'positive',
      });

      trackEvent('crm_draft_saved', { contactId: contact.id, templateType });
    } catch (err: any) {
      console.error('Failed to save draft', err);
      setError(err.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">AI Outreach Generator</h2>
        <p className="text-sm text-slate-500">Grounded in Worxstance ICP voice.</p>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`px-3 py-1 rounded-full text-sm border ${
                templateType === option.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-100 text-slate-700 border-transparent'
              }`}
              onClick={() => setTemplateType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-slate-700">
            Goal
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Book intro, request referral, etc."
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Channel
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as OutreachChannel)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="email">Email</option>
              <option value="linkedin">LinkedIn DM</option>
            </select>
          </label>
        </div>

        <label className="text-sm font-medium text-slate-700 block">
          Context or recent insight
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={3}
            placeholder="Reference trigger events, mutual contacts, or activity feed notes."
          />
        </label>

        <div className="flex items-center gap-3">
          <Button onClick={handleGenerate} isLoading={loading} disabled={!contact}>
            Generate Draft
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={!draft || saving}
            isLoading={saving}
          >
            Save Draft
          </Button>
          {!contact && (
            <span className="text-xs text-rose-600 font-medium">
              Select a contact from the board to unlock drafting.
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {draft && (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Subject</p>
              <p className="text-sm font-medium text-slate-900">{draft.subject}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
              <p className="text-sm text-slate-800">{draft.opener}</p>
              {draft.body.map((paragraph, idx) => (
                <p key={idx} className="text-sm text-slate-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
              <p className="text-sm font-semibold text-indigo-700">{draft.cta}</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700 mb-2">
                Personalization notes
              </p>
              <ul className="list-disc list-inside text-sm text-emerald-900 space-y-1">
                {draft.personalizationNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutreachGenerator;
