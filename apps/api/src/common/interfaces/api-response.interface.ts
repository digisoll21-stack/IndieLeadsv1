
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    requestId: string;
    timestamp: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}
