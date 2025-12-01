import { z } from 'zod';

export const ResumeTailorInputSchema = z.object({
  jobDescription: z.string().min(50, "Job description must be at least 50 characters long to provide meaningful context."),
  targetRole: z.string().optional(),
});

export type ResumeTailorInputData = z.infer<typeof ResumeTailorInputSchema>;

