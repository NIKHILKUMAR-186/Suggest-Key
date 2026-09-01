export interface VerificationApplication {
  id: string;
  mentor_id: string;
  mentor_name: string;
  mentor_email: string;
  mentor_avatar?: string;
  category_id: string;
  category_name: string;
  license_number: string;
  issuing_authority: string;
  degree_title: string;
  institution: string;
  graduation_year: string;
  document_urls: { name: string; url: string; size: string; type: string }[];
  compliance_statement: boolean;
  status: 'pending_review' | 'approved' | 'rejected' | 'pending';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  audit_notes?: string;
}

export type MentorVerificationRequest = VerificationApplication;

const STORAGE_KEY_VERIFICATION = 'suggestkey_verification_queue';

const INITIAL_APPLICATIONS: VerificationApplication[] = [
  {
    id: 'ver-001',
    mentor_id: 'evelyn-vasquez',
    mentor_name: 'Dr. Evelyn Vasquez',
    mentor_email: 'evelyn.vasquez@suggestkey.com',
    mentor_avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    category_id: 'mental-health',
    category_name: 'Mental Health',
    license_number: 'PSY-NY-89421-CL',
    issuing_authority: 'New York State Board for Psychology',
    degree_title: 'Ph.D. in Clinical Psychology',
    institution: 'Columbia University',
    graduation_year: '2012',
    document_urls: [
      {
        name: 'NYS_Psychology_License_Verified_2025.pdf',
        url: '#',
        size: '2.4 MB',
        type: 'pdf',
      },
      {
        name: 'Columbia_PhD_Diploma_Certified.pdf',
        url: '#',
        size: '3.1 MB',
        type: 'pdf',
      },
    ],
    compliance_statement: true,
    status: 'approved',
    submitted_at: '2025-01-10T14:20:00Z',
    reviewed_at: '2025-01-15T10:00:00Z',
    reviewed_by: 'Platform Lead Auditor',
    audit_notes: 'Active licensing confirmed with NY State Board registry #89421-CL. Background credentials fully cleared.',
  },
  {
    id: 'ver-002',
    mentor_id: 'dr-alistair-chen',
    mentor_name: 'Dr. Alistair Chen',
    mentor_email: 'alistair.chen@suggestkey.com',
    mentor_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    category_id: 'relationship',
    category_name: 'Relationship',
    license_number: 'LMFT-CA-993821',
    issuing_authority: 'California Board of Behavioral Sciences',
    degree_title: 'Ph.D. in Marriage & Family Therapy',
    institution: 'Stanford University & Gottman Institute',
    graduation_year: '2014',
    document_urls: [
      {
        name: 'CA_LMFT_Board_License_2025.pdf',
        url: '#',
        size: '2.1 MB',
        type: 'pdf',
      },
      {
        name: 'Gottman_Method_Level_3_Certificate.pdf',
        url: '#',
        size: '1.9 MB',
        type: 'pdf',
      },
    ],
    compliance_statement: true,
    status: 'approved',
    submitted_at: '2025-01-08T11:00:00Z',
    reviewed_at: '2025-01-10T11:00:00Z',
    reviewed_by: 'Platform Lead Auditor',
    audit_notes: 'California BBS registry verified active. Gottman Level 3 certification authenticated.',
  },
  {
    id: 'ver-003',
    mentor_id: 'sarah-jenkins',
    mentor_name: 'Sarah Jenkins',
    mentor_email: 'sarah.jenkins@suggestkey.com',
    mentor_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    category_id: 'career',
    category_name: 'Career',
    license_number: 'EXEC-ADV-882190',
    issuing_authority: 'Executive Strategy Council & Wharton Alumni Network',
    degree_title: 'B.S. in Economics & Computational Finance',
    institution: 'Wharton School of the University of Pennsylvania',
    graduation_year: '2013',
    document_urls: [
      {
        name: 'Wharton_Degree_Verification.pdf',
        url: '#',
        size: '1.7 MB',
        type: 'pdf',
      },
    ],
    compliance_statement: true,
    status: 'approved',
    submitted_at: '2025-01-05T09:30:00Z',
    reviewed_at: '2025-01-08T09:30:00Z',
    reviewed_by: 'Platform Lead Auditor',
    audit_notes: 'Academic credential and venture executive track verified.',
  },
];

export class VerificationService {
  private static getStoredApplications(): VerificationApplication[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_VERIFICATION);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading verification queue', e);
    }
    localStorage.setItem(STORAGE_KEY_VERIFICATION, JSON.stringify(INITIAL_APPLICATIONS));
    return INITIAL_APPLICATIONS;
  }

  private static saveApplications(apps: VerificationApplication[]) {
    try {
      localStorage.setItem(STORAGE_KEY_VERIFICATION, JSON.stringify(apps));
    } catch (e) {
      console.warn('Error saving verification queue', e);
    }
  }

  /**
   * Get applications with filters
   */
  static async getApplications(filters?: {
    status?: string;
    categoryId?: string;
  }): Promise<VerificationApplication[]> {
    let all = this.getStoredApplications();
    if (filters?.status && filters.status !== 'all') {
      all = all.filter((a) => a.status === filters.status);
    }
    if (filters?.categoryId && filters.categoryId !== 'all') {
      all = all.filter((a) => a.category_id === filters.categoryId);
    }
    return all;
  }

  /**
   * Get application by Mentor ID
   */
  static async getApplicationByMentorId(mentorId: string): Promise<VerificationApplication | null> {
    const all = this.getStoredApplications();
    return all.find((a) => a.mentor_id === mentorId) || null;
  }

  /**
   * Submit new verification application from Mentor Studio
   */
  static async submitApplication(params: {
    mentorId: string;
    mentorName: string;
    mentorEmail: string;
    mentorAvatar?: string;
    categoryId: string;
    categoryName: string;
    licenseNumber: string;
    issuingAuthority: string;
    degreeTitle: string;
    institution: string;
    graduationYear: string;
    documentUrls?: { name: string; url: string; size: string; type: string }[];
  }): Promise<VerificationApplication> {
    const all = this.getStoredApplications();
    const existingIndex = all.findIndex((a) => a.mentor_id === params.mentorId && a.category_id === params.categoryId);

    const newApp: VerificationApplication = {
      id: `ver-${Date.now().toString().slice(-6)}`,
      mentor_id: params.mentorId,
      mentor_name: params.mentorName,
      mentor_email: params.mentorEmail,
      mentor_avatar: params.mentorAvatar,
      category_id: params.categoryId,
      category_name: params.categoryName,
      license_number: params.licenseNumber,
      issuing_authority: params.issuingAuthority,
      degree_title: params.degreeTitle,
      institution: params.institution,
      graduation_year: params.graduationYear,
      document_urls: params.documentUrls || [
        {
          name: 'Professional_License_Document.pdf',
          url: '#',
          size: '1.5 MB',
          type: 'pdf',
        },
      ],
      compliance_statement: true,
      status: 'pending_review',
      submitted_at: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      all[existingIndex] = newApp;
    } else {
      all.unshift(newApp);
    }

    this.saveApplications(all);
    return newApp;
  }

  /**
   * Admin approves verification
   */
  static async approveApplication(
    id: string,
    auditorName: string = 'Admin Auditor',
    notes: string = 'Verified against regulatory registry.'
  ): Promise<VerificationApplication | null> {
    const all = this.getStoredApplications();
    const index = all.findIndex((a) => a.id === id);
    if (index === -1) return null;

    all[index] = {
      ...all[index],
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: auditorName,
      audit_notes: notes,
    };

    this.saveApplications(all);
    return all[index];
  }

  /**
   * Admin rejects verification with reason
   */
  static async rejectApplication(
    id: string,
    auditorName: string = 'Admin Auditor',
    reason: string = 'Licensing credentials could not be verified in state database.'
  ): Promise<VerificationApplication | null> {
    const all = this.getStoredApplications();
    const index = all.findIndex((a) => a.id === id);
    if (index === -1) return null;

    all[index] = {
      ...all[index],
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: auditorName,
      audit_notes: reason,
    };

    this.saveApplications(all);
    return all[index];
  }

  static async getAllRequests(): Promise<MentorVerificationRequest[]> {
    return this.getApplications();
  }

  static async approveRequest(
    id: string,
    auditorName: string = 'Admin Auditor',
    notes: string = 'Verified against regulatory registry.'
  ): Promise<VerificationApplication | null> {
    return this.approveApplication(id, auditorName, notes);
  }

  static async rejectRequest(
    id: string,
    reason: string = 'Licensing credentials could not be verified.',
    auditorName: string = 'Admin Auditor'
  ): Promise<VerificationApplication | null> {
    return this.rejectApplication(id, auditorName, reason);
  }
}
