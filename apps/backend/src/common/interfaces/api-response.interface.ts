export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T | null;
  error?: any | null;
  errors?: any[];
  meta: any | null;
}

export interface IPaginatedData<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
