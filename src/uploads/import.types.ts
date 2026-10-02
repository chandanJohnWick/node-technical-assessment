export interface ImportRecord {
  agentName?: string;
  firstName: string;
  dob?: Date;
  address?: string;
  phoneNumber?: string;
  state?: string;
  zipCode?: string;
  email?: string;
  gender?: string;
  userType?: string;
  accountName?: string;
  categoryName?: string;
  companyName?: string;
  policyNumber?: string;
  policyStartDate?: Date;
  policyEndDate?: Date;
}

export type ImportWorkerResult = { records: ImportRecord[] } | { error: string };
