// Global Worxstance types.
// Derived from background/project-plan.pdf Section 1.1

// --- Master Profile ---
export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate?: string; // ISO date string or 'Present'
  location?: string;
  description?: string;
  achievements: string[]; // Key achievements/bullets
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  graduationDate: string; // ISO date string
  description?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string; // ISO date string
  expiryDate?: string;
  url?: string;
}

export interface MasterProfile {
  id: string; // Usually matches auth.uid
  fullName: string;
  email: string;
  headline?: string;
  location?: string;
  phone?: string;
  website?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  
  // Core resume data
  summary?: string;
  targetRoles: string[]; // Array of job titles user is targeting
  skills: string[]; // Comprehensive list of skills
  
  // Nested collections
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  
  lastUpdated: string; // ISO timestamp
}

// --- Job Discovery & Tracking ---
export type JobStatus = 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'archived';

export interface JobDetails {
  id: string;
  title: string;
  company: string;
  location?: string;
  salaryRange?: string;
  url?: string; // Link to JD
  description: string; // Full JD text
  status: JobStatus;
  dateAdded: string; // ISO timestamp
  dateApplied?: string;
  
  // Analysis data
  matchScore?: number; // 0-100
  keywords?: string[];
}

// Alias for backward compatibility if needed, or prefer JobDetails
export type TrackedJob = JobDetails;

export interface JobList {
  jobs: JobDetails[];
}

// --- Networking CRM ---
export type ContactStatus = 'new' | 'contacted' | 'replied' | 'meeting_scheduled' | 'ghosted' | 'connected';

export interface ContactData {
  id: string;
  name: string;
  role: string;
  company: string;
  platform: 'LinkedIn' | 'Email' | 'Twitter' | 'Other';
  status: ContactStatus;
  lastActionDate: string; // ISO timestamp
  notes?: string;
  email?: string;
  linkedinUrl?: string;
  outreachHistory?: {
    date: string;
    type: string; // 'connection_request', 'message', 'email'
    content?: string;
  }[];
}

// --- Skill Gap Analyzer ---
export interface SkillGapMissingSkill {
  skill: string;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'nice_to_have';
  reason: string;
}

export interface LearningAction {
  id: string; // generated UUID or index
  title: string; // Changed from skill/action combo to title/description for clarity
  description: string;
  estimatedTime: string;
  priority: 'high' | 'medium' | 'low';
  resourceUrl?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface GapReport {
  id: string;
  jobId?: string; // Reference to JobDetails.id (optional if ad-hoc analysis)
  jobTitle: string;
  company: string;
  matchScore: number;
  summary: string;
  missingSkills: SkillGapMissingSkill[];
  matchingSkills: string[];
  learningRoadmap: LearningAction[];
  generatedAt: string; // ISO timestamp
}

// --- STAR Story Builder ---
export interface STARStory {
  id: string;
  title: string; // Short identifier e.g. "Project Alpha Migration"
  originalAchievementId?: string; // Link to MasterProfile.experience.id
  targetJobId?: string; // If tailored for specific job
  
  situation: string;
  task: string;
  action: string;
  result: string;
  
  critiqueScore?: number; // 0-100 based on AI evaluation
  critiqueFeedback?: string; // AI feedback text
  
  tags: string[]; // Skills demonstrated e.g. "Leadership", "Python"
  createdAt: string;
}

// --- Mock Interview Simulator ---
export interface QnA {
  id: string;
  question: string;
  userAnswer: string; // Transcript or text
  aiFeedback: string;
  score: number; // 0-10
  sentiment?: 'positive' | 'neutral' | 'negative';
  improvements?: string[];
}

export interface InterviewSession {
  id: string;
  date: string; // ISO timestamp
  jobId?: string; // Linked job
  jobTitle?: string;
  type: 'behavioral' | 'technical' | 'mixed';
  overallScore: number;
  questions: QnA[];
  durationSeconds: number;
}

// --- Follow-Up Manager ---
export interface FollowUpHistory {
  id: string;
  interviewId?: string; // Link to InterviewSession or just manual
  jobId: string;
  interviewerName: string;
  interviewerRole?: string;
  interviewerEmail?: string;
  dateSent: string; // or dateDrafted
  
  keyDiscussionPoints: string[];
  draftedEmailBody: string;
  
  status: 'draft' | 'sent';
}

// --- Offer Negotiator ---
export interface NegotiationOffer {
  id: string;
  jobId: string;
  company: string;
  
  baseSalary: number;
  signingBonus: number;
  equityValue: number; // Annualized or total? Usually total grant value
  equityVestingYears: number;
  performanceBonus: number; // Target annual bonus
  relocationPackage?: number;
  benefitsValuation?: number;
  
  totalCompensation: number; // Calculated TC
  
  currency: string; // 'USD', 'EUR', etc.
  receivedDate: string;
}

export interface NegotiationStep {
  id: string;
  date: string;
  action: 'email_sent' | 'meeting' | 'offer_received' | 'counter_offer_sent';
  talkingPointsUsed: string[];
  companyResponse?: string;
  outcome?: 'positive' | 'negative' | 'neutral';
}

export interface NegotiationHistory {
  id: string;
  offerId: string;
  steps: NegotiationStep[];
  currentStatus: 'active' | 'accepted' | 'declined' | 'stalled';
}
