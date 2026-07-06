
export interface ProviderHealth {
  status: 'active' | 'disconnected' | 'rate_limited';
  score: number;
  details?: any;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface EmailProviderAdapter {
  validateCredentials(credentials: any): Promise<ValidationResult>;
  sendEmail(credentials: any, payload: any): Promise<{ messageId: string }>;
  fetchReplies(credentials: any, lastCheck: Date): Promise<any[]>;
  healthCheck(credentials: any): Promise<ProviderHealth>;
}
