import { z } from 'zod';

export const JobDiscoverySearchSchema = z.object({
  role: z.string().min(2, "Role must be at least 2 characters."),
  location: z.string().min(2, "Location must be at least 2 characters."),
  isRemote: z.boolean().default(false),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']).optional(),
});

export type JobDiscoverySearchData = z.infer<typeof JobDiscoverySearchSchema>;

