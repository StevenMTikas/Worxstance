// Global Worxstance types. Extend these as the product matures.

export interface MasterProfile {
  id: string;
  fullName: string;
  headline?: string;
  location?: string;
  targetRoles?: string[];
}

export interface TrackedJob {
  id: string;
  title: string;
  company: string;
  url?: string;
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
}


