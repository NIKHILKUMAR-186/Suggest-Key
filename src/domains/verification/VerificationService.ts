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
  licensing_board?: string;
  rejection_reason?: string;
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

export class VerificationService {
  /**
   * Get applications with filters
   * Real implementation must query the verification_applications table.
   * Returns an empty array when no real implementation is wired up.
   */
  static async getApplications(_filters?: {
    status?: string;
    categoryId?: string;
  }): Promise<VerificationApplication[]> {
    console.warn('VerificationService.getApplications has no real database implementation wired up.');
    return [];
  }

  /**
   * Get application by Mentor ID
   * Real implementation must query the verification_applications table.
   * Returns null when no real implementation is wired up.
   */
  static async getApplicationByMentorId(_mentorId: string): Promise<VerificationApplication | null> {
    console.warn('VerificationService.getApplicationByMentorId has no real database implementation wired up.');
    return null;
  }

  /**
   * Submit new verification application from Mentor Studio
   * Real implementation must insert into the verification_applications table.
   * Returns null when no real implementation is wired up.
   */
  static async submitApplication(_params: {
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
  }): Promise<VerificationApplication | null> {
    console.warn('VerificationService.submitApplication has no real database implementation wired up.');
    return null;
  }

  /**
   * Admin approves verification
   * Real implementation must update the verification_applications table.
   * Returns null when no real implementation is wired up.
   */
  static async approveApplication(
    _id: string,
    _auditorName: string = 'Admin Auditor',
    _notes: string = 'Verified against regulatory registry.'
  ): Promise<VerificationApplication | null> {
    console.warn('VerificationService.approveApplication has no real database implementation wired up.');
    return null;
  }

  /**
   * Admin rejects verification with reason
   * Real implementation must update the verification_applications table.
   * Returns null when no real implementation is wired up.
   */
  static async rejectApplication(
    _id: string,
    _auditorName: string = 'Admin Auditor',
    _reason: string = 'Licensing credentials could not be verified in state database.'
  ): Promise<VerificationApplication | null> {
    console.warn('VerificationService.rejectApplication has no real database implementation wired up.');
    return null;
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