import { z } from 'zod';

export const outreachDraftSchema = z.object({
  subject: z.string().min(5),
  opener: z.string().min(10),
  body: z.array(z.string().min(1)).min(1),
  cta: z.string().min(3),
  personalizationNotes: z.array(z.string().min(2)).default([]),
  followUpIdeas: z.array(z.string().min(2)).optional(),
});

export type OutreachDraft = z.infer<typeof outreachDraftSchema>;

export const outreachDraftResponseSchema = {
  type: 'object',
  properties: {
    subject: { type: 'string' },
    opener: { type: 'string' },
    body: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    },
    cta: { type: 'string' },
    personalizationNotes: {
      type: 'array',
      items: { type: 'string' },
    },
    followUpIdeas: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['subject', 'opener', 'body', 'cta', 'personalizationNotes'],
};

export const parseOutreachDraft = (payload: unknown): OutreachDraft => {
  return outreachDraftSchema.parse(payload);
};

