import { z } from 'zod';

export const ExperienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Role is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  achievements: z.array(z.string()).default([]),
});

export const EducationSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().optional(),
  graduationDate: z.string().min(1, "Graduation date is required"),
  description: z.string().optional(),
});

export const CertificationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Certification name is required"),
  issuer: z.string().min(1, "Issuer is required"),
  date: z.string().min(1, "Date is required"),
  expiryDate: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
});

export const MasterProfileSchema = z.object({
  id: z.string(),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  headline: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  summary: z.string().optional(),
  targetRoles: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  experience: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  lastUpdated: z.string(),
});

export type MasterProfileFormData = z.infer<typeof MasterProfileSchema>;

